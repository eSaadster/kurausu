// File-based storage for entity memory system

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { logVerbose } from "../../globals.js";
import type {
  Entity,
  EntityIndex,
  KnowledgeItem,
  KnowledgeStore,
  MemoryState,
  RelationshipStore,
  Relationship,
  TaskItem,
  SessionHandoff,
  MEMORY_SCHEMA_VERSION,
} from "./types.js";

// Base path for all WhatsApp sessions
const WHATSAPP_BASE_PATH = path.join(os.homedir(), "klaus", "whatsapp");

/**
 * Get the memory directory path for a session.
 */
export function getMemoryDir(sessionName: string): string {
  return path.join(WHATSAPP_BASE_PATH, sessionName, "memory");
}

/**
 * Check if a file exists.
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
 * Ensure the memory directory structure exists.
 */
export async function ensureMemoryStructure(sessionName: string): Promise<void> {
  const memoryDir = getMemoryDir(sessionName);
  await fs.mkdir(path.join(memoryDir, "entities"), { recursive: true });
  await fs.mkdir(path.join(memoryDir, "knowledge"), { recursive: true });
}

/**
 * Write JSON atomically (write to .tmp, then rename).
 */
async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmpPath, filePath);
}

/**
 * Read JSON file, returning null if it doesn't exist.
 */
async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

// ============================================================================
// Memory State
// ============================================================================

/**
 * Load memory state from state.json.
 */
export async function loadMemoryState(sessionName: string): Promise<MemoryState | null> {
  const filePath = path.join(getMemoryDir(sessionName), "state.json");
  return readJson<MemoryState>(filePath);
}

/**
 * Save memory state to state.json.
 */
export async function saveMemoryState(sessionName: string, state: MemoryState): Promise<void> {
  await ensureMemoryStructure(sessionName);
  const filePath = path.join(getMemoryDir(sessionName), "state.json");
  await writeJsonAtomic(filePath, state);
  logVerbose(`Saved memory state for ${sessionName}: ${state.recentTurns.length} recent turns`);
}

/**
 * Check if entity memory exists for a session.
 */
export async function hasEntityMemory(sessionName: string): Promise<boolean> {
  const statePath = path.join(getMemoryDir(sessionName), "state.json");
  return fileExists(statePath);
}

// ============================================================================
// Entity Index
// ============================================================================

/**
 * Load entity index from entities/index.json.
 */
export async function loadEntityIndex(sessionName: string): Promise<EntityIndex> {
  const filePath = path.join(getMemoryDir(sessionName), "entities", "index.json");
  const index = await readJson<EntityIndex>(filePath);

  if (!index) {
    return {
      version: "1.0.0",
      lastUpdated: Date.now(),
      entities: {},
    };
  }

  return index;
}

/**
 * Save entity index to entities/index.json.
 */
export async function saveEntityIndex(sessionName: string, index: EntityIndex): Promise<void> {
  await ensureMemoryStructure(sessionName);
  index.lastUpdated = Date.now();
  const filePath = path.join(getMemoryDir(sessionName), "entities", "index.json");
  await writeJsonAtomic(filePath, index);
  logVerbose(`Saved entity index for ${sessionName}: ${Object.keys(index.entities).length} entities`);
}

// ============================================================================
// Individual Entities
// ============================================================================

/**
 * Load a single entity from entities/{entityId}.json.
 */
export async function loadEntity(sessionName: string, entityId: string): Promise<Entity | null> {
  const filePath = path.join(getMemoryDir(sessionName), "entities", `${entityId}.json`);
  return readJson<Entity>(filePath);
}

/**
 * Save a single entity to entities/{entityId}.json and update index.
 */
export async function saveEntity(sessionName: string, entity: Entity): Promise<void> {
  await ensureMemoryStructure(sessionName);

  // Save entity file
  const filePath = path.join(getMemoryDir(sessionName), "entities", `${entity.id}.json`);
  await writeJsonAtomic(filePath, entity);

  // Update index
  const index = await loadEntityIndex(sessionName);
  index.entities[entity.id] = {
    type: entity.type,
    name: entity.name,
    aliases: entity.aliases,
    lastMentioned: entity.lastMentioned,
  };
  await saveEntityIndex(sessionName, index);

  logVerbose(`Saved entity ${entity.id} for ${sessionName}`);
}

/**
 * Delete an entity and remove from index.
 */
export async function deleteEntity(sessionName: string, entityId: string): Promise<void> {
  const filePath = path.join(getMemoryDir(sessionName), "entities", `${entityId}.json`);

  try {
    await fs.unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }

  // Update index
  const index = await loadEntityIndex(sessionName);
  delete index.entities[entityId];
  await saveEntityIndex(sessionName, index);

  logVerbose(`Deleted entity ${entityId} for ${sessionName}`);
}

/**
 * Load multiple entities by IDs.
 */
export async function loadEntities(sessionName: string, entityIds: string[]): Promise<Entity[]> {
  const entities: Entity[] = [];
  for (const id of entityIds) {
    const entity = await loadEntity(sessionName, id);
    if (entity) {
      entities.push(entity);
    }
  }
  return entities;
}

// ============================================================================
// Knowledge Items
// ============================================================================

/**
 * Load knowledge items of a specific type.
 */
