import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  Agent,
  ProviderTransport,
  type AgentEvent,
  type AgentState,
  type Attachment,
} from "@mariozechner/pi-agent-core";
import { getModel, getProviders, getModels, type Message, type TextContent, type KnownProvider, type Model, type Api } from "@mariozechner/pi-ai";

import { logVerbose, isVerbose } from "../globals.js";
import { loadSessionEnv } from "../env.js";
import { createTools, createSessionContext, WHATSAPP_BASE_PATH } from "./pi-agent-tools.js";
import {
  type Scratchpad,
  loadScratchpad,
  saveScratchpad,
  getSessionDir,
  getSharedContext,
  getSharedMemory,
} from "./pi-agent-scratchpad.js";
import { summarizeSession, extractSessionEntities } from "./pi-agent-summarizer.js";
import { discoverConventionSkills, getSkillRegistry } from "./skills/index.js";

export interface PiAgentConfig {
  model?: string;
  systemPrompt?: string;
  thinkingLevel?: "off" | "minimal" | "low" | "medium" | "high";
  timeoutMs?: number;
}

interface ProviderAuth {
  type: string;
  refresh?: string;
  access: string;
  expires?: number;
}

interface OAuthConfig {
  anthropic?: ProviderAuth;
  google?: ProviderAuth;
  openai?: ProviderAuth;
  [provider: string]: ProviderAuth | undefined;
}

// Custom provider model definition from ~/.pi/agent/models.json
interface CustomModelDef {
  id: string;
  name: string;
  api?: Api;
  reasoning?: boolean;
  input?: ("text" | "image")[];
  cost?: { input: number; output: number; cacheRead: number; cacheWrite: number };
  contextWindow?: number;
  maxTokens?: number;
}

interface CustomProviderDef {
  baseUrl: string;
  apiKey: string; // env var name or literal
  api: Api;
  models: CustomModelDef[];
}

interface CustomModelsConfig {
  providers?: Record<string, CustomProviderDef>;
}

const CUSTOM_MODELS_PATH = path.join(os.homedir(), ".pi", "agent", "models.json");
let cachedCustomModels: Map<string, Model<Api>> | null = null;
let cachedCustomProviderApiKeys: Map<string, string> | null = null; // provider -> apiKey config

/**
 * Load custom provider models from ~/.pi/agent/models.json
 */
async function loadCustomModels(): Promise<Map<string, Model<Api>>> {
  if (cachedCustomModels) return cachedCustomModels;

  cachedCustomModels = new Map();
  cachedCustomProviderApiKeys = new Map();

  try {
    const content = await fs.readFile(CUSTOM_MODELS_PATH, "utf8");
    const config: CustomModelsConfig = JSON.parse(content);

    if (config.providers) {
      for (const [providerName, providerDef] of Object.entries(config.providers)) {
        // Store API key config for this provider
        cachedCustomProviderApiKeys.set(providerName, providerDef.apiKey);

        for (const modelDef of providerDef.models) {
          const model: Model<Api> = {
            id: modelDef.id,
            name: modelDef.name,
            api: modelDef.api || providerDef.api,
            provider: providerName,
            baseUrl: providerDef.baseUrl,
            reasoning: modelDef.reasoning ?? false,
            input: modelDef.input ?? ["text"],
            cost: modelDef.cost ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: modelDef.contextWindow ?? 128000,
            maxTokens: modelDef.maxTokens ?? 8192,
          };
          cachedCustomModels.set(modelDef.id, model);
          logVerbose(`Loaded custom model: ${modelDef.id} from provider ${providerName}`);
        }
      }
    }
  } catch (err) {
    // No custom models file or invalid - that's fine
    logVerbose(`No custom models loaded: ${err}`);
  }

  return cachedCustomModels;
}

/**
 * Get API key for a custom provider - resolves env var names
 */
