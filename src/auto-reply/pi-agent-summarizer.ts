// Session summarizer for pi-agent - uses pi-agent to create scratchpad content
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { Agent, ProviderTransport } from "@mariozechner/pi-agent-core";
import { getModel, type Message, type TextContent } from "@mariozechner/pi-ai";
import { logVerbose } from "../globals.js";
import {
  type Scratchpad,
  type Memory,
  parseScratchpad,
  extractRecentTurns,
} from "./pi-agent-scratchpad.js";

const OAUTH_PATH = path.join(os.homedir(), ".pi", "agent", "oauth.json");
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const MAX_MESSAGES_TO_SUMMARIZE = 150;
const SUMMARIZER_MODEL = "claude-haiku-4-5";

interface OAuthConfig {
  anthropic?: {
    type: string;
    refresh: string;
    access: string;
    expires?: number;
  };
}

/**
 * Refresh the Anthropic OAuth token if needed
 */
async function refreshAnthropicToken(refreshToken: string): Promise<{ access: string; refresh: string; expires: number }> {
  logVerbose("Refreshing Anthropic OAuth token for summarizer...");

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

  return {
    access: data.access_token,
    refresh: data.refresh_token,
    expires,
  };
}

/**
 * Load OAuth config and refresh token if needed
 */
async function loadOAuth(): Promise<OAuthConfig> {
  const content = await fs.readFile(OAUTH_PATH, "utf8");
  const oauth: OAuthConfig = JSON.parse(content);

  if (!oauth.anthropic) {
    throw new Error("No Anthropic OAuth config found");
  }

  const now = Date.now();
  const expires = oauth.anthropic.expires ?? 0;

  if (expires - now < TOKEN_REFRESH_BUFFER_MS) {
    logVerbose("Token expired or expiring soon, refreshing...");
    const newTokens = await refreshAnthropicToken(oauth.anthropic.refresh);
    oauth.anthropic.access = newTokens.access;
    oauth.anthropic.refresh = newTokens.refresh;
    oauth.anthropic.expires = newTokens.expires;
    await fs.writeFile(OAUTH_PATH, JSON.stringify(oauth, null, 2));
  }

  return oauth;
}

/**
 * Create a transport for the summarizer agent
 */
function createTransport(): ProviderTransport {
  return new ProviderTransport({
    getApiKey: async (provider) => {
      if (provider === "anthropic") {
        const oauth = await loadOAuth();
        return oauth.anthropic?.access;
      }
      return undefined;
    },
  });
}

/**
 * Format messages for the summarizer prompt
 */
function formatMessagesForSummary(messages: Message[]): string {
  const lines: string[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      const content = typeof msg.content === "string"
        ? msg.content
        : (msg.content as Array<{ type: string; text?: string }>)
            .filter((c) => c.type === "text")
            .map((c) => c.text || "")
            .join("\n");

      if (content.trim()) {
        lines.push(`U: ${content.trim()}`);
      }
    } else if (msg.role === "assistant") {
      const content = (msg.content as Array<{ type: string; text?: string }>)
        .filter((c) => c.type === "text")
        .map((c) => c.text || "")
        .join("\n");

      if (content.trim()) {
        lines.push(`A: ${content.trim()}`);
      }
    }
    // Skip toolResult messages for readability
  }

  return lines.join("\n\n");
}

/**
 * Format existing memory for the summarizer prompt
 */
function formatExistingMemory(memory: Memory | undefined): string {
  if (!memory) return "None";

  const sections: string[] = [];

  if (memory.people.length > 0) {
    sections.push(`### people\n${memory.people.map(p => `- ${p}`).join("\n")}`);
  }
  if (memory.decisions.length > 0) {
    sections.push(`### decisions\n${memory.decisions.map(d => `- ${d}`).join("\n")}`);
  }
  if (memory.tasks.length > 0) {
    sections.push(`### tasks\n${memory.tasks.map(t => `- ${t}`).join("\n")}`);
  }
  if (memory.facts.length > 0) {
    sections.push(`### facts\n${memory.facts.map(f => `- ${f}`).join("\n")}`);
  }

  return sections.length > 0 ? sections.join("\n\n") : "None";
}

