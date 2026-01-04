/**
 * Session management routes
 */

import { Router, type Request, type Response } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import {
  readJSON,
  writeJSON,
  readText,
  writeText,
  readEnvFile,
  writeEnvFile,
  fileExists,
} from "../services/file-ops.js";
import { createBackup } from "../services/backup.js";
import { discoverSessions, getSessionPath } from "../services/discovery.js";
import { validateMcpConfig, validateClicksFile } from "../services/validation.js";
import { getPiAgentManager } from "../../auto-reply/pi-agent.js";
import { RELAY_INTERNAL_PORT } from "../../web/auto-reply.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Types for new tabs
interface SkillInfo {
  name: string;
  description: string;
  path: string;
}

interface FileInfo {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
}

interface EntityInfo {
  id: string;
  type: string;
  name: string;
  aliases?: string[];
  lastMentioned?: number;
}

interface KnowledgeItem {
  id: string;
  content: string;
  status?: string;
  confidence?: number;
  validFrom?: number;
}

interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

// Helper: Parse SKILL.md first line for description
function parseSkillDescription(content: string): string {
  const lines = content.split("\n");
  // Skip first line if it's a heading, get the first non-empty paragraph
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    return trimmed.slice(0, 100) + (trimmed.length > 100 ? "..." : "");
  }
  return "";
}

// Helper: Load skills from session/skills/ folder
async function loadSkills(sessionPath: string): Promise<SkillInfo[]> {
  const skillsPath = path.join(sessionPath, "skills");
  const skills: SkillInfo[] = [];

  if (!(await fileExists(skillsPath))) return skills;

  try {
    const dirs = await fs.readdir(skillsPath, { withFileTypes: true });
    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;

      const skillMdPath = path.join(skillsPath, dir.name, "SKILL.md");
      let description = "";

      if (await fileExists(skillMdPath)) {
        const content = await readText(skillMdPath);
        description = parseSkillDescription(content);
      }

      skills.push({
        name: dir.name,
        description,
        path: path.join(skillsPath, dir.name),
      });
    }
  } catch {
    // Skills folder exists but couldn't be read
  }

  return skills;
}

// Helper: Load entity memory
async function loadEntityMemory(sessionPath: string): Promise<{
  entities: EntityInfo[];
  facts: KnowledgeItem[];
  tasks: KnowledgeItem[];
  decisions: KnowledgeItem[];
  sessionMd: string;
}> {
  const memoryPath = path.join(sessionPath, "memory");
  const result = {
    entities: [] as EntityInfo[],
    facts: [] as KnowledgeItem[],
    tasks: [] as KnowledgeItem[],
    decisions: [] as KnowledgeItem[],
    sessionMd: "",
  };

  // Load session.md (legacy)
  const sessionMdPath = path.join(sessionPath, "session.md");
  if (await fileExists(sessionMdPath)) {
    result.sessionMd = await readText(sessionMdPath);
  }

  if (!(await fileExists(memoryPath))) return result;

  try {
    // Load entity index
    const indexPath = path.join(memoryPath, "entities", "index.json");
    if (await fileExists(indexPath)) {
      const index = await readJSON(indexPath) as { entities?: Record<string, { type: string; name: string; aliases?: string[]; lastMentioned?: number }> };
      if (index.entities) {
        for (const [id, entity] of Object.entries(index.entities)) {
          result.entities.push({
            id,
            type: entity.type,
            name: entity.name,
            aliases: entity.aliases,
            lastMentioned: entity.lastMentioned,
          });
        }
      }
    }

    // Load knowledge stores
    const knowledgePath = path.join(memoryPath, "knowledge");

    const factsPath = path.join(knowledgePath, "facts.json");
    if (await fileExists(factsPath)) {
      const data = await readJSON(factsPath) as { items?: KnowledgeItem[] };
      result.facts = (data.items || []).slice(0, 20);
    }

    const tasksPath = path.join(knowledgePath, "tasks.json");
    if (await fileExists(tasksPath)) {
      const data = await readJSON(tasksPath) as { items?: KnowledgeItem[] };
      result.tasks = (data.items || []).slice(0, 20);
    }

    const decisionsPath = path.join(knowledgePath, "decisions.json");
    if (await fileExists(decisionsPath)) {
      const data = await readJSON(decisionsPath) as { items?: KnowledgeItem[] };
      result.decisions = (data.items || []).slice(0, 20);
    }
  } catch {
    // Memory folder exists but couldn't be read
  }

  return result;
}