function getCustomProviderApiKey(provider: string): string | undefined {
  if (!cachedCustomProviderApiKeys) return undefined;
  const apiKeyConfig = cachedCustomProviderApiKeys.get(provider);
  if (!apiKeyConfig) return undefined;

  // Check if it's an env var name (all caps, underscores)
  if (/^[A-Z_][A-Z0-9_]*$/.test(apiKeyConfig)) {
    return process.env[apiKeyConfig];
  }
  // Otherwise treat as literal key
  return apiKeyConfig;
}

const DEFAULT_MODEL = "claude-haiku-4-5";

/**
 * Find model by ID - checks custom providers first, then built-in providers
 */
export async function findModel(modelId: string): Promise<{ provider: string; model: Model<Api> } | null> {
  // Check custom models first
  const customModels = await loadCustomModels();
  const customModel = customModels.get(modelId);
  if (customModel) {
    return { provider: customModel.provider, model: customModel };
  }

  // Fall back to built-in providers
  for (const provider of getProviders()) {
    const models = getModels(provider);
    const model = models.find(m => m.id === modelId);
    if (model) {
      return { provider, model: model as Model<Api> };
    }
  }
  return null;
}
const OAUTH_PATH = path.join(os.homedir(), ".pi", "agent", "oauth.json");
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

let cachedOAuth: OAuthConfig | null = null;

async function refreshAnthropicToken(refreshToken: string): Promise<{ access: string; refresh: string; expires: number }> {
  logVerbose("Refreshing Anthropic OAuth token...");

  const response = await fetch("https://console.anthropic.com/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${text}`);
  }

  const data = await response.json() as { access_token: string; refresh_token: string; expires_in: number };
  const expires = Date.now() + (data.expires_in * 1000);

  logVerbose(`Token refreshed, expires in ${Math.round(data.expires_in / 60)} minutes`);

  return {
    access: data.access_token,
    refresh: data.refresh_token,
    expires,
  };
}

async function loadOAuth(): Promise<OAuthConfig> {
  try {
    // Always read fresh from disk to pick up external refreshes
    const content = await fs.readFile(OAUTH_PATH, "utf8");
    const oauth: OAuthConfig = JSON.parse(content);

    // Check if token needs refresh
    if (oauth.anthropic) {
      const now = Date.now();
      const expires = oauth.anthropic.expires ?? 0;

      if (expires - now < TOKEN_REFRESH_BUFFER_MS && oauth.anthropic.refresh) {
        logVerbose(`Token expired or expiring soon (expires: ${new Date(expires).toISOString()}), refreshing...`);

        try {
          const newTokens = await refreshAnthropicToken(oauth.anthropic.refresh);
          oauth.anthropic.access = newTokens.access;
          oauth.anthropic.refresh = newTokens.refresh;
          oauth.anthropic.expires = newTokens.expires;

          // Save updated tokens back to file
          await fs.writeFile(OAUTH_PATH, JSON.stringify(oauth, null, 2));
          logVerbose("Saved refreshed tokens to disk");
        } catch (refreshErr) {
          logVerbose(`Token refresh failed: ${refreshErr}`);
          // Continue with existing token, might still work
        }
      }
    }

    cachedOAuth = oauth;
    return oauth;
  } catch (err) {
    throw new Error(`Failed to load Pi OAuth from ${OAUTH_PATH}: ${err}`);
  }
}

function createTransport(): ProviderTransport {
  return new ProviderTransport({
    getApiKey: async (provider) => {
      // Check custom provider API keys first
      const customKey = getCustomProviderApiKey(provider);
      if (customKey) {
        return customKey;
      }

      // Fall back to OAuth config
      const oauth = await loadOAuth();
      return (oauth as Record<string, ProviderAuth | undefined>)[provider]?.access;
    },
  });
}

/**
 * Load system prompt from file with session-level hierarchy:
 * 1. {sessionName}/SYSTEM.md - session-specific prompt (@phone or #groupname)
 *    (respects sharedContext config - if set, loads from shared session's SYSTEM.md)
 * 2. SYSTEM.md - fallback for all sessions
 *
 * Base path: ~/klaus/whatsapp/
 */
