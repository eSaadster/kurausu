// Skills initialization and loading

import { logVerbose } from "../../globals.js";
import { getSkillRegistry } from "./registry.js";

/**
 * Load built-in programmatic skills.
 * Add new built-in skills here as they are created.
 */
async function loadBuiltinSkills(): Promise<void> {
  // Currently no built-in programmatic skills
  // Future skills can be imported and registered here:
  //
  // import { calendarSkill } from "./builtin/calendar.js";
  // registry.register(calendarSkill);

  logVerbose("No built-in programmatic skills to load");
}

/**
 * Initialize the skills system.
 * Call this once at application startup.
 */
export async function initializeSkills(): Promise<void> {
  logVerbose("Initializing skills system...");

  // Load built-in programmatic skills
  await loadBuiltinSkills();

  const registry = getSkillRegistry();
  const skills = registry.getAll();
  logVerbose(`Skills system initialized with ${skills.length} programmatic skills`);
}