// Helper: Load conversation history
async function loadHistory(sessionPath: string): Promise<ConversationTurn[]> {
  const statePath = path.join(sessionPath, "memory", "state.json");

  // Try new entity memory system first
  if (await fileExists(statePath)) {
    try {
      const state = await readJSON(statePath) as { recentTurns?: ConversationTurn[] };
      if (state.recentTurns && Array.isArray(state.recentTurns)) {
        return state.recentTurns.slice(-50); // Last 50 turns
      }
    } catch {
      // Fall through to legacy
    }
  }

  // Fallback: parse session.md ## recent section
  const sessionMdPath = path.join(sessionPath, "session.md");
  if (await fileExists(sessionMdPath)) {
    try {
      const content = await readText(sessionMdPath);
      const recentMatch = content.match(/## recent\n([\s\S]*?)(?=\n## |$)/);
      if (recentMatch) {
        const turns: ConversationTurn[] = [];
        const lines = recentMatch[1].split("\n");
        for (const line of lines) {
          if (line.startsWith("U: ")) {
            turns.push({ role: "user", content: line.slice(3) });
          } else if (line.startsWith("A: ")) {
            turns.push({ role: "assistant", content: line.slice(3) });
          }
        }
        return turns.slice(-50);
      }
    } catch {
      // Couldn't parse
    }
  }

  return [];
}

// Helper: List session files (non-recursive, exclude large dirs)
async function listSessionFiles(sessionPath: string): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  const excludeDirs = new Set(["scratchpad", ".git", "node_modules", "grips"]);

  async function scanDir(dirPath: string, depth: number = 0): Promise<void> {
    if (depth > 2) return; // Max 2 levels deep

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (excludeDirs.has(entry.name)) continue;

        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(sessionPath, fullPath);

        try {
          const stats = await fs.stat(fullPath);

          files.push({
            name: entry.name,
            path: fullPath,
            relativePath,
            isDirectory: entry.isDirectory(),
            size: stats.size,
            modified: stats.mtime,
          });

          if (entry.isDirectory() && depth < 2) {
            await scanDir(fullPath, depth + 1);
          }
        } catch {
          // Skip files we can't stat
        }
      }
    } catch {
      // Skip dirs we can't read
    }
  }

  await scanDir(sessionPath);

  // Sort: directories first, then by name
  files.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.relativePath.localeCompare(b.relativePath);
  });

  return files;
}

async function renderPage(
  res: Response,
  page: string,
  data: Record<string, unknown>,
): Promise<void> {
  const viewsDir = path.join(__dirname, "..", "views");
  const pageContent = await ejs.renderFile(
    path.join(viewsDir, "pages", `${page}.ejs`),
    { ...res.locals, ...data },
  );
  res.render("layout", { ...data, body: pageContent });
}

// Sessions list
router.get("/", async (req: Request, res: Response) => {
  try {
    const sessions = await discoverSessions();

    await renderPage(res, "sessions/list", {
      title: "Sessions",
      sessions,
    });
  } catch (err) {
    console.error("Sessions page error:", err);
    res.status(500).send("Error loading sessions");
  }
});

// Session detail
router.get("/:name", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const sessionPath = getSessionPath(name);

    // Check if session exists
    if (!(await fileExists(sessionPath))) {
      res.status(404).render("layout", {
        title: "Not Found",
        body: `<div class="card"><p>Session "${name}" not found</p></div>`,
      });
      return;
    }

    // Load session data
    const envPath = path.join(sessionPath, ".env");
    const systemPath = path.join(sessionPath, "SYSTEM.md");
    const mcporterPath = path.join(sessionPath, "mcporter.json");
    const clicksPath = path.join(sessionPath, "clicks.json");
    const configPath = path.join(sessionPath, "config.json");
    const watchersPath = path.join(sessionPath, "watchers.json");

    const envVars = await readEnvFile(envPath);
    const systemContent = (await fileExists(systemPath))
      ? await readText(systemPath)
      : "";
    const mcporterConfig = (await fileExists(mcporterPath))
      ? await readJSON(mcporterPath)
      : { mcpServers: {} };
    const clicksConfig = (await fileExists(clicksPath))
      ? await readJSON(clicksPath)
      : { clicks: [] };
    const sessionConfig = (await fileExists(configPath))
      ? await readJSON(configPath)
      : {};
    const watchersContent = (await fileExists(watchersPath))
      ? await readText(watchersPath)
      : "";

    // Load new tab data in parallel
    const [skills, memory, history, files] = await Promise.all([
      loadSkills(sessionPath),
      loadEntityMemory(sessionPath),
      loadHistory(sessionPath),
      listSessionFiles(sessionPath),
    ]);

    await renderPage(res, "sessions/detail", {
      title: `Session: ${name}`,
      sessionName: name,
      sessionPath,
      envVars,
      systemContent,
      mcporterConfig,
      clicksConfig,
      sessionConfig,
      hasEnv: await fileExists(envPath),
      hasSystem: await fileExists(systemPath),
      hasMcporter: await fileExists(mcporterPath),
      hasClicks: await fileExists(clicksPath),
      hasWatchers: await fileExists(watchersPath),
      watchersContent,
      // New tab data
      skills,
      memory,
      history,
      files,
    });
  } catch (err) {
    console.error("Session detail error:", err);
    res.status(500).send("Error loading session");
  }
});