export async function loadSystemPrompt(sessionName?: string): Promise<string> {
  // Try session-specific prompt first (respects sharedContext via getSessionDir)
  if (sessionName) {
    const sessionDir = getSessionDir(sessionName);
    const sessionPromptPath = path.join(sessionDir, "SYSTEM.md");
    try {
      const content = await fs.readFile(sessionPromptPath, "utf8");
      logVerbose(`Loaded session-specific system prompt from ${sessionPromptPath}`);
      return content.trim();
    } catch {
      // Session-specific not found, fall through to global
    }
  }

  // Fallback to global SYSTEM.md
  const globalPromptPath = path.join(WHATSAPP_BASE_PATH, "SYSTEM.md");
  try {
    const content = await fs.readFile(globalPromptPath, "utf8");
    logVerbose(`Loaded global system prompt from ${globalPromptPath}`);
    return content.trim();
  } catch {
    logVerbose("No system prompt file found");
    return "";
  }
}

export interface AgentInstance {
  agent: Agent;
  lastActivity: number;
  messageCount: number;
  summarizing?: boolean;  // prevent concurrent summarization
  retryCount?: number;    // track failed summarization attempts
  promptQueue?: Promise<any>;  // queue to prevent concurrent prompts
}

/**
 * Manages per-sender Pi Agent instances with session persistence.
 */
export class PiAgentManager {
  private agents = new Map<string, AgentInstance>();
  private config: PiAgentConfig;
  private idleTimeoutMs: number;
  private maxMessagesBeforeSummarize = 300;
  private promptLocks = new Map<string, Promise<any>>();  // per-sender locks
  private pendingResets = new Map<string, Promise<void>>();  // tracks /new resets in progress
  private useEntityMemory: boolean;  // Feature flag for entity-based memory

  constructor(config: PiAgentConfig = {}, idleTimeoutMinutes = 720) {
    this.config = config;
    this.idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
    this.useEntityMemory = process.env.USE_ENTITY_MEMORY === "true";
    if (this.useEntityMemory) {
      logVerbose("Entity memory system enabled");
    }
  }

