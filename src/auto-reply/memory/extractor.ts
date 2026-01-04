// Entity extraction via LLM - replaces recursive summarization

import { Agent, ProviderTransport } from "@mariozechner/pi-agent-core";
import { getModel, type Message, type TextContent } from "@mariozechner/pi-ai";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { logVerbose } from "../../globals.js";
import type {
  Entity,
  EntityIndex,
  ExtractionResult,
  KnowledgeItem,
  TaskItem,
  TemporalProperty,
  Relationship,
  MemoryState,
} from "./types.js";
import {
  loadEntityIndex,
  loadEntity,
  saveEntity,
  loadKnowledge,
  appendKnowledge,
  invalidateKnowledge,
  appendRelationships,
  saveMemoryState,
  loadMemoryState,
  generateEntityId,
  generateKnowledgeId,
} from "./storage.js";

const EXTRACTOR_MODEL = "claude-haiku-4-5";
const MAX_MESSAGES_TO_EXTRACT = 150;
const OAUTH_PATH = path.join(os.homedir(), ".pi", "agent", "oauth.json");
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface OAuthConfig {
  anthropic?: {
    type: string;
    refresh: string;
    access: string;
    expires?: number;
  };
}

/**
 * Refresh Anthropic OAuth token if needed.
 */
async function refreshAnthropicToken(
  refreshToken: string
): Promise<{ access: string; refresh: string; expires: number }> {
  logVerbose("Refreshing Anthropic OAuth token for extractor...");

  const response = await fetch("https://console.anthropic.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    access: data.access_token,
    refresh: data.refresh_token,
    expires: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Load OAuth config with token refresh.
 */
async function loadOAuth(): Promise<OAuthConfig> {
  const content = await fs.readFile(OAUTH_PATH, "utf8");
  const oauth: OAuthConfig = JSON.parse(content);

  if (oauth.anthropic) {
    const now = Date.now();
    const expires = oauth.anthropic.expires ?? 0;

    if (expires - now < TOKEN_REFRESH_BUFFER_MS) {
      try {
        const newTokens = await refreshAnthropicToken(oauth.anthropic.refresh);
        oauth.anthropic.access = newTokens.access;
        oauth.anthropic.refresh = newTokens.refresh;
        oauth.anthropic.expires = newTokens.expires;
        await fs.writeFile(OAUTH_PATH, JSON.stringify(oauth, null, 2));
      } catch (err) {
        logVerbose(`Token refresh failed: ${err}`);
      }
    }
  }

  return oauth;
}

/**
 * Create transport for agent.
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
 * Format messages for extraction prompt.
 */
function formatMessagesForExtraction(messages: Message[]): string {
  const lines: string[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      const content =
        typeof msg.content === "string"
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
  }

  return lines.join("\n\n");
}

/**
 * Build the extraction prompt.
 */
function buildExtractionPrompt(
  messages: Message[],
  existingIndex: EntityIndex
): string {
  const cappedMessages = messages.slice(-MAX_MESSAGES_TO_EXTRACT);
  const wasTruncated = messages.length > MAX_MESSAGES_TO_EXTRACT;
  const conversationText = formatMessagesForExtraction(cappedMessages);
  const now = Date.now();

  // Format existing entities for reference
  const existingEntitiesJson = JSON.stringify(existingIndex.entities, null, 2);

  return `You are extracting structured entities and knowledge from a WhatsApp conversation.

## Existing Entities (match existing IDs when the same entity is mentioned):
${existingEntitiesJson}

## Conversation${wasTruncated ? " (truncated - older messages omitted)" : ""}:
${conversationText}

## Output Format (JSON only, no preamble):
{
  "entities": [
    {
      "id": "person_alice",
      "type": "person",
      "name": "Alice",
      "aliases": ["Al", "Alice Smith"],
      "isNew": false,
      "properties": [
        {
          "key": "jobTitle",
          "value": "Engineer at TechCorp",
          "confidence": 0.9
        }
      ]
    }
  ],
  "knowledge": {
    "decisions": [
      {
        "content": "Use TypeScript for the new module",
        "entityIds": ["person_alice"],
        "confidence": 0.95
      }
    ],
    "facts": [
      {
        "content": "The API rate limit is 100 requests per minute",
        "entityIds": [],
        "confidence": 1.0
      }
    ],
    "tasks": [
      {
        "content": "Review the pull request by Friday",
        "entityIds": ["person_alice"],
        "status": "pending",
        "confidence": 0.9
      }
    ]
  },
  "relationships": [
    {
      "sourceEntityId": "person_alice",
      "type": "works_on",
      "targetEntityId": "project_webapp",
      "confidence": 0.85
    }
  ],
  "invalidations": [
    {
      "type": "facts",
      "entityId": "person_alice",
      "propertyKey": "location",
      "reason": "Alice mentioned she moved to a new city"
    }
  ]
}

## Rules:
1. **Entity Matching**: Check existing entities by name/aliases before creating new ones. Use existing IDs when possible.
2. **New Entities**: Set "isNew": true for entities not in the existing list.
3. **Properties**: Only extract NEW information not already captured. Skip properties that duplicate existing data.
4. **Confidence Scores**:
   - 1.0: Explicitly stated fact
   - 0.8-0.9: Strong inference from context
   - 0.6-0.7: Weak inference or uncertain
5. **Invalidations**: If new information contradicts old info (e.g., "I moved", "I changed jobs"), add to invalidations.
6. **Entity Types**: person, project, concept, place, organization
7. **Relationship Types**: works_with, manages, belongs_to, works_on, knows, located_at, etc.
8. **Tasks**: Extract action items with status (pending, in_progress, completed, cancelled)

## Output ONLY valid JSON, no explanation or preamble.`;
}

/**
 * Parse the LLM response into structured extraction result.
 */
function parseExtractionResponse(response: string, now: number): ExtractionResult {
  // Try to extract JSON from response
  let jsonStr = response;

  // Try to find JSON block
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    // Try to find raw JSON
    const rawMatch = response.match(/\{[\s\S]*\}/);
    if (rawMatch) {
      jsonStr = rawMatch[0];
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);

    const result: ExtractionResult = {
      newEntities: [],
      updatedEntities: [],
      newKnowledge: {
        decisions: [],
        facts: [],
        tasks: [],
      },
      invalidatedKnowledge: [],
      recentTurns: [], // Will be filled separately
    };

    // Process entities
    for (const entity of parsed.entities || []) {
      const properties: TemporalProperty[] = (entity.properties || []).map(
        (p: any) => ({
          key: p.key,
          value: p.value,
          validFrom: now,
          confidence: p.confidence ?? 0.8,
          source: `extraction_${now}`,
        })
      );

      if (entity.isNew) {
        result.newEntities.push({
          id: entity.id || generateEntityId(entity.type, entity.name),
          type: entity.type || "concept",
          name: entity.name,
          aliases: entity.aliases || [],
          properties,
          relationships: [],
          firstSeen: now,
          lastMentioned: now,
          mentionCount: 1,
        });
      } else if (properties.length > 0) {
        result.updatedEntities.push({
          id: entity.id,
          newProperties: properties,
        });
      }
    }

    // Process knowledge
    for (const decision of parsed.knowledge?.decisions || []) {
      result.newKnowledge.decisions.push({
        id: generateKnowledgeId("dec"),
        content: decision.content,
        entityIds: decision.entityIds || [],
        validFrom: now,
        confidence: decision.confidence ?? 0.8,
        source: `extraction_${now}`,
      });
    }

    for (const fact of parsed.knowledge?.facts || []) {
      result.newKnowledge.facts.push({
        id: generateKnowledgeId("fact"),
        content: fact.content,
        entityIds: fact.entityIds || [],
        validFrom: now,
        confidence: fact.confidence ?? 0.8,
        source: `extraction_${now}`,
      });
    }

    for (const task of parsed.knowledge?.tasks || []) {
      result.newKnowledge.tasks.push({
        id: generateKnowledgeId("task"),
        content: task.content,
        entityIds: task.entityIds || [],
        validFrom: now,
        confidence: task.confidence ?? 0.8,
        source: `extraction_${now}`,
        status: task.status || "pending",
      });
    }

    // Process relationships
    for (const rel of parsed.relationships || []) {
      const existing = result.updatedEntities.find(
        (e) => e.id === rel.sourceEntityId
      );
      const relationship: Relationship = {
        type: rel.type,
        targetEntityId: rel.targetEntityId,
        validFrom: now,
        confidence: rel.confidence ?? 0.8,
        source: `extraction_${now}`,
      };

      if (existing) {
        existing.newRelationships = existing.newRelationships || [];
        existing.newRelationships.push(relationship);
      } else {
        result.updatedEntities.push({
          id: rel.sourceEntityId,
          newRelationships: [relationship],
        });
      }
    }

    // Process invalidations
    for (const inv of parsed.invalidations || []) {
      if (inv.type === "facts" || inv.type === "decisions" || inv.type === "tasks") {
        // Knowledge invalidation - we'll handle this separately
        // For now, log it
        logVerbose(`Invalidation hint: ${inv.type} - ${inv.reason}`);
      } else if (inv.entityId && inv.propertyKey) {
        // Property invalidation
        const existing = result.updatedEntities.find(
          (e) => e.id === inv.entityId
        );
        if (existing) {
          existing.invalidatedProperties = existing.invalidatedProperties || [];
          existing.invalidatedProperties.push({
            key: inv.propertyKey,
            reason: inv.reason,
          });
        } else {
          result.updatedEntities.push({
            id: inv.entityId,
            invalidatedProperties: [
              { key: inv.propertyKey, reason: inv.reason },
            ],
          });
        }
      }
    }

    return result;
  } catch (err) {
    logVerbose(`Failed to parse extraction response: ${err}`);
    // Return empty result on parse failure
    return {
      newEntities: [],
      updatedEntities: [],
      newKnowledge: { decisions: [], facts: [], tasks: [] },
      invalidatedKnowledge: [],
      recentTurns: [],
    };
  }
}

/**
 * Extract recent turns deterministically (no LLM).
 */
function extractRecentTurns(
  messages: Message[]
): Array<{ role: "user" | "assistant"; content: string }> {
  const turns: Array<{ role: "user" | "assistant"; content: string }> = [];
  const maxTurns = 25;

  // Filter for warmup messages
  const isWarmUp = (content: string, role: "user" | "assistant"): boolean => {
    if (role === "user") {
      return (
        content.includes("<session_context>") ||
        content.includes("Above is conversation history for context")
      );
    } else {
      const trimmed = content.trim().toLowerCase();
      return (
        trimmed.startsWith("context received") ||
        trimmed.startsWith("context acknowledged")
      );
    }
  };

  // Work backwards through messages
  for (let i = messages.length - 1; i >= 0 && turns.length < maxTurns * 2; i--) {
    const msg = messages[i];

    if (msg.role === "user") {
      const content =
        typeof msg.content === "string"
          ? msg.content
          : (msg.content as Array<{ type: string; text?: string }>)
              .filter((c) => c.type === "text")
              .map((c) => c.text || "")
              .join("\n");

      if (content.trim() && !isWarmUp(content.trim(), "user")) {
        turns.unshift({ role: "user", content: content.trim() });
      }
    } else if (msg.role === "assistant") {
      const content = (msg.content as Array<{ type: string; text?: string }>)
        .filter((c) => c.type === "text")
        .map((c) => c.text || "")
        .join("\n");

      if (content.trim() && !isWarmUp(content.trim(), "assistant")) {
        turns.unshift({ role: "assistant", content: content.trim() });
      }
    }
  }

  // Trim to last 25 complete pairs
  const pairs: Array<{ user: string; assistant: string }> = [];
  for (let i = 0; i < turns.length - 1; i++) {
    if (turns[i].role === "user" && turns[i + 1]?.role === "assistant") {
      pairs.push({ user: turns[i].content, assistant: turns[i + 1].content });
      i++;
    }
  }

  const recentPairs = pairs.slice(-25);
  const result: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const pair of recentPairs) {
    result.push({ role: "user", content: pair.user });
    result.push({ role: "assistant", content: pair.assistant });
  }

  return result;
}

