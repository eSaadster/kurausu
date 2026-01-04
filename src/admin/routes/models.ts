/**
 * Pi Agent models routes
 */

import { Router, type Request, type Response } from "express";
import path from "node:path";
import os from "node:os";
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import { readJSON, writeJSON, fileExists } from "../services/file-ops.js";
import { createBackup } from "../services/backup.js";
import { validatePiModels } from "../services/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const MODELS_PATH = path.join(os.homedir(), ".pi", "agent", "models.json");

interface ModelConfig {
  id: string;
  name: string;
  api?: string;
  reasoning?: boolean;
  input?: string[];
  cost?: {
    input: number;
    output: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
  contextWindow?: number;
  maxTokens?: number;
}

interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  api: string;
  models: ModelConfig[];
}

interface ModelsConfig {
  providers: Record<string, ProviderConfig>;
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

// Models page
router.get("/", async (req: Request, res: Response) => {
  try {
    let models: ModelsConfig = { providers: {} };
    let rawContent = '{"providers": {}}';

    if (await fileExists(MODELS_PATH)) {
      models = await readJSON<ModelsConfig>(MODELS_PATH);
      const fs = await import("node:fs/promises");
      rawContent = await fs.readFile(MODELS_PATH, "utf-8");
    }

    await renderPage(res, "models", {
      title: "AI Models",
      models,
      rawContent,
      modelsPath: MODELS_PATH,
    });
  } catch (err) {
    console.error("Models page error:", err);
    res.status(500).send("Error loading models");
  }
});

// Save models config
router.post("/", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { content } = req.body;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      res.status(400).json({
        error: "Invalid JSON",
        details: String(parseErr),
      });
      return;
    }

    const validation = validatePiModels(parsed);
    if (!validation.valid) {
      res.status(400).json({
        error: "Validation failed",
        errors: validation.errors,
      });
      return;
    }

    if (await fileExists(MODELS_PATH)) {
      await createBackup(MODELS_PATH);
    }

    await writeJSON(MODELS_PATH, parsed);
    res.json({ success: true, message: "Models config saved" });
  } catch (err) {
    console.error("Save models error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// Add/update provider
router.post("/:provider", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { provider } = req.params;
    const providerConfig = req.body;

    let models: ModelsConfig = { providers: {} };
    if (await fileExists(MODELS_PATH)) {
      models = await readJSON<ModelsConfig>(MODELS_PATH);
      await createBackup(MODELS_PATH);
    }

    models.providers[provider] = providerConfig;
    await writeJSON(MODELS_PATH, models);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Delete provider
router.delete("/:provider", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { provider } = req.params;

    if (!(await fileExists(MODELS_PATH))) {
      res.status(404).json({ error: "Models file not found" });
      return;
    }

    const models = await readJSON<ModelsConfig>(MODELS_PATH);
    await createBackup(MODELS_PATH);

    delete models.providers[provider];
    await writeJSON(MODELS_PATH, models);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Add model to provider
router.post("/:provider/models", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { provider } = req.params;
    const modelConfig = req.body;

    if (!(await fileExists(MODELS_PATH))) {
      res.status(404).json({ error: "Models file not found" });
      return;
    }

    const models = await readJSON<ModelsConfig>(MODELS_PATH);

    if (!models.providers[provider]) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }

    await createBackup(MODELS_PATH);

    models.providers[provider].models.push(modelConfig);
    await writeJSON(MODELS_PATH, models);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Delete model from provider
router.delete("/:provider/models/:modelId", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { provider, modelId } = req.params;

    if (!(await fileExists(MODELS_PATH))) {
      res.status(404).json({ error: "Models file not found" });
      return;
    }

    const models = await readJSON<ModelsConfig>(MODELS_PATH);

    if (!models.providers[provider]) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }

    await createBackup(MODELS_PATH);

    models.providers[provider].models = models.providers[provider].models.filter(
      (m) => m.id !== modelId,
    );
    await writeJSON(MODELS_PATH, models);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