  private async createAgent(scratchpad: Scratchpad | null, sessionName: string, groupJid?: string): Promise<Agent> {
    const transport = createTransport();
    const agent = new Agent({ transport });

    // Create session context for tools (closure-based, race-condition safe)
    const sessionCtx = createSessionContext(sessionName);
    logVerbose(`Session sandbox: ${sessionCtx.sessionCwd}`);

    // Model priority: P1 session .env -> P2 warelay.json config -> P3 hardcoded default
    const modelId = process.env.PI_AGENT_MODEL || this.config.model || DEFAULT_MODEL;
    const found = await findModel(modelId);
    if (found) {
      agent.setModel(found.model);
      const source = process.env.PI_AGENT_MODEL ? "session .env" : (this.config.model ? "config" : "default");
      logVerbose(`Using model ${modelId} from provider ${found.provider} (source: ${source})`);
    } else {
      logVerbose(`Model ${modelId} not found, using default`);
      agent.setModel(getModel("anthropic", "claude-opus-4-5"));
    }

    // Build enhanced system prompt - load from file hierarchy, fallback to config
    let systemPrompt = await loadSystemPrompt(sessionName);
    if (!systemPrompt) {
      systemPrompt = this.config.systemPrompt || "";
    }

    // Add session file path info
    const sessionInfo = `\nYour working directory: ~/klaus/whatsapp/${sessionName}/scratchpad/\nSession memory is stored in ~/klaus/whatsapp/${sessionName}/session.md (auto-managed).\n`;

    // Prepend structured memory (only if non-empty)
    // Use entity memory if enabled, otherwise fall back to legacy scratchpad
    if (this.useEntityMemory) {
      const memoryBlock = await this.buildEntityMemoryBlock(sessionName);
      if (memoryBlock) {
        systemPrompt = memoryBlock + sessionInfo + systemPrompt;
      } else {
        systemPrompt = sessionInfo + systemPrompt;
      }
    } else {
      // Legacy memory injection
      const memory = scratchpad?.memory;
      const hasMemory = memory && (
        memory.people.length > 0 ||
        memory.decisions.length > 0 ||
        memory.tasks.length > 0 ||
        memory.facts.length > 0
      );

      if (hasMemory) {
        const sections: string[] = ["Memory from previous sessions (context only - do not act on these unless explicitly asked):"];

        if (memory.people.length > 0) {
          sections.push("\n## People");
          sections.push(memory.people.map((p) => `- ${p}`).join("\n"));
        }
        if (memory.decisions.length > 0) {
          sections.push("\n## Decisions");
          sections.push(memory.decisions.map((d) => `- ${d}`).join("\n"));
        }
        if (memory.tasks.length > 0) {
          sections.push("\n## Things to follow up on (when relevant)");
          sections.push(memory.tasks.map((t) => `- ${t}`).join("\n"));
        }
        if (memory.facts.length > 0) {
          sections.push("\n## Facts");
          sections.push(memory.facts.map((f) => `- ${f}`).join("\n"));
        }

        const memoryBlock = sections.join("\n") + "\n";
        systemPrompt = memoryBlock + sessionInfo + systemPrompt;
        const totalItems = memory.people.length + memory.decisions.length + memory.tasks.length + memory.facts.length;
        logVerbose(`Injected ${totalItems} structured memory items into system prompt`);
      } else {
        systemPrompt = sessionInfo + systemPrompt;
      }
    }

    // Add handoff from sharedContext session if sharedMemory is enabled
    const handoffBlock = await this.buildHandoffBlock(sessionName);
    if (handoffBlock) {
      systemPrompt = handoffBlock + systemPrompt;
    }

    // Discover convention skills
    const conventionSkills = await discoverConventionSkills({
      workspacePath: WHATSAPP_BASE_PATH,
      sessionName,
    });

    // Add convention skills to system prompt
    if (conventionSkills.systemPromptSection) {
      systemPrompt += "\n\n" + conventionSkills.systemPromptSection;
    }

    // Add programmatic skills to system prompt
    const registry = getSkillRegistry();
    const programmaticPromptAdditions = registry.getSystemPromptAdditions();
    if (programmaticPromptAdditions) {
      systemPrompt += "\n\n" + programmaticPromptAdditions;
    }

    agent.setSystemPrompt(systemPrompt);

    if (this.config.thinkingLevel) {
      agent.setThinkingLevel(this.config.thinkingLevel);
    }

    // Create session-specific tools (with sandbox paths captured in closures)
    const sessionTools = createTools(sessionName);
    const skillTools = registry.getAllTools();
    const combinedTools = [...sessionTools, ...skillTools];
    agent.setTools(combinedTools);
    logVerbose(`Pi agent created with ${combinedTools.length} tools: ${combinedTools.map((t) => t.name).join(", ")}`);

    // Restore last 24 recent turns as session context block with silent warm-up
    // Context is sent as turn 1, model acks (discarded), then real messages start at turn 2
    // Can be disabled per-session via SKIP_CONTEXT_WARMUP=true in session .env
    const skipWarmup = process.env.SKIP_CONTEXT_WARMUP === "true";

    // Get recent turns - from entity memory state or legacy scratchpad
    let recentTurns: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (this.useEntityMemory) {
      const { loadMemoryState } = await import("./memory/index.js");
      const state = await loadMemoryState(sessionName);
      recentTurns = state?.recentTurns ?? [];
    } else {
      recentTurns = scratchpad?.recentTurns ?? [];
    }

    if (!skipWarmup && recentTurns.length > 0) {
      const lastTurns = recentTurns.slice(-24);
      // Format turns as a single context block
      const contextLines: string[] = [];
      for (const turn of lastTurns) {
        const prefix = turn.role === "user" ? "U:" : "A:";
        contextLines.push(`${prefix} ${turn.content}`);
      }
      const contextBlock = `<session_context>\n${contextLines.join("\n")}\n</session_context>\n\nAbove is conversation history for context. Acknowledge briefly.`;

      // Silent warm-up: send context, get ack, discard response
      // This ensures context is processed as a separate turn before real messages
      logVerbose(`Sending ${lastTurns.length} recent turns (of ${recentTurns.length}) as context warm-up`);
      await agent.prompt(contextBlock);
      await agent.waitForIdle();
      logVerbose(`Context warm-up complete, agent ready for new messages`);
    } else if (skipWarmup) {
      logVerbose(`Context warm-up skipped (SKIP_CONTEXT_WARMUP=true)`);
    }

    return agent;
  }

