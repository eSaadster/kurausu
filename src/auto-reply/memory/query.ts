// Temporal queries for entity memory system

import { logVerbose } from "../../globals.js";
import type {
  Entity,
  EntityIndex,
  KnowledgeItem,
  TaskItem,
  TemporalProperty,
  Relationship,
} from "./types.js";
import {
  loadEntityIndex,
  loadEntity,
  loadEntities,
  loadKnowledge,
  loadRelationships,
  getEntityIdsByRecency,
} from "./storage.js";

/**
 * Filter properties to only those valid at a specific time.
 */
function filterPropertiesByTime(
  properties: TemporalProperty[],
  time: number
): TemporalProperty[] {
  return properties.filter(
    (p) => p.validFrom <= time && (!p.validUntil || p.validUntil > time)
  );
}

/**
 * Filter relationships to only those valid at a specific time.
 */
function filterRelationshipsByTime(
  relationships: Relationship[],
  time: number
): Relationship[] {
  return relationships.filter(
    (r) => r.validFrom <= time && (!r.validUntil || r.validUntil > time)
  );
}

/**
 * Filter knowledge items to only those valid at a specific time.
 */
function filterKnowledgeByTime<T extends KnowledgeItem>(
  items: T[],
  time: number
): T[] {
  return items.filter(
    (item) => item.validFrom <= time && (!item.validUntil || item.validUntil > time)
  );
}

/**
 * Query an entity's state at a specific point in time.
 * Returns the entity with only properties/relationships valid at that time.
 */
export async function queryEntityAtTime(
  sessionName: string,
  entityId: string,
  time: number
): Promise<Entity | null> {
  const entity = await loadEntity(sessionName, entityId);
  if (!entity) return null;

  // Filter to only valid properties and relationships at the given time
  return {
    ...entity,
    properties: filterPropertiesByTime(entity.properties, time),
    relationships: filterRelationshipsByTime(entity.relationships, time),
  };
}

/**
 * Get currently valid properties for an entity.
 */
export async function getCurrentProperties(
  sessionName: string,
  entityId: string
): Promise<TemporalProperty[]> {
  const entity = await loadEntity(sessionName, entityId);
  if (!entity) return [];

  const now = Date.now();
  return filterPropertiesByTime(entity.properties, now);
}

/**
 * Get property history for an entity (all values, including invalidated).
 */
export async function getPropertyHistory(
  sessionName: string,
  entityId: string,
  propertyKey?: string
): Promise<TemporalProperty[]> {
  const entity = await loadEntity(sessionName, entityId);
  if (!entity) return [];

  if (propertyKey) {
    return entity.properties.filter((p) => p.key === propertyKey);
  }
  return entity.properties;
}

/**
 * Get active entities (most recently mentioned, with valid properties).
 */
export async function getActiveEntities(
  sessionName: string,
  limit: number = 15
): Promise<Entity[]> {
  const entityIds = await getEntityIdsByRecency(sessionName);
  const limitedIds = entityIds.slice(0, limit);
  const entities = await loadEntities(sessionName, limitedIds);

  const now = Date.now();
  return entities.map((entity) => ({
    ...entity,
    properties: filterPropertiesByTime(entity.properties, now),
    relationships: filterRelationshipsByTime(entity.relationships, now),
  }));
}

/**
 * Find entities by name or alias (case-insensitive).
 */
export async function findEntitiesByAlias(
  sessionName: string,
  query: string
): Promise<Entity[]> {
  const index = await loadEntityIndex(sessionName);
  const queryLower = query.toLowerCase();

  const matchingIds: string[] = [];
  for (const [id, info] of Object.entries(index.entities)) {
    if (
      info.name.toLowerCase().includes(queryLower) ||
      info.aliases.some((a) => a.toLowerCase().includes(queryLower))
    ) {
      matchingIds.push(id);
    }
  }

  return loadEntities(sessionName, matchingIds);
}

/**
 * Find entities by type.
 */
export async function findEntitiesByType(
  sessionName: string,
  type: string
): Promise<Entity[]> {
  const index = await loadEntityIndex(sessionName);

  const matchingIds = Object.entries(index.entities)
    .filter(([_, info]) => info.type === type)
    .map(([id]) => id);

  return loadEntities(sessionName, matchingIds);
}

/**
 * Get valid knowledge items at a specific time.
 */
