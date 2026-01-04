// Entity-based memory types for temporal knowledge graph storage

/**
 * Temporal validity for any piece of knowledge.
 * Enables "time travel" queries - what did we know at time X?
 */
export interface TemporalValidity {
  /** Unix timestamp when this became valid */
  validFrom: number;
  /** Unix timestamp when this expired (undefined = still valid) */
  validUntil?: number;
  /** Source turn/context where this was learned (e.g., "turn_42", "migration") */
  source: string;
  /** Confidence score 0-1 (1.0 = explicit, 0.8 = strong inference, 0.6 = weak inference) */
  confidence: number;
}

/** Entity types for classification */
export type EntityType = "person" | "project" | "concept" | "place" | "organization";

/**
 * A property on an entity with temporal validity.
 * Properties can change over time - each change creates a new property with validFrom/validUntil.
 */
export interface TemporalProperty extends TemporalValidity {
  /** Property key (e.g., "jobTitle", "location", "preference") */
  key: string;
  /** Property value */
  value: string;
}

/**
 * A relationship between entities with temporal validity.
 * Relationships can also change over time.
 */
export interface Relationship extends TemporalValidity {
  /** Relationship type (e.g., "works_with", "manages", "belongs_to") */
  type: string;
  /** ID of the target entity */
  targetEntityId: string;
  /** Additional relationship metadata */
  properties?: Record<string, string>;
}

/**
 * A tracked entity (person, project, concept, place, organization).
 * Entities have stable IDs and accumulate properties/relationships over time.
 */
export interface Entity {
  /** Stable ID (e.g., "person_alice_smith", "project_refactor") */
  id: string;
  /** Entity type */
  type: EntityType;
  /** Primary display name */
  name: string;
  /** Alternative names/spellings for matching */
  aliases: string[];
  /** Properties with temporal validity */
  properties: TemporalProperty[];
  /** Relationships to other entities */
  relationships: Relationship[];
  /** Unix timestamp of first mention */
  firstSeen: number;
  /** Unix timestamp of most recent mention */
  lastMentioned: number;
  /** Total times mentioned across sessions */
  mentionCount: number;
}

/**
 * Entity registry index for fast lookups.
 * Stored in entities/index.json.
 */
export interface EntityIndex {
  /** Schema version for migrations */
  version: string;
  /** Last update timestamp */
  lastUpdated: number;
  /** Entity summaries for fast lookup */
  entities: {
    [id: string]: {
      type: EntityType;
      name: string;
      aliases: string[];
      lastMentioned: number;
    };
  };
}

/**
 * A knowledge item (decision, fact) with temporal validity.
 */
export interface KnowledgeItem extends TemporalValidity {
  /** Unique ID (e.g., "dec_001", "fact_042") */
  id: string;
  /** The knowledge content */
  content: string;
  /** IDs of referenced entities */
  entityIds: string[];
  /** Optional tags for categorization */
  tags?: string[];
}

/**
 * Task with status tracking, extends knowledge item.
 */
export interface TaskItem extends KnowledgeItem {
  /** Task status */
  status: "pending" | "in_progress" | "completed" | "cancelled";
  /** Completion timestamp if completed */
  completedAt?: number;
  /** Optional assignee entity ID */
  assigneeId?: string;
}

/**
 * Session state metadata stored in state.json.
 * Includes recent turns (moved from session.md).
 */
export interface MemoryState {
  /** Schema version for migrations */
  version: string;
  /** Last entity extraction timestamp */
  lastExtractionTime: number;
  /** Message count at last extraction */
  lastExtractionMessageCount: number;
  /** Whether legacy session.md was migrated */
  legacyMigrated: boolean;
  /** Recent conversation turns (last 25 pairs) */
  recentTurns: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

/**
 * Result of entity extraction from conversation.
 * Used to update the memory store.
 */
export interface ExtractionResult {
  /** New entities to create */
  newEntities: Entity[];
  /** Updates to existing entities */
  updatedEntities: Array<{
    id: string;
    newProperties?: TemporalProperty[];
    newRelationships?: Relationship[];
    /** Properties to invalidate (set validUntil) */
    invalidatedProperties?: Array<{ key: string; reason: string }>;
  }>;
  /** New knowledge items */
  newKnowledge: {
    decisions: KnowledgeItem[];
    facts: KnowledgeItem[];
    tasks: TaskItem[];
  };
  /** Knowledge to invalidate */
  invalidatedKnowledge: Array<{
    id: string;
    type: "decisions" | "facts" | "tasks";
    reason: string;
  }>;
  /** Recent turns to save (deterministic extraction) */
  recentTurns: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

/**
 * Knowledge store for a single type (decisions, facts, tasks).
 */
export interface KnowledgeStore {
  version: string;
  lastUpdated: number;
  items: KnowledgeItem[] | TaskItem[];
}

/**
 * Relationship store for all entity relationships.
 */
export interface RelationshipStore {
  version: string;
  lastUpdated: number;
  relationships: Array<{
    sourceEntityId: string;
    relationship: Relationship;
  }>;
}

/**
 * Session handoff for cross-session memory sharing.
 * Auto-generated by the summarizer, consumed by sessions with sharedMemory: true.
 */
export interface SessionHandoff {
  /** Schema version for migrations */
  version: string;
  /** Brief summary of what happened in the session */
  summary: string;
  /** Key decisions made */
  decisions: string[];
  /** In-progress or pending tasks */
  currentTasks: string[];
  /** Explicit notes for other sessions (future: agent can write these) */
  handoffNotes: string[];
  /** ISO timestamp of last update */
  lastUpdated: string;
}

/** Current schema version */
export const MEMORY_SCHEMA_VERSION = "1.0.0";
