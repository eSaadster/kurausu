// Entity-based memory system - barrel exports

// Types
export type {
  Entity,
  EntityType,
  EntityIndex,
  TemporalProperty,
  TemporalValidity,
  Relationship,
  KnowledgeItem,
  TaskItem,
  KnowledgeStore,
  RelationshipStore,
  MemoryState,
  ExtractionResult,
  SessionHandoff,
} from "./types.js";

export { MEMORY_SCHEMA_VERSION } from "./types.js";

// Storage
export {
  getMemoryDir,
  ensureMemoryStructure,
  hasEntityMemory,
  loadMemoryState,
  saveMemoryState,
  loadEntityIndex,
  saveEntityIndex,
  loadEntity,
  saveEntity,
  deleteEntity,
  loadEntities,
  loadKnowledge,
  saveKnowledge,
  appendKnowledge,
  invalidateKnowledge,
  loadRelationships,
  saveRelationships,
  appendRelationships,
  getEntityRelationships,
  generateKnowledgeId,
  generateEntityId,
  getEntityIdsByRecency,
  loadHandoff,
  saveHandoff,
} from "./storage.js";

// Extraction
export { extractEntities, mergeExtraction } from "./extractor.js";

// Query
export {
  queryEntityAtTime,
  getCurrentProperties,
  getPropertyHistory,
  getActiveEntities,
  findEntitiesByAlias,
  findEntitiesByType,
  getValidKnowledge,
  getPendingTasks,
  getKnowledgeForEntity,
  getRelatedEntities,
  getIncomingRelationships,
  searchKnowledge,
  getMemorySummary,
} from "./query.js";

// Migration
export {
  migrateSessionToEntityMemory,
  needsMigration,
  entityMemoryToScratchpad,
} from "./migration.js";