export async function getValidKnowledge(
  sessionName: string,
  type: "decisions" | "facts" | "tasks",
  time?: number
): Promise<KnowledgeItem[] | TaskItem[]> {
  const items = await loadKnowledge(sessionName, type);
  const queryTime = time ?? Date.now();
  return filterKnowledgeByTime(items, queryTime);
}

/**
 * Get pending tasks.
 */
export async function getPendingTasks(sessionName: string): Promise<TaskItem[]> {
  const tasks = (await loadKnowledge(sessionName, "tasks")) as TaskItem[];
  const now = Date.now();

  return tasks.filter(
    (task) =>
      task.status === "pending" &&
      task.validFrom <= now &&
      (!task.validUntil || task.validUntil > now)
  );
}

/**
 * Get knowledge items related to a specific entity.
 */
export async function getKnowledgeForEntity(
  sessionName: string,
  entityId: string,
  type?: "decisions" | "facts" | "tasks"
): Promise<KnowledgeItem[]> {
  const now = Date.now();
  const results: KnowledgeItem[] = [];

  const types: Array<"decisions" | "facts" | "tasks"> = type
    ? [type]
    : ["decisions", "facts", "tasks"];

  for (const t of types) {
    const items = await loadKnowledge(sessionName, t);
    const valid = filterKnowledgeByTime(items, now);
    results.push(...valid.filter((item) => item.entityIds.includes(entityId)));
  }

  return results;
}

/**
 * Get related entities through relationships.
 */
export async function getRelatedEntities(
  sessionName: string,
  entityId: string,
  relationshipType?: string
): Promise<Array<{ entity: Entity; relationship: Relationship }>> {
  const entity = await loadEntity(sessionName, entityId);
  if (!entity) return [];

  const now = Date.now();
  let relationships = filterRelationshipsByTime(entity.relationships, now);

  if (relationshipType) {
    relationships = relationships.filter((r) => r.type === relationshipType);
  }

  const results: Array<{ entity: Entity; relationship: Relationship }> = [];
  for (const rel of relationships) {
    const relatedEntity = await loadEntity(sessionName, rel.targetEntityId);
    if (relatedEntity) {
      results.push({ entity: relatedEntity, relationship: rel });
    }
  }

  return results;
}

/**
 * Get all entities that have a relationship TO the given entity.
 */
export async function getIncomingRelationships(
  sessionName: string,
  targetEntityId: string
): Promise<Array<{ entity: Entity; relationship: Relationship }>> {
  const store = await loadRelationships(sessionName);
  const now = Date.now();

  const results: Array<{ entity: Entity; relationship: Relationship }> = [];
  for (const rel of store.relationships) {
    if (
      rel.relationship.targetEntityId === targetEntityId &&
      rel.relationship.validFrom <= now &&
      (!rel.relationship.validUntil || rel.relationship.validUntil > now)
    ) {
      const entity = await loadEntity(sessionName, rel.sourceEntityId);
      if (entity) {
        results.push({ entity, relationship: rel.relationship });
      }
    }
  }

  return results;
}

/**
 * Search across all knowledge types for a query string.
 */
export async function searchKnowledge(
  sessionName: string,
  query: string
): Promise<Array<{ type: string; item: KnowledgeItem }>> {
  const queryLower = query.toLowerCase();
  const now = Date.now();
  const results: Array<{ type: string; item: KnowledgeItem }> = [];

  for (const type of ["decisions", "facts", "tasks"] as const) {
    const items = await loadKnowledge(sessionName, type);
    const valid = filterKnowledgeByTime(items, now);

    for (const item of valid) {
      if (item.content.toLowerCase().includes(queryLower)) {
        results.push({ type, item });
      }
    }
  }

  return results;
}

/**
 * Get memory summary for system prompt injection.
 */
export async function getMemorySummary(
  sessionName: string,
  maxEntities: number = 15
): Promise<{
  entities: Entity[];
  decisions: KnowledgeItem[];
  facts: KnowledgeItem[];
  tasks: TaskItem[];
}> {
  const entities = await getActiveEntities(sessionName, maxEntities);
  const decisions = (await getValidKnowledge(sessionName, "decisions")) as KnowledgeItem[];
  const facts = (await getValidKnowledge(sessionName, "facts")) as KnowledgeItem[];
  const tasks = await getPendingTasks(sessionName);

  return {
    entities,
    decisions: decisions.slice(-10), // Last 10 decisions
    facts: facts.slice(-15), // Last 15 facts
    tasks,
  };
}
