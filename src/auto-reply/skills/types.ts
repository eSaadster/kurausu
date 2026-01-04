// Skills system type definitions

import type { AgentTool } from "@mariozechner/pi-ai";

/**
 * Convention-based skill discovered from filesystem.
 * These are directories containing a SKILL.md file that describes
 * how to use the skill (via bash commands, scripts, etc.)
 */
export interface ConventionSkill {
  name: string;
  path: string;
  scope: "global" | "session";
  sessionName?: string;  // @phone or #groupname
}

/**
 * Programmatic skill that registers AgentTool instances.
 * These provide native tool integrations with typed parameters.
 */
export interface ProgrammaticSkill {
  name: string;
  description: string;
  tools: AgentTool<any>[];
  systemPromptAddition?: string;
  init?: () => Promise<void>;
}

/**
 * Registry for managing programmatic skills.
 */
export interface SkillRegistry {
  register(skill: ProgrammaticSkill): void;
  getAll(): ProgrammaticSkill[];
  getAllTools(): AgentTool<any>[];
  getSystemPromptAdditions(): string;
}

/**
 * Result of convention skill discovery.
 */
export interface ConventionSkillDiscoveryResult {
  skills: ConventionSkill[];
  systemPromptSection: string;
}

/**
 * Options for discovering convention skills.
 */
export interface DiscoverConventionSkillsOptions {
  workspacePath: string;
  sessionName?: string;  // @phone or #groupname
}
