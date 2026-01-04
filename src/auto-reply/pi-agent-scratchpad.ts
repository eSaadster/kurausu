// Scratchpad persistence for pi-agent sessions
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import os from "node:os";

import type { Message, UserMessage, AssistantMessage, TextContent } from "@mariozechner/pi-ai";
import { logVerbose } from "../globals.js";

// Base path for all WhatsApp sessions (duplicated here to avoid circular import)
export const WHATSAPP_BASE_PATH = path.join(os.homedir(), "klaus", "whatsapp");

// Legacy path for migration
const LEGACY_SCRATCHPAD_DIR = path.join(os.homedir(), "klaus", "scratchpad", "sessions");

// Cache for shared context lookups (avoid repeated file reads)
const sharedContextCache = new Map<string, string | null>();
const sharedMemoryCache = new Map<string, boolean>();

interface SessionConfig {
  sharedContext?: string;
  sharedMemory?: boolean;
}

/**
 * Load session config from config.json.
 */
function loadSessionConfig(sessionName: string): SessionConfig | null {
  const configPath = path.join(WHATSAPP_BASE_PATH, sessionName, "config.json");
  try {
    return JSON.parse(fsSync.readFileSync(configPath, "utf-8")) as SessionConfig;
  } catch {
    return null;
  }
}

/**
 * Load shared context config for a session.
 * Checks for config.json with sharedContext field.
 * Returns the target session name or null if not configured.
 */
export function getSharedContext(sessionName: string): string | null {
  // Check cache first
  if (sharedContextCache.has(sessionName)) {
    return sharedContextCache.get(sessionName)!;
  }

  const config = loadSessionConfig(sessionName);
  const shared = config?.sharedContext || null;
  sharedContextCache.set(sessionName, shared);
  if (shared) {
    logVerbose(`Session ${sessionName} shares context with ${shared}`);
  }
  return shared;
}

/**
 * Check if session has sharedMemory enabled.
 * When true, the session will receive handoff notes from its sharedContext session.
 */
export function getSharedMemory(sessionName: string): boolean {
  // Check cache first
  if (sharedMemoryCache.has(sessionName)) {
    return sharedMemoryCache.get(sessionName)!;
  }

  const config = loadSessionConfig(sessionName);
  const enabled = config?.sharedMemory === true;
  sharedMemoryCache.set(sessionName, enabled);
  if (enabled) {
    logVerbose(`Session ${sessionName} has sharedMemory enabled`);
  }
  return enabled;
}

/**
 * Clear shared context and memory caches (call when config changes)
 */
export function clearSharedContextCache(): void {
  sharedContextCache.clear();
  sharedMemoryCache.clear();
}

export interface Memory {
  people: string[];      // who they are, preferences, relationships
  decisions: string[];   // things agreed upon, commitments made
  tasks: string[];       // pending action items, todos
  facts: string[];       // important context, general knowledge
}