  async getOrCreateAgent(sessionName: string, groupJid?: string): Promise<{ agent: Agent; isNew: boolean }> {
    // Wait for any pending reset (/new) to complete before proceeding
    const pendingReset = this.pendingResets.get(sessionName);
    if (pendingReset) {
      logVerbose(`Waiting for pending reset to complete for ${sessionName}`);
      await pendingReset;
      logVerbose(`Pending reset complete for ${sessionName}, creating new agent`);
    }

    const existing = this.agents.get(sessionName);
    const now = Date.now();

    // Check if existing agent should be summarized (idle timeout or size guard)
    if (existing) {
      const idleTime = now - existing.lastActivity;
      const shouldSummarize =
        idleTime >= this.idleTimeoutMs ||
        existing.messageCount >= this.maxMessagesBeforeSummarize;

      if (!shouldSummarize) {
        existing.lastActivity = now;
        return { agent: existing.agent, isNew: false };
      }

      // Trigger summarization (fire and forget - don't block new session)
      logVerbose(
        `Agent for ${sessionName} needs summarization (idle: ${Math.round(idleTime / 60000)}min, msgs: ${existing.messageCount})`
      );
      this.triggerSummarization(sessionName, existing);
    }

    // Load session-specific .env (e.g., ~/klaus/whatsapp/@17206598123/.env)
    loadSessionEnv(sessionName);

    // Create new agent with scratchpad context
    const scratchpad = await loadScratchpad(sessionName, groupJid);
    const agent = await this.createAgent(scratchpad, sessionName, groupJid);
    this.agents.set(sessionName, {
      agent,
      lastActivity: now,
      messageCount: 0,
    });
    logVerbose(`Created new Pi agent for ${sessionName}`);
    return { agent, isNew: true };
  }

  /**
   * Summarize and save session state before evicting agent
   */
  private async triggerSummarization(
    senderId: string,
    instance: AgentInstance
  ): Promise<void> {
    if (instance.summarizing) {
      logVerbose(`Summarization already in progress for ${senderId}`);
      return;
    }
    instance.summarizing = true;

    try {
      const messages = instance.agent.state.messages;

      if (this.useEntityMemory) {
        // Use entity extraction instead of summarization
        const { needsMigration, migrateSessionToEntityMemory } = await import("./memory/index.js");

        // Migrate legacy session.md if needed
        if (await needsMigration(senderId)) {
          logVerbose(`Migrating ${senderId} to entity memory...`);
          await migrateSessionToEntityMemory(senderId);
        }

        await extractSessionEntities(messages, senderId);
        logVerbose(`Entity extraction complete for ${senderId}`);
      } else {
        // Legacy summarization
        const existingScratchpad = await loadScratchpad(senderId);
        const result = await summarizeSession(messages, existingScratchpad);
        await saveScratchpad(senderId, result);
      }

      // Success - evict agent
      instance.agent.abort();
      this.agents.delete(senderId);
      logVerbose(`Summarized and evicted session for ${senderId}`);
    } catch (err) {
      instance.retryCount = (instance.retryCount ?? 0) + 1;
      instance.summarizing = false;

      if (instance.retryCount < 2) {
        // First failure: extend timeout for retry
        instance.lastActivity = Date.now();
        logVerbose(`Summarization failed for ${senderId}, will retry: ${err}`);
      } else {
        // Second failure: evict anyway to prevent infinite memory growth
        console.warn(
          `[pi-agent] WARNING: Summarization failed twice for ${senderId}, evicting without save: ${err}`
        );
        instance.agent.abort();
        this.agents.delete(senderId);
      }
    }
  }

