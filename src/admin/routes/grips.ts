/**
 * Grips control routes
 */

import { Router, type Request, type Response } from "express";
import path from "node:path";
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import { readText, fileExists, listDirectories, listFiles, expandPath } from "../services/file-ops.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const GRIPS_TEMPLATES = expandPath("~/klaus/grips/templates");
const GRIPS_ACTIVE = expandPath("~/klaus/grips/active");
const GRIPS_ARCHIVE = expandPath("~/klaus/grips/archive");

interface GripTemplate {
  id: string;
  content: string;
  config: Record<string, string>;
}

interface GripInstance {
  id: string;
  templateId: string;
  session: string;
  status: string;
  started: string;
  attempts: number;
  tmuxSession: string;
  userPrompt?: string;
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

// Parse grip template frontmatter
function parseGripTemplate(content: string): { config: Record<string, string>; body: string } {
  const config: Record<string, string> = {};

  if (content.startsWith("---")) {
    const endIndex = content.indexOf("---", 3);
    if (endIndex !== -1) {
      const frontmatter = content.slice(3, endIndex).trim();
      for (const line of frontmatter.split("\n")) {
        const colonIndex = line.indexOf(":");
        if (colonIndex !== -1) {
          const key = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, "");
          config[key] = value;
        }
      }
      return { config, body: content.slice(endIndex + 3).trim() };
    }
  }

  return { config, body: content };
}

// Parse grip YAML
function parseGripYaml(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, "");
      result[key] = value;
    }
  }
  return result;
}

// Load templates
async function loadTemplates(): Promise<GripTemplate[]> {
  const templates: GripTemplate[] = [];

  if (!(await fileExists(GRIPS_TEMPLATES))) {
    return templates;
  }

  const files = await listFiles(GRIPS_TEMPLATES, ".md");

  for (const file of files) {
    try {
      const filePath = path.join(GRIPS_TEMPLATES, file);
      const content = await readText(filePath);
      const { config, body } = parseGripTemplate(content);

      templates.push({
        id: file.replace(/\.md$/, ""),
        content: body,
        config,
      });
    } catch {
      // Ignore errors
    }
  }

  return templates;
}

// Load active grips
async function loadActiveGrips(): Promise<GripInstance[]> {
  const grips: GripInstance[] = [];

  if (!(await fileExists(GRIPS_ACTIVE))) {
    return grips;
  }

  const dirs = await listDirectories(GRIPS_ACTIVE);

  for (const dir of dirs) {
    try {
      const gripPath = path.join(GRIPS_ACTIVE, dir, "grip.yaml");
      if (!(await fileExists(gripPath))) continue;

      const content = await readText(gripPath);
      const data = parseGripYaml(content);

      grips.push({
        id: data.id || dir,
        templateId: data.templateId || "",
        session: data.session || "",
        status: data.status || "unknown",
        started: data.started || "",
        attempts: parseInt(data.attempts || "0", 10),
        tmuxSession: data.tmuxSession || "",
        userPrompt: data.userPrompt,
      });
    } catch {
      // Ignore errors
    }
  }

  return grips;
}

// Grips dashboard
router.get("/", async (req: Request, res: Response) => {
  try {
    const templates = await loadTemplates();
    const activeGrips = await loadActiveGrips();

    await renderPage(res, "grips", {
      title: "Grips",
      templates,
      activeGrips,
      templatesPath: GRIPS_TEMPLATES,
      activePath: GRIPS_ACTIVE,
    });
  } catch (err) {
    console.error("Grips page error:", err);
    res.status(500).send("Error loading grips");
  }
});

// Get templates list
router.get("/templates", async (_req: Request, res: Response) => {
  try {
    const templates = await loadTemplates();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get active grips
router.get("/active", async (_req: Request, res: Response) => {
  try {
    const grips = await loadActiveGrips();
    res.json(grips);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get grip status
router.get("/status", async (_req: Request, res: Response) => {
  try {
    const grips = await loadActiveGrips();
    res.json({
      active: grips.length,
      grips: grips.map((g) => ({
        id: g.id,
        status: g.status,
        session: g.session,
        attempts: g.attempts,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Start new grip
router.post("/start/:templateId", async (req: Request, res: Response) => {
  const { templateId } = req.params;

  // TODO: Implement actual grip start via GripManager
  res.json({
    success: true,
    message: `Grip from template ${templateId} would be started`,
  });
});

// Stop grip
router.post("/active/:id/stop", async (req: Request, res: Response) => {
  const { id } = req.params;

  // TODO: Implement actual grip stop via GripManager
  res.json({
    success: true,
    message: `Grip ${id} would be stopped`,
  });
});

// Pause grip
router.post("/active/:id/pause", async (req: Request, res: Response) => {
  const { id } = req.params;

  // TODO: Implement actual grip pause
  res.json({
    success: true,
    message: `Grip ${id} would be paused`,
  });
});

// Resume grip
router.post("/active/:id/resume", async (req: Request, res: Response) => {
  const { id } = req.params;

  // TODO: Implement actual grip resume
  res.json({
    success: true,
    message: `Grip ${id} would be resumed`,
  });
});

// View grip logs
router.get("/active/:id/logs", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logsPath = path.join(GRIPS_ACTIVE, id, "attempts.jsonl");

    if (!(await fileExists(logsPath))) {
      res.json({ logs: [] });
      return;
    }

    const content = await readText(logsPath);
    const logs = content
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      });

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
