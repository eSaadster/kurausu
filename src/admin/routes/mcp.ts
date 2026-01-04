/**
 * MCP servers routes with live control
 */

import { Router, type Request, type Response } from "express";
import path from "node:path";
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import { readJSON, writeJSON, fileExists, expandPath } from "../services/file-ops.js";
import { createBackup } from "../services/backup.js";
import { validateMcpConfig } from "../services/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const SOURCE_MCP_PATH = path.join(process.cwd(), "config", "mcporter.json");

interface McpServer {
  baseUrl: string;
  headers?: Record<string, string>;
}

interface McpConfig {
  mcpServers?: Record<string, McpServer>;
  imports?: string[];
}

// Track server status (in-memory for now)
const serverStatus: Record<string, { status: "connected" | "disconnected" | "error"; lastCheck: number; error?: string }> = {};

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

// MCP servers page
router.get("/", async (req: Request, res: Response) => {
  try {
    let mcpConfig: McpConfig = { mcpServers: {} };

    if (await fileExists(SOURCE_MCP_PATH)) {
      mcpConfig = await readJSON<McpConfig>(SOURCE_MCP_PATH);
    }

    const servers = Object.entries(mcpConfig.mcpServers || {}).map(([name, config]) => ({
      name,
      ...config,
      status: serverStatus[name] || { status: "disconnected", lastCheck: 0 },
    }));

    await renderPage(res, "mcp", {
      title: "MCP Servers",
      mcpConfig,
      servers,
      mcpPath: SOURCE_MCP_PATH,
    });
  } catch (err) {
    console.error("MCP page error:", err);
    res.status(500).send("Error loading MCP config");
  }
});

// Get status of all servers
router.get("/status", async (_req: Request, res: Response) => {
  try {
    let mcpConfig: McpConfig = { mcpServers: {} };

    if (await fileExists(SOURCE_MCP_PATH)) {
      mcpConfig = await readJSON<McpConfig>(SOURCE_MCP_PATH);
    }

    const statuses = Object.keys(mcpConfig.mcpServers || {}).map((name) => ({
      name,
      ...(serverStatus[name] || { status: "disconnected", lastCheck: 0 }),
    }));

    res.json(statuses);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Save entire MCP config
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
      res.status(400).json({ error: "Invalid JSON", details: String(parseErr) });
      return;
    }

    const validation = validateMcpConfig(parsed);
    if (!validation.valid) {
      res.status(400).json({ error: "Validation failed", errors: validation.errors });
      return;
    }

    if (await fileExists(SOURCE_MCP_PATH)) {
      await createBackup(SOURCE_MCP_PATH);
    }

    await writeJSON(SOURCE_MCP_PATH, parsed);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Add/update server
router.post("/servers", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { name, baseUrl, headers } = req.body;

    let mcpConfig: McpConfig = { mcpServers: {} };
    if (await fileExists(SOURCE_MCP_PATH)) {
      mcpConfig = await readJSON<McpConfig>(SOURCE_MCP_PATH);
      await createBackup(SOURCE_MCP_PATH);
    }

    mcpConfig.mcpServers = mcpConfig.mcpServers || {};
    mcpConfig.mcpServers[name] = { baseUrl, headers };

    await writeJSON(SOURCE_MCP_PATH, mcpConfig);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Delete server
router.delete("/servers/:name", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { name } = req.params;

    if (!(await fileExists(SOURCE_MCP_PATH))) {
      res.status(404).json({ error: "MCP config not found" });
      return;
    }

    const mcpConfig = await readJSON<McpConfig>(SOURCE_MCP_PATH);
    await createBackup(SOURCE_MCP_PATH);

    delete mcpConfig.mcpServers?.[name];
    delete serverStatus[name];

    await writeJSON(SOURCE_MCP_PATH, mcpConfig);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Start/connect server
router.post("/servers/:name/start", async (req: Request, res: Response) => {
  const { name } = req.params;

  // TODO: Implement actual MCP connection via mcporter
  // For now, just update status
  serverStatus[name] = {
    status: "connected",
    lastCheck: Date.now(),
  };

  res.json({ success: true, message: `Server ${name} started` });
});

// Stop/disconnect server
router.post("/servers/:name/stop", async (req: Request, res: Response) => {
  const { name } = req.params;

  // TODO: Implement actual MCP disconnection
  serverStatus[name] = {
    status: "disconnected",
    lastCheck: Date.now(),
  };

  res.json({ success: true, message: `Server ${name} stopped` });
});

// Restart server
router.post("/servers/:name/restart", async (req: Request, res: Response) => {
  const { name } = req.params;

  // TODO: Implement actual restart
  serverStatus[name] = {
    status: "connected",
    lastCheck: Date.now(),
  };

  res.json({ success: true, message: `Server ${name} restarted` });
});

export default router;
