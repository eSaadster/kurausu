/**
 * Main config routes (klaus.json)
 */

import { Router, type Request, type Response } from "express";
import path from "node:path";
import os from "node:os";
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import { readJSON5, writeJSON, fileExists, readJSON } from "../services/file-ops.js";
import { createBackup, listBackups, restoreBackup } from "../services/backup.js";
import { validateWarelayConfig } from "../services/validation.js";
import { getProviders, getModels } from "@mariozechner/pi-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const CONFIG_PATH = path.join(os.homedir(), ".klaus", "klaus.json");
const MODELS_PATH = path.join(os.homedir(), ".pi", "agent", "models.json");

interface ModelsConfig {
  providers: Record<string, { models: Array<{ id: string; name: string }> }>;
}

/**
 * Render a page with layout
 */
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

// Config editor page
router.get("/", async (req: Request, res: Response) => {
  try {
    let config: Record<string, unknown> = {};
    let rawContent = "{}";

    if (await fileExists(CONFIG_PATH)) {
      config = await readJSON5(CONFIG_PATH) as Record<string, unknown>;
      const fs = await import("node:fs/promises");
      rawContent = await fs.readFile(CONFIG_PATH, "utf-8");
    }

    const backups = await listBackups(CONFIG_PATH);

    // Build all models list (built-in + custom)
    const allModels: Array<{ id: string; name: string; provider: string }> = [];

    // Add built-in models
    for (const provider of getProviders()) {
      const models = getModels(provider);
      for (const m of models) {
        allModels.push({ id: m.id, name: m.name || m.id, provider });
      }
    }

    // Add custom models
    if (await fileExists(MODELS_PATH)) {
      const customConfig = await readJSON<ModelsConfig>(MODELS_PATH);
      for (const [providerName, providerData] of Object.entries(customConfig.providers || {})) {
        for (const m of providerData.models || []) {
          // Check if already exists (custom overrides built-in)
          const existingIdx = allModels.findIndex(x => x.id === m.id);
          if (existingIdx >= 0) {
            allModels[existingIdx] = { id: m.id, name: m.name || m.id, provider: providerName };
          } else {
            allModels.push({ id: m.id, name: m.name || m.id, provider: providerName });
          }
        }
      }
    }

    // Get current piAgentModel from config
    const inbound = config.inbound as Record<string, unknown> | undefined;
    const reply = inbound?.reply as Record<string, unknown> | undefined;
    const currentModel = reply?.piAgentModel as string | undefined;

    await renderPage(res, "config", {
      title: "Main Config",
      config,
      rawContent,
      backups,
      configPath: CONFIG_PATH,
      allModels,
      currentModel,
    });
  } catch (err) {
    console.error("Config page error:", err);
    res.status(500).send("Error loading config");
  }
});

// Save config
router.post("/", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { content } = req.body;

    // Parse and validate
    let parsed: unknown;
    try {
      const JSON5 = (await import("json5")).default;
      parsed = JSON5.parse(content);
    } catch (parseErr) {
      res.status(400).json({
        error: "Invalid JSON",
        details: String(parseErr),
      });
      return;
    }

    const validation = validateWarelayConfig(parsed);
    if (!validation.valid) {
      res.status(400).json({
        error: "Validation failed",
        errors: validation.errors,
      });
      return;
    }

    // Create backup before saving
    if (await fileExists(CONFIG_PATH)) {
      await createBackup(CONFIG_PATH);
    }

    // Write the config
    await writeJSON(CONFIG_PATH, parsed);

    res.json({ success: true, message: "Config saved" });
  } catch (err) {
    console.error("Save config error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// Validate config without saving
router.post("/validate", async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    let parsed: unknown;
    try {
      const JSON5 = (await import("json5")).default;
      parsed = JSON5.parse(content);
    } catch (parseErr) {
      res.status(400).json({
        valid: false,
        error: "Invalid JSON",
        details: String(parseErr),
      });
      return;
    }

    const validation = validateWarelayConfig(parsed);
    res.json(validation);
  } catch (err) {
    res.status(500).json({ valid: false, error: String(err) });
  }
});

// Create backup
router.post("/backup", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    if (!(await fileExists(CONFIG_PATH))) {
      res.status(404).json({ error: "Config file not found" });
      return;
    }

    const backupPath = await createBackup(CONFIG_PATH);
    res.json({ success: true, path: backupPath });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// List backups
router.get("/backups", async (_req: Request, res: Response) => {
  try {
    const backups = await listBackups(CONFIG_PATH);
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Restore from backup
router.post("/restore/:timestamp", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { timestamp } = req.params;
    const success = await restoreBackup(CONFIG_PATH, timestamp);

    if (success) {
      res.json({ success: true, message: "Config restored" });
    } else {
      res.status(404).json({ error: "Backup not found" });
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
