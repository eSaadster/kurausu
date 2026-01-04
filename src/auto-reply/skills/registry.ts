// Singleton registry for programmatic skills

import type { AgentTool } from "@mariozechner/pi-ai";
import type { ProgrammaticSkill, SkillRegistry } from "./types.js";

class SkillRegistryImpl implements SkillRegistry {
  private skills: ProgrammaticSkill[] = [];

  register(skill: ProgrammaticSkill): void {
    // Check for duplicate names
    const existing = this.skills.find((s) => s.name === skill.name);
    if (existing) {
      throw new Error(`Skill "${skill.name}" is already registered`);
    }
    this.skills.push(skill);
  }

  getAll(): ProgrammaticSkill[] {
    return [...this.skills];
  }

  getAllTools(): AgentTool<any>[] {
    const tools: AgentTool<any>[] = [];
    for (const skill of this.skills) {
      tools.push(...skill.tools);
    }
    return tools;
  }

  getSystemPromptAdditions(): string {
    const additions = this.skills
      .filter((s) => s.systemPromptAddition)
      .map((s) => s.systemPromptAddition);

    if (additions.length === 0) {
      return "";
    }

    return "## Programmatic Skills\n\n" + additions.join("\n\n");
  }

  clear(): void {
    this.skills = [];
  }
}

// Singleton instance
let registry: SkillRegistryImpl | null = null;

/**
 * Get the global skill registry instance.
 */
export function getSkillRegistry(): SkillRegistry {
  if (!registry) {
    registry = new SkillRegistryImpl();
  }
  return registry;
}

/**
 * Reset the skill registry (mainly for testing).
 */
export function resetSkillRegistry(): void {
  if (registry) {
    registry.clear();
  }
  registry = null;
}