// Update .env
router.post("/:name/env", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { name } = req.params;
    const sessionPath = getSessionPath(name);
    const envPath = path.join(sessionPath, ".env");

    // Parse the content as key=value pairs
    const { content } = req.body;
    const envVars: Record<string, string> = {};

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      // Remove quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      envVars[key] = value;
    }

    if (await fileExists(envPath)) {
      await createBackup(envPath);
    }

    await writeEnvFile(envPath, envVars);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Update SYSTEM.md
router.post("/:name/system", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { name } = req.params;
    const sessionPath = getSessionPath(name);
    const systemPath = path.join(sessionPath, "SYSTEM.md");

    const { content } = req.body;

    if (await fileExists(systemPath)) {
      await createBackup(systemPath);
    }

    await writeText(systemPath, content);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Update mcporter.json
router.post("/:name/mcporter", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { name } = req.params;
    const sessionPath = getSessionPath(name);
    const mcporterPath = path.join(sessionPath, "mcporter.json");

    const { content } = req.body;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      res.status(400).json({ error: "Invalid JSON", details: String(parseErr) });
      return;
    }

    const validation = validateMcpConfig(parsed);
    if (!validation.valid) {
      res.status(400).json({ error: "Validation failed", errors: validation.errors });
      return;
    }

    if (await fileExists(mcporterPath)) {
      await createBackup(mcporterPath);
    }

    await writeJSON(mcporterPath, parsed);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Update clicks.json
router.post("/:name/clicks", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { name } = req.params;
    const sessionPath = getSessionPath(name);
    const clicksPath = path.join(sessionPath, "clicks.json");

    const { content } = req.body;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      res.status(400).json({ error: "Invalid JSON", details: String(parseErr) });
      return;
    }

    const validation = validateClicksFile(parsed);
    if (!validation.valid) {
      res.status(400).json({ error: "Validation failed", errors: validation.errors });
      return;
    }

    if (await fileExists(clicksPath)) {
      await createBackup(clicksPath);
    }

    await writeJSON(clicksPath, parsed);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Update config.json
router.post("/:name/config", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { name } = req.params;
    const sessionPath = getSessionPath(name);
    const configPath = path.join(sessionPath, "config.json");

    const { content } = req.body;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      res.status(400).json({ error: "Invalid JSON", details: String(parseErr) });
      return;
    }

    if (await fileExists(configPath)) {
      await createBackup(configPath);
    }

    await writeJSON(configPath, parsed);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Update watchers.json
router.post("/:name/watchers", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { name } = req.params;
    const sessionPath = getSessionPath(name);
    const watchersPath = path.join(sessionPath, "watchers.json");

    const { content } = req.body;

    if (await fileExists(watchersPath)) {
      await createBackup(watchersPath);
    }

    await writeText(watchersPath, content);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Poke session - inject message into conversation agent
router.post("/:name/poke", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { name } = req.params;
    const { message, sendViaWhatsapp } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "message is required" });
      return;
    }

    // Get the global PiAgentManager (same one used by WhatsApp relay)
    const manager = getPiAgentManager();

    // Inject message into the conversation agent
    const result = await manager.prompt(name, message);

    // If sendViaWhatsapp is true, forward the response via relay's internal endpoint
    let sentViaWhatsapp = false;
    let whatsappError: string | undefined;
    if (sendViaWhatsapp && result.text) {
      try {
        const sendResponse = await fetch(`http://127.0.0.1:${RELAY_INTERNAL_PORT}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionName: name, message: result.text }),
        });
        if (sendResponse.ok) {
          sentViaWhatsapp = true;
        } else {
          const errorData = await sendResponse.json().catch(() => ({}));
          whatsappError = (errorData as { error?: string }).error || `HTTP ${sendResponse.status}`;
        }
      } catch (err) {
        whatsappError = String(err);
      }
    }

    res.json({
      success: true,
      response: result.text,
      messageCount: result.messageCount,
      isNewSession: result.isNew,
      sentViaWhatsapp,
      whatsappError,
    });
  } catch (err) {
    console.error("Poke session error:", err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