export interface Scratchpad {
  summary: string[];
  memory: Memory;
  recentTurns: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Get the session directory path for a session.
 * If the session has a sharedContext config, returns the shared session's path.
 * @param sessionName - Session name like @17206598123 or #groupname
 */
export function getSessionDir(sessionName: string): string {
  const shared = getSharedContext(sessionName);
  const effectiveSession = shared || sessionName;
  return path.join(WHATSAPP_BASE_PATH, effectiveSession);
}

/**
 * Get the scratchpad file path for the session's OWN directory (ignores sharedContext).
 * Used for writing and reading own conversation history.
 */
function getOwnScratchpadPath(sessionName: string): string {
  return path.join(WHATSAPP_BASE_PATH, sessionName, "session.md");
}

/**
 * Get the scratchpad file path respecting sharedContext.
 * Used for reading shared memory (people, decisions, tasks, facts).
 */
function getSharedScratchpadPath(sessionName: string): string {
  return path.join(getSessionDir(sessionName), "session.md");
}

/**
 * Get the scratchpad file path for a session (legacy - uses shared path).
 * @deprecated Use getOwnScratchpadPath or getSharedScratchpadPath instead
 */
function getScratchpadPath(sessionName: string): string {
  return getSharedScratchpadPath(sessionName);
}

/**
 * Get the legacy scratchpad path (for migration)
 * @param sessionName - New session name like @17206598123 or #groupname
 * @param groupJid - Optional group JID for named groups (needed to find old file)
 */
function getLegacyScratchpadPath(sessionName: string, groupJid?: string): string {
  // Old format used phone without @ or # prefix
  // e.g., @17206598123 → 17206598123.md
  // or group:123456@g.us → group_123456_g_us.md
  let safeName: string;
  if (sessionName.startsWith("@")) {
    safeName = sessionName.slice(1);
  } else if (sessionName.startsWith("#group_")) {
    // New format: #group_123456 → old format was group:123456@g.us
    const groupId = sessionName.slice(7); // Remove "#group_"
    safeName = `group_${groupId}_g_us`;
  } else if (sessionName.startsWith("#") && groupJid) {
    // Named group - use the provided groupJid to find old file
    // groupJid is like "120363423474557427@g.us"
    const groupId = groupJid.replace(/@g\.us$/, "");
    safeName = `group_${groupId}_g_us`;
  } else if (sessionName.startsWith("#")) {
    // Named group without JID - can't migrate
    return "";
  } else {
    safeName = sessionName.replace(/^\+/, "").replace(/[^a-zA-Z0-9-]/g, "_");
  }
  return path.join(LEGACY_SCRATCHPAD_DIR, `${safeName}.md`);
}

/**
 * Ensure the session directory exists
 */
export async function ensureSessionDir(sessionName: string): Promise<void> {
  await fs.mkdir(getSessionDir(sessionName), { recursive: true });
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Migrate legacy scratchpad to new location if needed
 * @param sessionName - New session name like @17206598123 or #groupname
 * @param groupJid - Optional group JID for named groups (needed to find old file)
 */
async function migrateIfNeeded(sessionName: string, groupJid?: string): Promise<void> {
  const newPath = getScratchpadPath(sessionName);
  const legacyPath = getLegacyScratchpadPath(sessionName, groupJid);

  if (!legacyPath) return; // No legacy path for this session type

  // Check if new file already exists (already migrated or new session)
  if (await fileExists(newPath)) return;

  // Check if legacy file exists
  if (!(await fileExists(legacyPath))) return;

  // Migrate: create new directory and move file
  logVerbose(`Migrating scratchpad for ${sessionName} from ${legacyPath} to ${newPath}`);
  await ensureSessionDir(sessionName);
  await fs.copyFile(legacyPath, newPath);
  logVerbose(`Migration complete for ${sessionName}`);
}

/**
 * Parse bullet list items from a section body
 */
function parseBulletList(body: string): string[] {
  return body
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

/**
 * Parse memory section with ### subsections
 */
function parseMemorySection(body: string): Memory {
  const memory: Memory = {
    people: [],
    decisions: [],
    tasks: [],
    facts: [],
  };

  // Split by ### headers
  const subsections = body.split(/^### /m);

  for (const subsection of subsections) {
    const lines = subsection.trim().split("\n");
    const header = lines[0]?.toLowerCase().trim();
    const subBody = lines.slice(1).join("\n").trim();

    if (header === "people") {
      memory.people = parseBulletList(subBody);
    } else if (header === "decisions") {
      memory.decisions = parseBulletList(subBody);
    } else if (header === "tasks") {
      memory.tasks = parseBulletList(subBody);
    } else if (header === "facts") {
      memory.facts = parseBulletList(subBody);
    }
  }

  return memory;
}

/**
 * Parse a markdown scratchpad into structured data
 * Handles both new format (## memory with ### subsections) and legacy format (## critical)
 */
export function parseScratchpad(content: string): Scratchpad {
  const result: Scratchpad = {
    summary: [],
    memory: {
      people: [],
      decisions: [],
      tasks: [],
      facts: [],
    },
    recentTurns: [],
  };

  // Split by ## headers
  const sections = content.split(/^## /m);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const header = lines[0]?.toLowerCase().trim();
    const body = lines.slice(1).join("\n").trim();

    if (header === "summary") {
      result.summary = parseBulletList(body);
    } else if (header === "memory") {
      // New format: parse ### subsections
      result.memory = parseMemorySection(body);
    } else if (header === "critical") {
      // Legacy format: treat as facts for backward compatibility
      result.memory.facts = parseBulletList(body);
    } else if (header === "recent") {
      // Parse U:/A: pairs
      const turns: Scratchpad["recentTurns"] = [];
      let currentRole: "user" | "assistant" | null = null;
      let currentContent: string[] = [];

      const flushTurn = () => {
        if (currentRole && currentContent.length > 0) {
          turns.push({
            role: currentRole,
            content: currentContent.join("\n").trim(),
          });
        }
        currentContent = [];
      };

      for (const line of body.split("\n")) {
        if (line.startsWith("U: ")) {
          flushTurn();
          currentRole = "user";
          currentContent.push(line.slice(3));
        } else if (line.startsWith("A: ")) {
          flushTurn();
          currentRole = "assistant";
          currentContent.push(line.slice(3));
        } else if (currentRole && line.trim()) {
          // Continuation of previous turn
          currentContent.push(line);
        }
      }
      flushTurn();

      result.recentTurns = turns;
    }
  }

  return result;
}

/**
 * Format scratchpad data into markdown
 */
export function formatScratchpad(data: Scratchpad, senderId?: string): string {
  const lines: string[] = [];

  if (senderId) {
    lines.push(`# Session Memory for ${senderId}`);
    lines.push("");
  }

  lines.push("## summary");
  for (const item of data.summary) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## memory");
  lines.push("");

  lines.push("### people");
  for (const item of data.memory.people) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("### decisions");
  for (const item of data.memory.decisions) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("### tasks");
  for (const item of data.memory.tasks) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("### facts");
  for (const item of data.memory.facts) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## recent");
  for (const turn of data.recentTurns) {
    const prefix = turn.role === "user" ? "U:" : "A:";
    // Handle multi-line content
    const contentLines = turn.content.split("\n");
    lines.push(`${prefix} ${contentLines[0]}`);
    for (let i = 1; i < contentLines.length; i++) {
      lines.push(contentLines[i]);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Load and parse scratchpad for a session.
 * For sessions with sharedContext:
 *   - Memory (people, decisions, tasks, facts) loaded from shared session
 *   - Recent turns loaded from own session
 * For sessions without sharedContext:
 *   - Everything loaded from own session
 * @param sessionName - Session name like @17206598123 or #groupname
 * @param groupJid - Optional group JID for named groups (needed for migration)
 */
export async function loadScratchpad(sessionName: string, groupJid?: string): Promise<Scratchpad | null> {
  // Check if entity memory is enabled and exists
  const useEntityMemory = process.env.USE_ENTITY_MEMORY === "true";
  if (useEntityMemory) {
    try {
      const { hasEntityMemory, entityMemoryToScratchpad } = await import("./memory/index.js");
      if (await hasEntityMemory(sessionName)) {
        const scratchpad = await entityMemoryToScratchpad(sessionName);
        const memoryCount = scratchpad.memory.people.length + scratchpad.memory.decisions.length + scratchpad.memory.tasks.length + scratchpad.memory.facts.length;
        logVerbose(`Loaded scratchpad from entity memory for ${sessionName}: ${memoryCount} memory items, ${scratchpad.recentTurns.length} recent turns`);
        return scratchpad;
      }
    } catch (err) {
      logVerbose(`Failed to load from entity memory, falling back to legacy: ${err}`);
    }
  }

  // Try migration first
  await migrateIfNeeded(sessionName, groupJid);

  const sharedSession = getSharedContext(sessionName);

  // If no sharedContext, load everything from own path (normal behavior)
  if (!sharedSession) {
    const filePath = getOwnScratchpadPath(sessionName);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const scratchpad = parseScratchpad(content);
      const memoryCount = scratchpad.memory.people.length + scratchpad.memory.decisions.length + scratchpad.memory.tasks.length + scratchpad.memory.facts.length;
      logVerbose(`Loaded scratchpad for ${sessionName}: ${memoryCount} memory items, ${scratchpad.recentTurns.length} recent turns`);
      return scratchpad;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        logVerbose(`No scratchpad found for ${sessionName}`);
        return null;
      }
      console.warn(`[pi-agent] WARNING: Failed to load scratchpad for ${sessionName}: ${err}`);
      return null;
    }
  }

  // Has sharedContext: load memory from shared, recent turns from own
  logVerbose(`Loading split scratchpad for ${sessionName}: memory from ${sharedSession}, turns from own`);

  // Load memory from shared session
  let memory: Memory = { people: [], decisions: [], tasks: [], facts: [] };
  let summary: string[] = [];
  const sharedPath = getSharedScratchpadPath(sessionName);
  try {
    const content = await fs.readFile(sharedPath, "utf-8");
    const sharedScratchpad = parseScratchpad(content);
    memory = sharedScratchpad.memory;
    summary = sharedScratchpad.summary;
    const memoryCount = memory.people.length + memory.decisions.length + memory.tasks.length + memory.facts.length;
    logVerbose(`Loaded ${memoryCount} memory items from shared session ${sharedSession}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(`[pi-agent] WARNING: Failed to load shared scratchpad from ${sharedSession}: ${err}`);
    } else {
      logVerbose(`No shared scratchpad found for ${sharedSession}`);
    }
  }

  // Load recent turns from own session
  let recentTurns: Scratchpad["recentTurns"] = [];
  const ownPath = getOwnScratchpadPath(sessionName);
  try {
    const content = await fs.readFile(ownPath, "utf-8");
    const ownScratchpad = parseScratchpad(content);
    recentTurns = ownScratchpad.recentTurns;
    logVerbose(`Loaded ${recentTurns.length} recent turns from own session ${sessionName}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(`[pi-agent] WARNING: Failed to load own scratchpad for ${sessionName}: ${err}`);
    } else {
      logVerbose(`No own scratchpad found for ${sessionName} (will start fresh)`);
    }
  }

  return { summary, memory, recentTurns };
}

/**
 * Ensure the session's OWN directory exists (ignores sharedContext).
 * Used when saving to own session.md.
 */
async function ensureOwnSessionDir(sessionName: string): Promise<void> {
  await fs.mkdir(path.join(WHATSAPP_BASE_PATH, sessionName), { recursive: true });
}

/**
 * Save scratchpad atomically (write to .tmp, then rename).
 * For sessions with sharedContext:
 *   - Only saves recent turns and summary to own session.md
 *   - Memory is NOT saved (shared session manages its own memory)
 * For sessions without sharedContext:
 *   - Saves everything to own session.md
 * @param sessionName - Session name like @17206598123 or #groupname
 */
export async function saveScratchpad(sessionName: string, data: Scratchpad): Promise<void> {
  const sharedSession = getSharedContext(sessionName);

  // Always save to own path
  await ensureOwnSessionDir(sessionName);
  const filePath = getOwnScratchpadPath(sessionName);
  const tmpPath = `${filePath}.tmp`;

  let content: string;
  if (sharedSession) {
    // Has sharedContext: only save summary and recent turns (skip memory)
    const turnsOnlyData: Scratchpad = {
      summary: data.summary,
      memory: { people: [], decisions: [], tasks: [], facts: [] }, // Empty - don't save memory
      recentTurns: data.recentTurns,
    };
    content = formatScratchpad(turnsOnlyData, sessionName);
    logVerbose(`Saved scratchpad for ${sessionName} (sharedContext): ${data.recentTurns.length} recent turns only (memory managed by ${sharedSession})`);
  } else {
    // No sharedContext: save everything (normal behavior)
    content = formatScratchpad(data, sessionName);
    const memoryCount = data.memory.people.length + data.memory.decisions.length + data.memory.tasks.length + data.memory.facts.length;
    logVerbose(`Saved scratchpad for ${sessionName}: ${memoryCount} memory items, ${data.recentTurns.length} recent turns`);
  }

  await fs.writeFile(tmpPath, content, "utf-8");
  await fs.rename(tmpPath, filePath);
}

/**
 * Check if content is a session context warm-up message (should be filtered out)
 */
function isWarmUpMessage(content: string, role: "user" | "assistant"): boolean {
  if (role === "user") {
    // Filter out session context injection prompts
    return content.includes("<session_context>") ||
           content.includes("Above is conversation history for context");
  } else {
    // Filter out acknowledgment responses to warm-up
    const trimmed = content.trim().toLowerCase();
    return trimmed.startsWith("context received") ||
           trimmed.startsWith("context acknowledged") ||
           trimmed.startsWith("a: context received") ||
           trimmed.startsWith("a: context acknowledged");
  }
}

/**
 * Extract last 25 user/assistant turn pairs from message array
 */
export function extractRecentTurns(messages: Message[]): Scratchpad["recentTurns"] {
  const turns: Scratchpad["recentTurns"] = [];
  const maxTurns = 25; // 25 pairs = 50 messages max

  // Work backwards through messages to find user/assistant pairs
  for (let i = messages.length - 1; i >= 0 && turns.length < maxTurns * 2; i--) {
    const msg = messages[i];

    if (msg.role === "user") {
      const content = typeof msg.content === "string"
        ? msg.content
        : (msg.content as Array<{ type: string; text?: string }>)
            .filter((c) => c.type === "text")
            .map((c) => c.text || "")
            .join("\n");

      // Skip warm-up messages
      if (content.trim() && !isWarmUpMessage(content.trim(), "user")) {
        turns.unshift({ role: "user", content: content.trim() });
      }
    } else if (msg.role === "assistant") {
      const content = (msg.content as Array<{ type: string; text?: string }>)
        .filter((c) => c.type === "text")
        .map((c) => c.text || "")
        .join("\n");

      // Skip warm-up acknowledgment messages
      if (content.trim() && !isWarmUpMessage(content.trim(), "assistant")) {
        turns.unshift({ role: "assistant", content: content.trim() });
      }
    }
    // Skip toolResult messages
  }

  // Trim to last 25 complete pairs (user followed by assistant)
  // Find pairs and keep last 25
  const pairs: Array<{ user: string; assistant: string }> = [];
  for (let i = 0; i < turns.length - 1; i++) {
    if (turns[i].role === "user" && turns[i + 1]?.role === "assistant") {
      pairs.push({ user: turns[i].content, assistant: turns[i + 1].content });
      i++; // Skip the assistant we just paired
    }
  }

  // Take last 25 pairs
  const recentPairs = pairs.slice(-25);

  // Flatten back to turns
  const result: Scratchpad["recentTurns"] = [];
  for (const pair of recentPairs) {
    result.push({ role: "user", content: pair.user });
    result.push({ role: "assistant", content: pair.assistant });
  }

  return result;
}
