// Migration from legacy session.md to entity memory system

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { logVerbose } from "../../globals.js";
import type {
  Entity,
  KnowledgeItem,
  TaskItem,
  MemoryState,
  TemporalProperty,
} from "./types.js";
import {
  ensureMemoryStructure,
  saveEntity,
  saveKnowledge,
  saveMemoryState,
  loadMemoryState,
  generateEntityId,
  generateKnowledgeId,
} from "./storage.js";

const WHATSAPP_BASE_PATH = path.join(os.homedir(), "klaus", "whatsapp");

interface LegacyMemory {
  people: string[];
  decisions: string[];
  tasks: string[];
  facts: string[];
}

interface LegacyScratchpad {
  summary: string[];
  memory: LegacyMemory;
  recentTurns: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Parse bullet list items from a section body.
 */
function parseBulletList(body: string): string[] {
  return body
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

/**
 * Parse memory section with ### subsections.
 */
function parseMemorySection(body: string): LegacyMemory {
  const memory: LegacyMemory = {
    people: [],
    decisions: [],
    tasks: [],
    facts: [],
  };

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
 * Parse legacy session.md format.
 */
function parseLegacyScratchpad(content: string): LegacyScratchpad {
  const result: LegacyScratchpad = {
    summary: [],
    memory: {
      people: [],
      decisions: [],
      tasks: [],
      facts: [],
    },
    recentTurns: [],
  };

  const sections = content.split(/^## /m);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const header = lines[0]?.toLowerCase().trim();
    const body = lines.slice(1).join("\n").trim();

    if (header === "summary") {
      result.summary = parseBulletList(body);
    } else if (header === "memory") {
      result.memory = parseMemorySection(body);
    } else if (header === "critical") {
      // Legacy format: treat as facts
      result.memory.facts = parseBulletList(body);
    } else if (header === "recent") {
      // Parse U:/A: pairs
      const turns: LegacyScratchpad["recentTurns"] = [];
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
 * Convert a person line to an Entity.
 * Format: "John: works at TechCorp, likes coffee"
 */
function convertPersonToEntity(personLine: string, now: number): Entity {
  const colonIndex = personLine.indexOf(":");
  let name: string;
  let description: string;

  if (colonIndex > 0) {
    name = personLine.slice(0, colonIndex).trim();
    description = personLine.slice(colonIndex + 1).trim();
  } else {
    name = personLine.trim();
    description = "";
  }

  const properties: TemporalProperty[] = [];
  if (description) {
    properties.push({
      key: "description",
      value: description,
      validFrom: now - 86400000, // Assume learned 1 day ago
      confidence: 0.7, // Lower confidence since migrated
      source: "legacy_migration",
    });
  }

  return {
    id: generateEntityId("person", name),
    type: "person",
    name,
    aliases: [],
    properties,
    relationships: [],
    firstSeen: now - 86400000,
    lastMentioned: now - 86400000,
    mentionCount: 1,
  };
}

/**
 * Convert a decision/fact/task line to a KnowledgeItem.
 */
function convertToKnowledge(
  content: string,
  type: "dec" | "fact" | "task",
  now: number
): KnowledgeItem {
  return {
    id: generateKnowledgeId(type),
    content,
    entityIds: [], // No entity linking during migration
    validFrom: now - 86400000, // Assume learned 1 day ago
    confidence: 0.7, // Lower confidence since migrated
    source: "legacy_migration",
  };
}

/**
 * Convert a task line to a TaskItem.
 */
function convertToTask(content: string, now: number): TaskItem {
  // Try to detect status from content
  let status: TaskItem["status"] = "pending";
  if (content.toLowerCase().includes("[done]") || content.toLowerCase().includes("[completed]")) {
    status = "completed";
  } else if (content.toLowerCase().includes("[cancelled]") || content.toLowerCase().includes("[canceled]")) {
    status = "cancelled";
  } else if (content.toLowerCase().includes("[in progress]")) {
    status = "in_progress";
  }

  return {
    id: generateKnowledgeId("task"),
    content: content.replace(/\[(done|completed|cancelled|canceled|in progress)\]/gi, "").trim(),
    entityIds: [],
    validFrom: now - 86400000,
    confidence: 0.7,
    source: "legacy_migration",
    status,
  };
}

/**
 * Migrate a session from legacy session.md to entity memory.
 */
export async function migrateSessionToEntityMemory(sessionName: string): Promise<void> {
  const now = Date.now();
  const sessionPath = path.join(WHATSAPP_BASE_PATH, sessionName, "session.md");

  // Check if already migrated
  const existingState = await loadMemoryState(sessionName);
  if (existingState?.legacyMigrated) {
    logVerbose(`Session ${sessionName} already migrated`);
    return;
  }

  // Load legacy session.md
  let legacyContent: string;
  try {
    legacyContent = await fs.readFile(sessionPath, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      logVerbose(`No legacy session.md found for ${sessionName}`);
      // Create empty state to mark as "migrated" (nothing to migrate)
      await ensureMemoryStructure(sessionName);
      await saveMemoryState(sessionName, {
        version: "1.0.0",
        lastExtractionTime: now,
        lastExtractionMessageCount: 0,
        legacyMigrated: true,
        recentTurns: [],
      });
      return;
    }
    throw err;
  }

  // Parse legacy format
  const legacy = parseLegacyScratchpad(legacyContent);
  logVerbose(
    `Migrating ${sessionName}: ${legacy.memory.people.length} people, ` +
      `${legacy.memory.decisions.length} decisions, ` +
      `${legacy.memory.tasks.length} tasks, ` +
      `${legacy.memory.facts.length} facts, ` +
      `${legacy.recentTurns.length} recent turns`
  );

  // Ensure memory structure
  await ensureMemoryStructure(sessionName);

  // Convert and save people as entities
  for (const personLine of legacy.memory.people) {
    const entity = convertPersonToEntity(personLine, now);
    await saveEntity(sessionName, entity);
  }

  // Convert and save decisions
  if (legacy.memory.decisions.length > 0) {
    const decisions = legacy.memory.decisions.map((d) =>
      convertToKnowledge(d, "dec", now)
    );
    await saveKnowledge(sessionName, "decisions", decisions);
  }

  // Convert and save facts
  if (legacy.memory.facts.length > 0) {
    const facts = legacy.memory.facts.map((f) =>
      convertToKnowledge(f, "fact", now)
    );
    await saveKnowledge(sessionName, "facts", facts);
  }

  // Convert and save tasks
  if (legacy.memory.tasks.length > 0) {
    const tasks = legacy.memory.tasks.map((t) => convertToTask(t, now));
    await saveKnowledge(sessionName, "tasks", tasks);
  }

  // Save state with recent turns
  await saveMemoryState(sessionName, {
    version: "1.0.0",
    lastExtractionTime: now,
    lastExtractionMessageCount: 0,
    legacyMigrated: true,
    recentTurns: legacy.recentTurns,
  });

  logVerbose(`Migration complete for ${sessionName}`);
}

/**
 * Check if a session needs migration.
 */
export async function needsMigration(sessionName: string): Promise<boolean> {
  const state = await loadMemoryState(sessionName);
  if (state?.legacyMigrated) {
    return false;
  }

  // Check if legacy session.md exists
  const sessionPath = path.join(WHATSAPP_BASE_PATH, sessionName, "session.md");
  try {
    await fs.access(sessionPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert entity memory back to legacy Scratchpad format.
 * Used for backward compatibility with existing code.
 */
export async function entityMemoryToScratchpad(sessionName: string): Promise<LegacyScratchpad> {
  const { getMemorySummary } = await import("./query.js");
  const state = await loadMemoryState(sessionName);

  const summary = await getMemorySummary(sessionName);

  // Convert entities to people strings
  const people: string[] = summary.entities
    .filter((e) => e.type === "person")
    .map((e) => {
      const desc = e.properties.find((p) => p.key === "description")?.value;
      return desc ? `${e.name}: ${desc}` : e.name;
    });

  // Convert knowledge to strings
  const decisions = summary.decisions.map((d) => d.content);
  const facts = summary.facts.map((f) => f.content);
  const tasks = summary.tasks.map((t) => {
    const statusTag =
      t.status === "completed"
        ? "[done] "
        : t.status === "in_progress"
          ? "[in progress] "
          : "";
    return statusTag + t.content;
  });

  return {
    summary: [], // We don't store summary in new format
    memory: { people, decisions, tasks, facts },
    recentTurns: state?.recentTurns ?? [],
  };
}