  /**
   * Build entity memory block for system prompt injection.
   */
  private async buildEntityMemoryBlock(sessionName: string): Promise<string | null> {
    try {
      const { getMemorySummary, hasEntityMemory, needsMigration, migrateSessionToEntityMemory } = await import("./memory/index.js");

      // Check if entity memory exists
      if (!(await hasEntityMemory(sessionName))) {
        // Try migration if legacy exists
        if (await needsMigration(sessionName)) {
          logVerbose(`Migrating ${sessionName} to entity memory on first load...`);
          await migrateSessionToEntityMemory(sessionName);
        } else {
          return null;
        }
      }

      const summary = await getMemorySummary(sessionName);

      // Check if we have any memory to inject
      const hasEntities = summary.entities.length > 0;
      const hasDecisions = summary.decisions.length > 0;
      const hasFacts = summary.facts.length > 0;
      const hasTasks = summary.tasks.length > 0;

      if (!hasEntities && !hasDecisions && !hasFacts && !hasTasks) {
        return null;
      }

      const sections: string[] = ["Memory from previous sessions (context only - do not act on these unless explicitly asked):"];

      // Format entities (people and others)
      const people = summary.entities.filter((e) => e.type === "person");
      const otherEntities = summary.entities.filter((e) => e.type !== "person");

      if (people.length > 0) {
        sections.push("\n## People");
        for (const entity of people) {
          const props = entity.properties
            .map((p) => p.value)
            .join("; ");
          sections.push(`- ${entity.name}${props ? `: ${props}` : ""}`);
        }
      }

      if (otherEntities.length > 0) {
        sections.push("\n## Known Entities");
        for (const entity of otherEntities) {
          const props = entity.properties
            .map((p) => p.value)
            .join("; ");
          sections.push(`- ${entity.name} (${entity.type})${props ? `: ${props}` : ""}`);
        }
      }

      if (hasDecisions) {
        sections.push("\n## Decisions");
        sections.push(summary.decisions.map((d) => `- ${d.content}`).join("\n"));
      }

      if (hasTasks) {
        sections.push("\n## Things to follow up on (when relevant)");
        sections.push(summary.tasks.map((t) => `- ${t.content}`).join("\n"));
      }

      if (hasFacts) {
        sections.push("\n## Facts");
        sections.push(summary.facts.map((f) => `- ${f.content}`).join("\n"));
      }

      const memoryBlock = sections.join("\n") + "\n";
      const totalItems = summary.entities.length + summary.decisions.length + summary.facts.length + summary.tasks.length;
      logVerbose(`Injected ${totalItems} entity memory items into system prompt`);

      return memoryBlock;
    } catch (err) {
      logVerbose(`Failed to build entity memory block: ${err}`);
      return null;
    }
  }

