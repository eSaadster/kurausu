/**
 * Pi Agent settings routes
 */

import { Router, type Request, type Response } from "express";
import path from "node:path";
import os from "node:os";
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import { readJSON, writeJSON, fileExists } from "../services/file-ops.js";
import { createBackup } from "../services/backup.js";
import { validatePiSettings } from "../services/validation.js";
import { getProviders, getModels, type KnownProvider } from "@mariozechner/pi-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const SETTINGS_PATH = path.join(os.homedir(), ".pi", "agent", "settings.json");
const MODELS_PATH = path.join(os.homedir(), ".pi", "agent", "models.json");

interface PiSettings {
  lastChangelogVersion?: string;
  defaultThinkingLevel?: string;
  defaultProvider?: string;
  defaultModel?: string;
}

interface ModelsConfig {
  providers: Record<string, { models: Array<{ id: string; name: string }> }>;
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

// Settings page
router.get("/", async (req: Request, res: Response) => {
  try {
    let settings: PiSettings = {};
    let models: ModelsConfig = { providers: {} };

    if (await fileExists(SETTINGS_PATH)) {
      settings = await readJSON<PiSettings>(SETTINGS_PATH);
    }

    if (await fileExists(MODELS_PATH)) {
      models = await readJSON<ModelsConfig>(MODELS_PATH);
    }

    // Build list of providers and their models for dropdowns
    // Start with built-in providers from pi-agent-core
    const builtInProviders = getProviders();
    const customProviders = Object.keys(models.providers);
    const providers = [...new Set([...builtInProviders, ...customProviders])];

    const modelsByProvider: Record<string, Array<{ id: string; name: string }>> = {};

    // Add built-in models
    for (const provider of builtInProviders) {
      const builtInModels = getModels(provider);
      modelsByProvider[provider] = builtInModels.map(m => ({ id: m.id, name: m.name || m.id }));
    }

    // Add/merge custom models
    for (const [name, provider] of Object.entries(models.providers)) {
      const customModels = (provider.models || []).map(m => ({ id: m.id, name: m.name || m.id }));
      if (modelsByProvider[name]) {
        // Merge with built-in, custom takes precedence
        const existingIds = new Set(customModels.map(m => m.id));
        const merged = [...customModels, ...modelsByProvider[name].filter(m => !existingIds.has(m.id))];
        modelsByProvider[name] = merged;
      } else {
        modelsByProvider[name] = customModels;
      }
    }

    await renderPage(res, "settings", {
      title: "Pi Agent Settings",
      settings,
      providers,
      modelsByProvider,
      settingsPath: SETTINGS_PATH,
    });
  } catch (err) {
    console.error("Settings page error:", err);
    res.status(500).send("Error loading settings");
  }
});

// Save settings
router.post("/", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const settings: PiSettings = {
      defaultThinkingLevel: req.body.defaultThinkingLevel || undefined,
      defaultProvider: req.body.defaultProvider || undefined,
      defaultModel: req.body.defaultModel || undefined,
    };

    // Preserve lastChangelogVersion if it exists
    if (await fileExists(SETTINGS_PATH)) {
      const existing = await readJSON<PiSettings>(SETTINGS_PATH);
      await createBackup(SETTINGS_PATH);
      if (existing.lastChangelogVersion) {
        settings.lastChangelogVersion = existing.lastChangelogVersion;
      }
    }

    const validation = validatePiSettings(settings);
    if (!validation.valid) {
      res.status(400).json({
        error: "Validation failed",
        errors: validation.errors,
      });
      return;
    }

    await writeJSON(SETTINGS_PATH, settings);
    res.json({ success: true, message: "Settings saved" });
  } catch (err) {
    console.error("Save settings error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// Get providers list (for dynamic dropdowns)
router.get("/providers", async (_req: Request, res: Response) => {
  try {
    const builtInProviders = getProviders();
    let customProviders: string[] = [];

    if (await fileExists(MODELS_PATH)) {
      const models = await readJSON<ModelsConfig>(MODELS_PATH);
      customProviders = Object.keys(models.providers);
    }

    const providers = [...new Set([...builtInProviders, ...customProviders])];
    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get models for a provider (for dynamic dropdowns)
router.get("/models/:provider", async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const result: Array<{ id: string; name: string }> = [];

    // Check built-in providers first
    const builtInProviders = getProviders();
    if (builtInProviders.includes(provider as KnownProvider)) {
      const builtInModels = getModels(provider as KnownProvider);
      result.push(...builtInModels.map(m => ({ id: m.id, name: m.name || m.id })));
    }

    // Add custom models
    if (await fileExists(MODELS_PATH)) {
      const models = await readJSON<ModelsConfig>(MODELS_PATH);
      const providerConfig = models.providers[provider];
      if (providerConfig?.models) {
        const customModels = providerConfig.models.map(m => ({ id: m.id, name: m.name || m.id }));
        // Merge, custom takes precedence
        const existingIds = new Set(customModels.map(m => m.id));
        const merged = [...customModels, ...result.filter(m => !existingIds.has(m.id))];
        res.json(merged);
        return;
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