export async function loadKnowledge(
  sessionName: string,
  type: "decisions" | "facts" | "tasks"
): Promise<KnowledgeItem[] | TaskItem[]> {
  const filePath = path.join(getMemoryDir(sessionName), "knowledge", `${type}.json`);
  const store = await readJson<KnowledgeStore>(filePath);
  return store?.items ?? [];
}

/**
 * Save knowledge items of a specific type.
 */
export async function saveKnowledge(
  sessionName: string,
  type: "decisions" | "facts" | "tasks",
  items: KnowledgeItem[] | TaskItem[]
): Promise<void> {
  await ensureMemoryStructure(sessionName);

  const store: KnowledgeStore = {
    version: "1.0.0",
    lastUpdated: Date.now(),
    items,
  };

  const filePath = path.join(getMemoryDir(sessionName), "knowledge", `${type}.json`);
  await writeJsonAtomic(filePath, store);
  logVerbose(`Saved ${items.length} ${type} for ${sessionName}`);
}

/**
 * Append new knowledge items (preserves existing).
 */
export async function appendKnowledge(
  sessionName: string,
  type: "decisions" | "facts" | "tasks",
  newItems: KnowledgeItem[] | TaskItem[]
): Promise<void> {
  const existing = await loadKnowledge(sessionName, type);
  const updated = [...existing, ...newItems];
  await saveKnowledge(sessionName, type, updated);
}

/**
 * Invalidate knowledge items by setting validUntil.
 */
export async function invalidateKnowledge(
  sessionName: string,
  type: "decisions" | "facts" | "tasks",
  itemIds: string[],
  reason: string
): Promise<void> {
  const items = await loadKnowledge(sessionName, type);
  const now = Date.now();

  for (const item of items) {
    if (itemIds.includes(item.id) && !item.validUntil) {
      item.validUntil = now;
      // Add reason to tags
      item.tags = item.tags ?? [];
      item.tags.push(`invalidated: ${reason}`);
    }
  }

  await saveKnowledge(sessionName, type, items);
  logVerbose(`Invalidated ${itemIds.length} ${type} for ${sessionName}: ${reason}`);
}

// ============================================================================
// Relationships
// ============================================================================

/**
 * Load all relationships.
 */
export async function loadRelationships(sessionName: string): Promise<RelationshipStore> {
  const filePath = path.join(getMemoryDir(sessionName), "relationships.json");
  const store = await readJson<RelationshipStore>(filePath);

  if (!store) {
    return {
      version: "1.0.0",
      lastUpdated: Date.now(),
      relationships: [],
    };
  }

  return store;
}

/**
 * Save all relationships.
 */
export async function saveRelationships(sessionName: string, store: RelationshipStore): Promise<void> {
  await ensureMemoryStructure(sessionName);
  store.lastUpdated = Date.now();
  const filePath = path.join(getMemoryDir(sessionName), "relationships.json");
  await writeJsonAtomic(filePath, store);
  logVerbose(`Saved ${store.relationships.length} relationships for ${sessionName}`);
}

/**
 * Add new relationships.
 */
export async function appendRelationships(
  sessionName: string,
  newRelationships: Array<{ sourceEntityId: string; relationship: Relationship }>
): Promise<void> {
  const store = await loadRelationships(sessionName);
  store.relationships.push(...newRelationships);
  await saveRelationships(sessionName, store);
}

/**
 * Get relationships for a specific entity.
 */
export async function getEntityRelationships(
  sessionName: string,
  entityId: string
): Promise<Relationship[]> {
  const store = await loadRelationships(sessionName);
  return store.relationships
    .filter((r) => r.sourceEntityId === entityId)
    .map((r) => r.relationship);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique ID for knowledge items.
 */
export function generateKnowledgeId(type: "dec" | "fact" | "task"): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generate a unique ID for entities.
 */
export function generateEntityId(type: string, name: string): string {
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30);
  return `${type}_${safeName}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Get all entity IDs sorted by last mentioned (most recent first).
 */
export async function getEntityIdsByRecency(sessionName: string): Promise<string[]> {
  const index = await loadEntityIndex(sessionName);
  return Object.entries(index.entities)
    .sort((a, b) => b[1].lastMentioned - a[1].lastMentioned)
    .map(([id]) => id);
}

// ============================================================================
// Session Handoff
// ============================================================================

/**
 * Get the handoff file path for a session.
 */
function getHandoffPath(sessionName: string): string {
  return path.join(WHATSAPP_BASE_PATH, sessionName, "handoff.json");
}

/**
 * Load session handoff from handoff.json.
 */
export async function loadHandoff(sessionName: string): Promise<SessionHandoff | null> {
  const filePath = getHandoffPath(sessionName);
  return readJson<SessionHandoff>(filePath);
}

/**
 * Save session handoff to handoff.json.
 */
export async function saveHandoff(sessionName: string, handoff: SessionHandoff): Promise<void> {
  // Ensure session directory exists
  const sessionDir = path.join(WHATSAPP_BASE_PATH, sessionName);
  await fs.mkdir(sessionDir, { recursive: true });

  const filePath = getHandoffPath(sessionName);
  await writeJsonAtomic(filePath, handoff);
  logVerbose(`Saved handoff for ${sessionName}: ${handoff.decisions.length} decisions, ${handoff.currentTasks.length} tasks`);
}