/**
 * Build the summarizer prompt
 */
function buildSummarizerPrompt(messages: Message[], existingScratchpad: Scratchpad | null): string {
  const existingMemory = formatExistingMemory(existingScratchpad?.memory);

  // Cap messages to prevent huge prompts
  const cappedMessages = messages.slice(-MAX_MESSAGES_TO_SUMMARIZE);
  const wasTruncated = messages.length > MAX_MESSAGES_TO_SUMMARIZE;

  const conversationText = formatMessagesForSummary(cappedMessages);

  return `You are summarizing a WhatsApp conversation session for future reference.

## Existing memory (preserve and merge):
${existingMemory}

## Recent conversation${wasTruncated ? " (truncated - older messages omitted)" : ""}:
${conversationText}

## Output format (Markdown):
## summary
- <key topic or decision>
- ...

## memory

### people
- <person's name/identifier>: <who they are, their preferences, relationship>
- ...

### decisions
- <decision or commitment made>
- ...

### tasks
- <pending action item or todo>
- ...

### facts
- <important context, general knowledge, user preferences>
- ...

## Rules:
- summary: Main topics discussed, decisions made, problems solved (max 10 items)
- memory.people: Names and info about people mentioned (max 15 items)
- memory.decisions: Things agreed upon, commitments, explicit rules (max 10 items)
- memory.tasks: Pending action items, todos, things to do later (max 10 items)
- memory.facts: Important context, preferences, explicit "remember this" requests (max 15 items)
- MERGE existing memory items - preserve prior memories, deduplicate similar items
- Mark completed tasks as done or remove them
- If conversation was truncated, still capture ALL high-signal information
- Keep each bullet concise (1 line)
- Output ONLY the markdown sections, no preamble`;
}

/**
 * Parse the LLM response into structured data
 */
function parseSummarizerResponse(response: string): { summary: string[]; memory: Memory } {
  // Use the existing parseScratchpad function to parse structured memory
  const parsed = parseScratchpad(response);

  return {
    summary: parsed.summary,
    memory: parsed.memory,
  };
}

/**
 * Call the summarizer using pi-agent (handles OAuth properly)
 */
async function callSummarizerWithAgent(prompt: string): Promise<string> {
  const transport = createTransport();
  const agent = new Agent({ transport });

  // Set model
  try {
    const model = getModel("anthropic", SUMMARIZER_MODEL as any);
    agent.setModel(model);
  } catch {
    agent.setModel(getModel("anthropic", "claude-haiku-4-5-20251001"));
  }

  // Set system prompt for summarization
  agent.setSystemPrompt("You are a helpful assistant that summarizes conversations. Output only the requested format, no preamble.");

  // Enable medium thinking for better summarization
  agent.setThinkingLevel("off");

  try {
    // Send the prompt
    await agent.prompt(prompt);
    await agent.waitForIdle();

    // Extract response text
    const messages = agent.state.messages;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && "content" in lastMsg && Array.isArray(lastMsg.content)) {
      const text = lastMsg.content
        .filter((c): c is TextContent => c.type === "text")
        .map((c) => c.text)
        .join("\n");
      return text;
    }

    throw new Error("No response from summarizer agent");
  } finally {
    agent.abort();
  }
}

