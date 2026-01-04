// Filesystem discovery for convention-based skills

import fs from "node:fs/promises";
import path from "node:path";

import { logVerbose } from "../../globals.js";
import type {
  ConventionSkill,
  ConventionSkillDiscoveryResult,
  DiscoverConventionSkillsOptions,
} from "./types.js";

const SKILL_FILE = "SKILL.md";

/**
 * Check if a directory contains a valid skill (has SKILL.md).
 */
async function isSkillDirectory(dirPath: string): Promise<boolean> {
  try {
    const skillFile = path.join(dirPath, SKILL_FILE);
    await fs.access(skillFile);
    return true;
  } catch {
    return false;
  }
}

/**
 * Scan a directory for skill subdirectories.
 */
async function scanSkillsDir(
  skillsDir: string,
  scope: "global" | "session",
  sessionName?: string
): Promise<ConventionSkill[]> {
  const skills: ConventionSkill[] = [];

  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillPath = path.join(skillsDir, entry.name);
      if (await isSkillDirectory(skillPath)) {
        skills.push({
          name: entry.name,
          path: skillPath,
          scope,
          sessionName,
        });
      }
    }
  } catch (err) {
    // Directory doesn't exist or can't be read - that's fine
    logVerbose(`Skills directory not found or not readable: ${skillsDir}`);
  }

  return skills;
}

/**
 * Discover convention-based skills from the filesystem.
 * Scans both global skills and session-specific skills.
 */
export async function discoverConventionSkills(
  options: DiscoverConventionSkillsOptions
): Promise<ConventionSkillDiscoveryResult> {
  const { workspacePath, sessionName } = options;
  const allSkills: ConventionSkill[] = [];

  // Scan global skills directory (workspacePath is ~/klaus/whatsapp/)
  const globalSkillsDir = path.join(workspacePath, "skills");
  const globalSkills = await scanSkillsDir(globalSkillsDir, "global");
  allSkills.push(...globalSkills);
  logVerbose(`Discovered ${globalSkills.length} global skills`);

  // Scan session-specific skills if sessionName provided (@phone or #groupname)
  if (sessionName) {
    const sessionSkillsDir = path.join(
      workspacePath,
      sessionName,
      "skills"
    );
    const sessionSkills = await scanSkillsDir(
      sessionSkillsDir,
      "session",
      sessionName
    );
    allSkills.push(...sessionSkills);
    logVerbose(
      `Discovered ${sessionSkills.length} session skills for ${sessionName}`
    );
  }

  // Generate system prompt section
  const systemPromptSection = formatSkillsForSystemPrompt(allSkills);

  return {
    skills: allSkills,
    systemPromptSection,
  };
}

/**
 * Format discovered skills into a system prompt section.
 */
export function formatSkillsForSystemPrompt(skills: ConventionSkill[]): string {
  if (skills.length === 0) {
    return "";
  }

  const globalSkills = skills.filter((s) => s.scope === "global");
  const sessionSkills = skills.filter((s) => s.scope === "session");

  let section = "## Available Skills\n\n";
  section += "Skills are reusable tools. Read SKILL.md before using.\n\n";

  if (globalSkills.length > 0) {
    section += "### Global Skills\n";
    for (const skill of globalSkills) {
      section += `- **${skill.name}** (\`${skill.path}/\`)\n`;
    }
    section += "\n";
  }

  if (sessionSkills.length > 0) {
    section += "### Session Skills\n";
    for (const skill of sessionSkills) {
      section += `- **${skill.name}** (\`${skill.path}/\`)\n`;
    }
    section += "\n";
  }

  section += "To use: read SKILL.md, then run commands via bash.";

  return section;
}
