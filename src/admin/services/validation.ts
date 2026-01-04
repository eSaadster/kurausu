/**
 * Validation service using existing Zod schemas
 */

import { z } from "zod";
import type { ValidationResult } from "../types.js";

// Re-export the schema so it can be used for validation
// Import the schema patterns from config.ts and recreate them here for admin use

const LoggingSchema = z.object({
  level: z
    .union([
      z.literal("silent"),
      z.literal("fatal"),
      z.literal("error"),
      z.literal("warn"),
      z.literal("info"),
      z.literal("debug"),
      z.literal("trace"),
    ])
    .optional(),
  file: z.string().optional(),
});

const SessionSchema = z.object({
  scope: z.union([z.literal("per-sender"), z.literal("global")]).optional(),
  resetTriggers: z.array(z.string()).optional(),
  idleMinutes: z.number().int().positive().optional(),
  store: z.string().optional(),
  sessionArgNew: z.array(z.string()).optional(),
  sessionArgResume: z.array(z.string()).optional(),
  sessionArgBeforeBody: z.boolean().optional(),
  sendSystemOnce: z.boolean().optional(),
  typingIntervalSeconds: z.number().int().positive().optional(),
});

const ReplySchema = z.object({
  mode: z.union([z.literal("text"), z.literal("command"), z.literal("pi-agent")]),
  text: z.string().optional(),
  command: z.array(z.string()).optional(),
  cwd: z.string().optional(),
  template: z.string().optional(),
  timeoutSeconds: z.number().int().positive().optional(),
  bodyPrefix: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaMaxMb: z.number().positive().optional(),
  typingIntervalSeconds: z.number().int().positive().optional(),
  session: SessionSchema.optional(),
  piOutputFormat: z
    .union([z.literal("text"), z.literal("json"), z.literal("stream-json")])
    .optional(),
  piAgentModel: z.string().optional(),
  piAgentThinkingLevel: z
    .union([
      z.literal("off"),
      z.literal("minimal"),
      z.literal("low"),
      z.literal("medium"),
      z.literal("high"),
    ])
    .optional(),
});

const GroupChatSchema = z.object({
  enabled: z.boolean().optional(),
  requireMention: z.boolean().optional(),
  mentionPatterns: z.array(z.string()).optional(),
  historyLimit: z.number().int().positive().optional(),
});

const SleeplessSchema = z.object({
  enabled: z.boolean().optional(),
  cliPath: z.string().optional(),
  pollIntervalMs: z.number().int().positive().optional(),
});

const GripsSchema = z.object({
  templatesPath: z.string().optional(),
  activePath: z.string().optional(),
  archivePath: z.string().optional(),
  pollIntervalSeconds: z.number().int().positive().optional(),
  maxConcurrent: z.number().int().positive().optional(),
  sleepless: SleeplessSchema.optional(),
});

const WebReconnectSchema = z.object({
  initialMs: z.number().positive().optional(),
  maxMs: z.number().positive().optional(),
  factor: z.number().positive().optional(),
  jitter: z.number().min(0).max(1).optional(),
  maxAttempts: z.number().int().min(0).optional(),
});

const WebSchema = z.object({
  heartbeatSeconds: z.number().int().positive().optional(),
  reconnect: WebReconnectSchema.optional(),
});

export const WarelayConfigSchema = z.object({
  logging: LoggingSchema.optional(),
  groupChat: GroupChatSchema.optional(),
  grips: GripsSchema.optional(),
  inbound: z
    .object({
      allowFrom: z.array(z.string()).optional(),
      transcribeAudio: z
        .object({
          command: z.array(z.string()),
          timeoutSeconds: z.number().int().positive().optional(),
        })
        .optional(),
      reply: ReplySchema.optional(),
    })
    .optional(),
  web: WebSchema.optional(),
});

// MCP config schema
export const McpConfigSchema = z.object({
  mcpServers: z.record(
    z.string(),
    z.object({
      baseUrl: z.string().url(),
      headers: z.record(z.string(), z.string()).optional(),
    }),
  ).optional(),
  imports: z.array(z.string()).optional(),
});

// Clicks config schema
const ClickConfigSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  instructions: z.string().min(1),
  intervalMinutes: z.number().int().min(1).max(1440),
  alertCriteria: z.string().optional(),
  enabled: z.boolean().optional(),
  model: z.string().optional(),
  useSessionMemory: z.boolean().optional(),
  useClickMemory: z.boolean().optional(),
});

export const ClicksFileSchema = z.object({
  clicks: z.array(ClickConfigSchema),
  alertChannel: z.string().optional(),
  alertTarget: z.string().optional(),
  sharedContext: z.string().optional(),
});

// Pi Agent settings schema
export const PiSettingsSchema = z.object({
  lastChangelogVersion: z.string().optional(),
  defaultThinkingLevel: z
    .union([
      z.literal("off"),
      z.literal("minimal"),
      z.literal("low"),
      z.literal("medium"),
      z.literal("high"),
    ])
    .optional(),
  defaultProvider: z.string().optional(),
  defaultModel: z.string().optional(),
});

// Pi Agent models schema
const ModelConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  api: z.union([z.literal("openai-completions"), z.literal("anthropic-messages")]).optional(),
  reasoning: z.boolean().optional(),
  input: z.array(z.union([z.literal("text"), z.literal("image")])).optional(),
  cost: z
    .object({
      input: z.number(),
      output: z.number(),
      cacheRead: z.number().optional(),
      cacheWrite: z.number().optional(),
    })
    .optional(),
  contextWindow: z.number().optional(),
  maxTokens: z.number().optional(),
});

const ProviderConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string(),
  api: z.union([z.literal("openai-completions"), z.literal("anthropic-messages")]),
  models: z.array(ModelConfigSchema),
});

export const PiModelsSchema = z.object({
  providers: z.record(z.string(), ProviderConfigSchema),
});

/**
 * Validate klaus config
 */
export function validateWarelayConfig(data: unknown): ValidationResult {
  const result = WarelayConfigSchema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  return {
    valid: false,
    errors: result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  };
}

/**
 * Validate MCP config
 */
export function validateMcpConfig(data: unknown): ValidationResult {
  const result = McpConfigSchema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  return {
    valid: false,
    errors: result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  };
}

/**
 * Validate clicks file
 */
export function validateClicksFile(data: unknown): ValidationResult {
  const result = ClicksFileSchema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  return {
    valid: false,
    errors: result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  };
}

/**
 * Validate Pi settings
 */
export function validatePiSettings(data: unknown): ValidationResult {
  const result = PiSettingsSchema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  return {
    valid: false,
    errors: result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  };
}

/**
 * Validate Pi models
 */
export function validatePiModels(data: unknown): ValidationResult {
  const result = PiModelsSchema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  return {
    valid: false,
    errors: result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  };
}