  /**
   * Build handoff block from sharedContext session for cross-session memory sharing.
   * Only builds if sharedMemory is enabled and sharedContext is configured.
   */
  private async buildHandoffBlock(sessionName: string): Promise<string | null> {
    try {
      // Check if sharedMemory is enabled
      if (!getSharedMemory(sessionName)) {
        return null;
      }

      // Get the sharedContext session
      const sharedSession = getSharedContext(sessionName);
      if (!sharedSession) {
        logVerbose(`sharedMemory enabled but no sharedContext configured for ${sessionName}`);
        return null;
      }

      // Load handoff from the shared session
      const { loadHandoff } = await import("./memory/index.js");
      const handoff = await loadHandoff(sharedSession);

      if (!handoff) {
        logVerbose(`No handoff found for shared session ${sharedSession}`);
        return null;
      }

      // Check if handoff has any content
      const hasContent = handoff.summary ||
        handoff.decisions.length > 0 ||
        handoff.currentTasks.length > 0 ||
        handoff.handoffNotes.length > 0;

      if (!hasContent) {
        return null;
      }

      // Build the handoff block
      const sections: string[] = [`\nHandoff from ${sharedSession} (last updated: ${handoff.lastUpdated}):`];

      if (handoff.summary) {
        sections.push(`\n${handoff.summary}`);
      }

      if (handoff.decisions.length > 0) {
        sections.push("\n## Recent Decisions");
        sections.push(handoff.decisions.map((d) => `- ${d}`).join("\n"));
      }

      if (handoff.currentTasks.length > 0) {
        sections.push("\n## In Progress");
        sections.push(handoff.currentTasks.map((t) => `- ${t}`).join("\n"));
      }

      if (handoff.handoffNotes.length > 0) {
        sections.push("\n## Notes");
        sections.push(handoff.handoffNotes.map((n) => `- ${n}`).join("\n"));
      }

      const handoffBlock = sections.join("\n") + "\n";
      logVerbose(`Loaded handoff from ${sharedSession} for ${sessionName}`);

      return handoffBlock;
    } catch (err) {
      logVerbose(`Failed to build handoff block: ${err}`);
      return null;
    }
  }

  async prompt(
    sessionName: string,
    message: string,
    options: { timeoutMs?: number; mediaPath?: string; mediaType?: string; groupJid?: string } = {}
  ): Promise<{ text: string; isNew: boolean; messageCount: number }> {
    // Queue prompts per session to prevent concurrent access to same agent
    const existingLock = this.promptLocks.get(sessionName) ?? Promise.resolve();

    const doPrompt = async (): Promise<{ text: string; isNew: boolean; messageCount: number }> => {
      // Wait for any existing prompt to complete first
      await existingLock.catch(() => {}); // ignore errors from previous prompt

      const { agent, isNew } = await this.getOrCreateAgent(sessionName, options.groupJid);
      const instance = this.agents.get(sessionName)!;
      instance.messageCount++;

      const timeoutMs = options.timeoutMs || this.config.timeoutMs || 120000;
      let responseText = "";

      // Build attachments from media if provided
      let attachments: Attachment[] | undefined;
      if (options.mediaPath && options.mediaType?.startsWith("image/")) {
        try {
          const imageBuffer = await fs.readFile(options.mediaPath);
          const base64Content = imageBuffer.toString("base64");
          const fileName = path.basename(options.mediaPath);
          attachments = [
            {
              id: `img-${Date.now()}`,
              type: "image",
              fileName,
              mimeType: options.mediaType,
              size: imageBuffer.length,
              content: base64Content,
            },
          ];
          logVerbose(`Created image attachment: ${fileName} (${imageBuffer.length} bytes)`);
        } catch (err) {
          logVerbose(`Failed to read image for attachment: ${err}`);
        }
      }

      // Subscribe to events to capture response
      const unsubscribe = agent.subscribe((event: AgentEvent) => {
        if (isVerbose()) {
          logVerbose(`Pi agent event: ${event.type}`);
        }
      });

      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Agent timeout")), timeoutMs);
        });

        // Run prompt with timeout (with optional image attachments)
        await Promise.race([agent.prompt(message, attachments), timeoutPromise]);
        await agent.waitForIdle();

        // Extract text from the LAST assistant message that has text content
        // Walk backwards to find it, skipping empty messages after tool calls
        const messages = agent.state.messages;

        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          // Stop when we hit a user message (start of current turn)
          if ("role" in msg && msg.role === "user") break;