/**
 * Call LLM to extract entities.
 */
async function callExtractorWithAgent(prompt: string): Promise<string> {
  const transport = createTransport();
  const agent = new Agent({ transport });

  try {
    const model = getModel("anthropic", EXTRACTOR_MODEL as any);
    agent.setModel(model);
  } catch {
    agent.setModel(getModel("anthropic", "claude-haiku-4-5-20251001"));
  }

  agent.setSystemPrompt(
    "You are an entity extraction system. Output only valid JSON, no explanation."
  );
  agent.setThinkingLevel("off");

  await agent.prompt(prompt);
  await agent.waitForIdle();

  const messages = agent.state.messages;
  const lastMsg = messages[messages.length - 1];
  let responseText = "";

  if (lastMsg && "content" in lastMsg && Array.isArray(lastMsg.content)) {
    responseText = lastMsg.content
      .filter((c): c is TextContent => c.type === "text")
      .map((c) => c.text)
      .join("\n");
  }

  return responseText;
}

/**
 * Merge extraction results into memory storage.
 */
export async function mergeExtraction(
  sessionName: string,
  result: ExtractionResult
): Promise<void> {
  const now = Date.now();

  // Save new entities
  for (const entity of result.newEntities) {
    await saveEntity(sessionName, entity);
  }

  // Update existing entities
  for (const update of result.updatedEntities) {
    const entity = await loadEntity(sessionName, update.id);
    if (!entity) {
      logVerbose(`Entity ${update.id} not found for update`);
      continue;
    }

    // Add new properties
    if (update.newProperties) {
      entity.properties.push(...update.newProperties);
    }

    // Add new relationships
    if (update.newRelationships) {
      entity.relationships.push(...update.newRelationships);
    }

    // Invalidate old properties
    if (update.invalidatedProperties) {
      for (const inv of update.invalidatedProperties) {
        for (const prop of entity.properties) {
          if (prop.key === inv.key && !prop.validUntil) {
            prop.validUntil = now;
            logVerbose(
              `Invalidated property ${inv.key} on ${update.id}: ${inv.reason}`
            );
          }
        }
      }
    }

    entity.lastMentioned = now;
    entity.mentionCount++;
    await saveEntity(sessionName, entity);
  }

  // Append new knowledge
  if (result.newKnowledge.decisions.length > 0) {
    await appendKnowledge(sessionName, "decisions", result.newKnowledge.decisions);
  }
  if (result.newKnowledge.facts.length > 0) {
    await appendKnowledge(sessionName, "facts", result.newKnowledge.facts);
  }
  if (result.newKnowledge.tasks.length > 0) {
    await appendKnowledge(sessionName, "tasks", result.newKnowledge.tasks);
  }

  // Update memory state with recent turns
  const existingState = await loadMemoryState(sessionName);
  const newState: MemoryState = {
    version: "1.0.0",
    lastExtractionTime: now,
    lastExtractionMessageCount: 0, // Will be set by caller
    legacyMigrated: existingState?.legacyMigrated ?? false,
    recentTurns: result.recentTurns,
  };
  await saveMemoryState(sessionName, newState);

  logVerbose(
    `Merged extraction for ${sessionName}: ${result.newEntities.length} new entities, ` +
      `${result.updatedEntities.length} updated, ` +
      `${result.newKnowledge.decisions.length} decisions, ` +
      `${result.newKnowledge.facts.length} facts, ` +
      `${result.newKnowledge.tasks.length} tasks`
  );
}

/**
 * Main extraction function - replaces summarizeSession.
 */
export async function extractEntities(
  messages: Message[],
  sessionName: string
): Promise<ExtractionResult> {
  const now = Date.now();

  // Skip if too few messages
  if (messages.length < 3) {
    logVerbose(`Skipping extraction for ${sessionName}: only ${messages.length} messages`);
    return {
      newEntities: [],
      updatedEntities: [],
      newKnowledge: { decisions: [], facts: [], tasks: [] },
      invalidatedKnowledge: [],
      recentTurns: extractRecentTurns(messages),
    };
  }

  // Load existing entity index
  const existingIndex = await loadEntityIndex(sessionName);

  // Build extraction prompt
  const prompt = buildExtractionPrompt(messages, existingIndex);

  // Call LLM
  logVerbose(`Extracting entities for ${sessionName} from ${messages.length} messages...`);
  const response = await callExtractorWithAgent(prompt);

  // Parse response
  const result = parseExtractionResponse(response, now);

  // Add recent turns (deterministic)
  result.recentTurns = extractRecentTurns(messages);

  // Merge into storage
  await mergeExtraction(sessionName, result);

  return result;
}