export interface SummarizeResult {
  summary: string[];
  memory: Memory;
  recentTurns: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Helper to check if memory has any data
 */
function memoryHasData(memory: Memory | undefined): boolean {
  if (!memory) return false;
  return memory.people.length > 0 ||
         memory.decisions.length > 0 ||
         memory.tasks.length > 0 ||
         memory.facts.length > 0;
}

/**
 * Helper to create empty memory
 */
function emptyMemory(): Memory {
  return { people: [], decisions: [], tasks: [], facts: [] };
}

/**
 * Summarize a session's messages into scratchpad content
 * - Caps input at ~150 messages
 * - Feeds existing memory into prompt for model to merge/dedupe
 * - Model outputs complete new scratchpad content
 * - Extracts recent turns separately (not via LLM)
 */
export async function summarizeSession(
  messages: Message[],
  existingScratchpad: Scratchpad | null
): Promise<SummarizeResult> {
  logVerbose(`Summarizing session with ${messages.length} messages`);

  // Extract recent turns before summarization (this is deterministic, not LLM)
  const recentTurns = extractRecentTurns(messages);

  // If very few messages, don't bother with LLM summarization
  if (messages.length < 3) {
    logVerbose("Too few messages to summarize, keeping existing scratchpad");
    return {
      summary: existingScratchpad?.summary ?? [],
      memory: existingScratchpad?.memory ?? emptyMemory(),
      recentTurns,
    };
  }

  // Build prompt and call LLM using pi-agent
  const prompt = buildSummarizerPrompt(messages, existingScratchpad);
  const response = await callSummarizerWithAgent(prompt);

  // Parse the response
  const { summary, memory } = parseSummarizerResponse(response);

  const memoryCount = memory.people.length + memory.decisions.length + memory.tasks.length + memory.facts.length;
  logVerbose(`Summarization complete: ${summary.length} summary items, ${memoryCount} memory items`);

  // Guard against wiping existing data with empty results (e.g., API failure)
  const existingHasData = memoryHasData(existingScratchpad?.memory) || (existingScratchpad?.summary?.length ?? 0) > 0;
  const newIsEmpty = summary.length === 0 && !memoryHasData(memory);

  if (newIsEmpty && existingHasData) {
    logVerbose("WARNING: Summarization returned empty but existing data exists - preserving existing scratchpad");
    return {
      summary: existingScratchpad?.summary ?? [],
      memory: existingScratchpad?.memory ?? emptyMemory(),
      recentTurns,
    };
  }

  return {
    summary,
    memory,
    recentTurns,
  };
}

/**
 * Alternative to summarizeSession that uses entity extraction.
 * Wraps the entity memory system for callers that need the same interface.
 * Also generates a session handoff for cross-session memory sharing.
 */
export async function extractSessionEntities(
  messages: Message[],
  sessionName: string
): Promise<SummarizeResult> {
  const { extractEntities, entityMemoryToScratchpad, getMemorySummary, saveHandoff } = await import("./memory/index.js");

  // Run entity extraction
  await extractEntities(messages, sessionName);

  // Convert back to scratchpad format for compatibility
  const scratchpad = await entityMemoryToScratchpad(sessionName);

  // Generate and save session handoff for cross-session sharing
  try {
    const memorySummary = await getMemorySummary(sessionName);

    // Build summary string from recent decisions and facts
    const summaryParts: string[] = [];
    if (memorySummary.decisions.length > 0) {
      summaryParts.push(`Decisions: ${memorySummary.decisions.slice(-3).map(d => d.content).join("; ")}`);
    }
    if (memorySummary.tasks.length > 0) {
      const pendingTasks = memorySummary.tasks.filter(t => t.status === "pending" || t.status === "in_progress");
      if (pendingTasks.length > 0) {
        summaryParts.push(`Working on: ${pendingTasks.slice(-3).map(t => t.content).join("; ")}`);
      }
    }

    const handoff = {
      version: "1.0.0",
      summary: summaryParts.join(". ") || "No recent activity.",
      decisions: memorySummary.decisions.slice(-10).map(d => d.content),
      currentTasks: memorySummary.tasks
        .filter(t => t.status === "pending" || t.status === "in_progress")
        .map(t => t.content),
      handoffNotes: [], // Future: explicit notes from agent
      lastUpdated: new Date().toISOString(),
    };

    await saveHandoff(sessionName, handoff);
    logVerbose(`Generated handoff for ${sessionName}`);
  } catch (err) {
    logVerbose(`Failed to generate handoff for ${sessionName}: ${err}`);
  }

  return {
    summary: scratchpad.summary,
    memory: scratchpad.memory,
    recentTurns: scratchpad.recentTurns,
  };
}