          // Check if this assistant message has text content
          if ("content" in msg && Array.isArray(msg.content)) {
            const texts = msg.content
              .filter((c): c is TextContent => c.type === "text")
              .map((c) => c.text)
              .filter((t) => t.trim().length > 0);
            if (texts.length > 0) {
              responseText = texts.join("\n");
              break; // Found the last message with text, stop here
            }
          }
        }

        instance.lastActivity = Date.now();

        return {
          text: responseText,
          isNew,
          messageCount: instance.messageCount,
        };
      } catch (err) {
        agent.abort();
        throw err;
      } finally {
        unsubscribe();
      }
    };

    // Set up the lock and execute
    const promptPromise = doPrompt();
    this.promptLocks.set(sessionName, promptPromise);

    try {
      return await promptPromise;
    } finally {
      // Clean up lock if this was the last one
      if (this.promptLocks.get(sessionName) === promptPromise) {
        this.promptLocks.delete(sessionName);
      }
    }
  }

  resetSession(sessionName: string): boolean {
    const instance = this.agents.get(sessionName);
    if (!instance) {
      return false;
    }

    // If already resetting, don't start another
    if (this.pendingResets.has(sessionName)) {
      logVerbose(`Reset already in progress for ${sessionName}`);
      return true;
    }

    logVerbose(`Reset requested for ${sessionName}, queuing summarization`);

    // Create a promise that resolves after summarization completes
    const resetPromise = (async () => {
      try {
        // Perform synchronous summarization (not fire-and-forget)
        if (!instance.summarizing) {
          instance.summarizing = true;
          const messages = instance.agent.state.messages;

          if (this.useEntityMemory) {
            // Use entity extraction instead of summarization
            const { needsMigration, migrateSessionToEntityMemory } = await import("./memory/index.js");

            // Migrate legacy session.md if needed
            if (await needsMigration(sessionName)) {
              logVerbose(`Migrating ${sessionName} to entity memory during reset...`);
              await migrateSessionToEntityMemory(sessionName);
            }

            await extractSessionEntities(messages, sessionName);
            logVerbose(`Entity extraction complete for ${sessionName} during reset`);
          } else {
            // Legacy summarization
            const existingScratchpad = await loadScratchpad(sessionName);
            const result = await summarizeSession(messages, existingScratchpad);
            await saveScratchpad(sessionName, result);
            logVerbose(`Summarization complete for ${sessionName} during reset`);
          }
        }
      } catch (err) {
        console.warn(`[pi-agent] WARNING: Summarization/extraction failed during reset for ${sessionName}: ${err}`);
      } finally {
        // Always clean up: abort agent and remove from map
        instance.agent.abort();
        this.agents.delete(sessionName);
        this.pendingResets.delete(sessionName);
        logVerbose(`Reset complete for ${sessionName}, agent evicted`);
      }
    })();

    this.pendingResets.set(sessionName, resetPromise);
    return true;
  }

  getSessionInfo(sessionName: string): { messageCount: number; idleMs: number } | null {
    const instance = this.agents.get(sessionName);
    if (!instance) return null;
    return {
      messageCount: instance.messageCount,
      idleMs: Date.now() - instance.lastActivity,
    };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [senderId, instance] of this.agents) {
      if (now - instance.lastActivity > this.idleTimeoutMs) {
        // Trigger summarization before cleanup
        logVerbose(`Cleanup: triggering summarization for idle agent ${senderId}`);
        this.triggerSummarization(senderId, instance);
      }
    }
  }

  get activeAgentCount(): number {
    return this.agents.size;
  }
}

// Singleton manager instance
let globalManager: PiAgentManager | null = null;

export function getPiAgentManager(config?: PiAgentConfig, idleMinutes?: number): PiAgentManager {
  if (!globalManager) {
    globalManager = new PiAgentManager(config, idleMinutes);
  }
  return globalManager;
}

export function resetPiAgentManager(): void {
  if (globalManager) {
    for (const senderId of [...globalManager["agents"].keys()]) {
      globalManager.resetSession(senderId);
    }
    globalManager = null;
  }
}
