/**
 * MCP Server for Klaus Admin Console
 *
 * Exposes all admin REST endpoints as MCP tools, allowing agents to
 * programmatically manage sessions, configs, and other admin operations.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Request, Response } from "express";

// Import services used by route handlers
import { discoverSessions, getSessionPath, discoverAllClicks, discoverActiveGrips } from "./services/discovery.js";
import { readJSON, writeJSON, readText, writeText, readEnvFile, writeEnvFile, fileExists, readJSON5, expandPath } from "./services/file-ops.js";
import { createBackup, listBackups, restoreBackup } from "./services/backup.js";
import { validateWarelayConfig, validateMcpConfig, validateClicksFile, validatePiSettings } from "./services/validation.js";
import { signalReload } from "./services/process-signal.js";
import { getPiAgentManager } from "../auto-reply/pi-agent.js";
import { RELAY_INTERNAL_PORT } from "../web/auto-reply.js";
import path from "node:path";
import os from "node:os";

// Config paths
const KLAUS_CONFIG_PATH = path.join(os.homedir(), ".klaus", "klaus.json");
const PI_SETTINGS_PATH = path.join(os.homedir(), ".pi", "agent", "settings.json");
const MCP_CONFIG_PATH = path.join(process.cwd(), "config", "mcporter.json");

// MCP server instance (singleton)
let mcpServer: McpServer | null = null;

// Active transports by session ID
const activeTransports: Map<string, StreamableHTTPServerTransport> = new Map();

/**
 * Create and configure the MCP server with all admin tools
 */
export function createMcpServer(): McpServer {
  if (mcpServer) {
    return mcpServer;
  }

  mcpServer = new McpServer(
    {
      name: "klaus-admin",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ============================================================
  // DASHBOARD TOOLS
  // ============================================================

  mcpServer.registerTool("get_dashboard", {
    description: "Get dashboard overview data including sessions, MCP servers, clicks, and grips status",
  }, async () => {
    const sessions = await discoverSessions();
    const clicks = await discoverAllClicks();
    const grips = await discoverActiveGrips();

    let mcpCount = 0;
    if (await fileExists(MCP_CONFIG_PATH)) {
      const mcpConfig = await readJSON<{ mcpServers?: Record<string, unknown> }>(MCP_CONFIG_PATH);
      mcpCount = Object.keys(mcpConfig.mcpServers || {}).length;
    }

    const clicksEnabled = clicks.filter((c) => c.enabled).length;

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          mcpCount,
          mcpOnline: 0,
          clicksCount: clicks.length,
          clicksEnabled,
          gripsActive: grips.filter((g) => g.status === "active").length,
          gripsTotal: grips.length,
          sessionsCount: sessions.length,
          sessions: sessions.map(s => ({ name: s.name, hasSystem: s.hasSystem, hasEnv: s.hasEnv })),
        }, null, 2),
      }],
    };
  });

  mcpServer.registerTool("health_check", {
    description: "Check if the admin server is healthy",
  }, async () => {
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ status: "ok", timestamp: Date.now() }),
      }],
    };
  });

  mcpServer.registerTool("reload_config", {
    description: "Signal the main Klaus process to reload its configuration",
  }, async () => {
    await signalReload();
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true, message: "Config reload signal sent" }),
      }],
    };
  });

  // ============================================================
  // SESSION TOOLS
  // ============================================================

  mcpServer.registerTool("list_sessions", {
    description: "List all discovered Klaus sessions with their metadata",
  }, async () => {
    const sessions = await discoverSessions();
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(sessions, null, 2),
      }],
    };
  });

  mcpServer.registerTool("get_session", {
    description: "Get detailed information about a specific session",
    inputSchema: z.object({
      name: z.string().describe("Session name (e.g., @username)"),
    }),
  }, async ({ name }) => {
    const sessionPath = getSessionPath(name);

    if (!(await fileExists(sessionPath))) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: `Session "${name}" not found` }),
        }],
        isError: true,
      };
    }

    const envPath = path.join(sessionPath, ".env");
    const systemPath = path.join(sessionPath, "SYSTEM.md");
    const mcporterPath = path.join(sessionPath, "mcporter.json");
    const clicksPath = path.join(sessionPath, "clicks.json");
    const configPath = path.join(sessionPath, "config.json");
    const watchersPath = path.join(sessionPath, "watchers.json");

    const result: Record<string, unknown> = {
      name,
      path: sessionPath,
      hasEnv: await fileExists(envPath),
      hasSystem: await fileExists(systemPath),
      hasMcporter: await fileExists(mcporterPath),
      hasClicks: await fileExists(clicksPath),
      hasConfig: await fileExists(configPath),
      hasWatchers: await fileExists(watchersPath),
    };

    // Load content if exists
    if (await fileExists(envPath)) {
      result.env = await readEnvFile(envPath);
    }
    if (await fileExists(systemPath)) {
      result.system = await readText(systemPath);
    }
    if (await fileExists(mcporterPath)) {
      result.mcporter = await readJSON(mcporterPath);
    }
    if (await fileExists(clicksPath)) {
      result.clicks = await readJSON(clicksPath);
    }
    if (await fileExists(configPath)) {
      result.config = await readJSON(configPath);
    }
    if (await fileExists(watchersPath)) {
      result.watchers = await readText(watchersPath);
    }

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  });

  mcpServer.registerTool("update_session_env", {
    description: "Update a session's .env file",
    inputSchema: z.object({
      name: z.string().describe("Session name"),
      env: z.record(z.string(), z.string()).describe("Environment variables as key-value pairs"),
    }),
  }, async ({ name, env }) => {
    const sessionPath = getSessionPath(name);
    const envPath = path.join(sessionPath, ".env");

    if (await fileExists(envPath)) {
      await createBackup(envPath);
    }

    await writeEnvFile(envPath, env);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true }),
      }],
    };
  });

  mcpServer.registerTool("update_session_system", {
    description: "Update a session's SYSTEM.md file",
    inputSchema: z.object({
      name: z.string().describe("Session name"),
      content: z.string().describe("New SYSTEM.md content"),
    }),
  }, async ({ name, content }) => {
    const sessionPath = getSessionPath(name);
    const systemPath = path.join(sessionPath, "SYSTEM.md");

    if (await fileExists(systemPath)) {
      await createBackup(systemPath);
    }

    await writeText(systemPath, content);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true }),
      }],
    };
  });

  mcpServer.registerTool("update_session_mcporter", {
    description: "Update a session's mcporter.json MCP configuration",
    inputSchema: z.object({
      name: z.string().describe("Session name"),
      config: z.object({
        mcpServers: z.record(z.string(), z.object({
          baseUrl: z.string(),
          headers: z.record(z.string(), z.string()).optional(),
        })).optional(),
        imports: z.array(z.string()).optional(),
      }).describe("MCP configuration object"),
    }),
  }, async ({ name, config }) => {
    const validation = validateMcpConfig(config);
    if (!validation.valid) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: "Validation failed", errors: validation.errors }),
        }],
        isError: true,
      };
    }

    const sessionPath = getSessionPath(name);
    const mcporterPath = path.join(sessionPath, "mcporter.json");

    if (await fileExists(mcporterPath)) {
      await createBackup(mcporterPath);
    }

    await writeJSON(mcporterPath, config);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true }),
      }],
    };
  });

  mcpServer.registerTool("update_session_clicks", {
    description: "Update a session's clicks.json scheduler configuration",
    inputSchema: z.object({
      name: z.string().describe("Session name"),
      config: z.object({
        clicks: z.array(z.object({
          id: z.string(),
          name: z.string(),
          instructions: z.string(),
          intervalMinutes: z.number(),
          alertCriteria: z.string().optional(),
          enabled: z.boolean().optional(),
          model: z.string().optional(),
        })),
        alertChannel: z.string().optional(),
        alertTarget: z.string().optional(),
        sharedContext: z.string().optional(),
      }).describe("Clicks configuration object"),
    }),
  }, async ({ name, config }) => {
    const validation = validateClicksFile(config);
    if (!validation.valid) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: "Validation failed", errors: validation.errors }),
        }],
        isError: true,
      };
    }

    const sessionPath = getSessionPath(name);
    const clicksPath = path.join(sessionPath, "clicks.json");

    if (await fileExists(clicksPath)) {
      await createBackup(clicksPath);
    }

    await writeJSON(clicksPath, config);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true }),
      }],
    };
  });

  mcpServer.registerTool("update_session_config", {
    description: "Update a session's config.json",
    inputSchema: z.object({
      name: z.string().describe("Session name"),
      config: z.record(z.string(), z.unknown()).describe("Session configuration object"),
    }),
  }, async ({ name, config }) => {
    const sessionPath = getSessionPath(name);
    const configPath = path.join(sessionPath, "config.json");

    if (await fileExists(configPath)) {
      await createBackup(configPath);
    }

    await writeJSON(configPath, config);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true }),
      }],
    };
  });

  mcpServer.registerTool("update_session_watchers", {
    description: "Update a session's watchers.json configuration",
    inputSchema: z.object({
      name: z.string().describe("Session name"),
      content: z.string().describe("Watchers JSON content as string"),
    }),
  }, async ({ name, content }) => {
    const sessionPath = getSessionPath(name);
    const watchersPath = path.join(sessionPath, "watchers.json");

    if (await fileExists(watchersPath)) {
      await createBackup(watchersPath);
    }

    await writeText(watchersPath, content);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true }),
      }],
    };
  });

  mcpServer.registerTool("poke_session", {
    description: "Inject a message into a session's conversation agent and optionally send response via WhatsApp",
    inputSchema: z.object({
      name: z.string().describe("Session name"),
      message: z.string().describe("Message to inject"),
      sendViaWhatsapp: z.boolean().optional().describe("Whether to send response via WhatsApp"),
    }),
  }, async ({ name, message, sendViaWhatsapp }) => {
    const manager = getPiAgentManager();
    const result = await manager.prompt(name, message);

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

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          success: true,
          response: result.text,
          messageCount: result.messageCount,
          isNewSession: result.isNew,
          sentViaWhatsapp,
          whatsappError,
        }, null, 2),
      }],
    };
  });

  // ============================================================
  // MAIN CONFIG TOOLS (klaus.json)
  // ============================================================

  mcpServer.registerTool("get_klaus_config", {
    description: "Get the main klaus.json configuration",
  }, async () => {
    if (!(await fileExists(KLAUS_CONFIG_PATH))) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ config: {}, exists: false }),
        }],
      };
    }

    const config = await readJSON5(KLAUS_CONFIG_PATH);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ config, exists: true }, null, 2),
      }],
    };
  });

  mcpServer.registerTool("update_klaus_config", {
    description: "Update the main klaus.json configuration",
    inputSchema: z.object({
      config: z.record(z.string(), z.unknown()).describe("New configuration object"),
    }),
  }, async ({ config }) => {
    const validation = validateWarelayConfig(config);
    if (!validation.valid) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: "Validation failed", errors: validation.errors }),
        }],
        isError: true,
      };
    }

    if (await fileExists(KLAUS_CONFIG_PATH)) {
      await createBackup(KLAUS_CONFIG_PATH);
    }

    await writeJSON(KLAUS_CONFIG_PATH, config);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true }),
      }],
    };
  });

  mcpServer.registerTool("list_config_backups", {
    description: "List available backups for klaus.json",
  }, async () => {
    const backups = await listBackups(KLAUS_CONFIG_PATH);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(backups, null, 2),
      }],
    };
  });

  mcpServer.registerTool("restore_config_backup", {
    description: "Restore klaus.json from a backup",
    inputSchema: z.object({
      timestamp: z.string().describe("Backup timestamp to restore"),
    }),
  }, async ({ timestamp }) => {
    const success = await restoreBackup(KLAUS_CONFIG_PATH, timestamp);
    if (success) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: true, message: "Config restored" }),
        }],
      };
    } else {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: "Backup not found" }),
        }],
        isError: true,
      };
    }
  });

  // ============================================================
  // PI AGENT SETTINGS TOOLS
  // ============================================================

  mcpServer.registerTool("get_pi_settings", {
    description: "Get Pi Agent settings",
  }, async () => {
    if (!(await fileExists(PI_SETTINGS_PATH))) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ settings: {}, exists: false }),
        }],
      };
    }

    const settings = await readJSON(PI_SETTINGS_PATH);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ settings, exists: true }, null, 2),
      }],
    };
  });

  mcpServer.registerTool("update_pi_settings", {
    description: "Update Pi Agent settings",
    inputSchema: z.object({
      defaultThinkingLevel: z.string().optional(),
      defaultProvider: z.string().optional(),
      defaultModel: z.string().optional(),
    }),
  }, async (settings) => {
    const validation = validatePiSettings(settings);
    if (!validation.valid) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: "Validation failed", errors: validation.errors }),
        }],
        isError: true,
      };
    }

    // Preserve lastChangelogVersion
    let newSettings: Record<string, unknown> = { ...settings };
    if (await fileExists(PI_SETTINGS_PATH)) {
      const existing = await readJSON<{ lastChangelogVersion?: string }>(PI_SETTINGS_PATH);
      await createBackup(PI_SETTINGS_PATH);
      if (existing.lastChangelogVersion) {
        newSettings.lastChangelogVersion = existing.lastChangelogVersion;
      }
    }

    await writeJSON(PI_SETTINGS_PATH, newSettings);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true }),
      }],
    };
  });

  // ============================================================
  // GLOBAL MCP CONFIG TOOLS
  // ============================================================

  mcpServer.registerTool("get_mcp_config", {
    description: "Get the global MCP servers configuration (config/mcporter.json)",
  }, async () => {
    if (!(await fileExists(MCP_CONFIG_PATH))) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ config: { mcpServers: {} }, exists: false }),
        }],
      };
    }

    const config = await readJSON(MCP_CONFIG_PATH);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ config, exists: true }, null, 2),
      }],
    };
  });

  mcpServer.registerTool("update_mcp_config", {
    description: "Update the global MCP servers configuration",
    inputSchema: z.object({
      config: z.object({
        mcpServers: z.record(z.string(), z.object({
          baseUrl: z.string(),
          headers: z.record(z.string(), z.string()).optional(),
        })).optional(),
        imports: z.array(z.string()).optional(),
      }),
    }),
  }, async ({ config }) => {
    const validation = validateMcpConfig(config);
    if (!validation.valid) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: "Validation failed", errors: validation.errors }),
        }],
        isError: true,
      };
    }

    if (await fileExists(MCP_CONFIG_PATH)) {
      await createBackup(MCP_CONFIG_PATH);
    }

    await writeJSON(MCP_CONFIG_PATH, config);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true }),
      }],
    };
  });

  mcpServer.registerTool("add_mcp_server", {
    description: "Add or update an MCP server in the global config",
    inputSchema: z.object({
      name: z.string().describe("Server name"),
      baseUrl: z.string().describe("Server base URL"),
      headers: z.record(z.string(), z.string()).optional().describe("Optional HTTP headers"),
    }),
  }, async ({ name, baseUrl, headers }) => {
    let config: { mcpServers?: Record<string, { baseUrl: string; headers?: Record<string, string> }> } = { mcpServers: {} };

    if (await fileExists(MCP_CONFIG_PATH)) {
      config = await readJSON(MCP_CONFIG_PATH);
      await createBackup(MCP_CONFIG_PATH);
    }

    config.mcpServers = config.mcpServers || {};
    config.mcpServers[name] = { baseUrl, headers };

    await writeJSON(MCP_CONFIG_PATH, config);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true }),
      }],
    };
  });

  mcpServer.registerTool("delete_mcp_server", {
    description: "Delete an MCP server from the global config",
    inputSchema: z.object({
      name: z.string().describe("Server name to delete"),
    }),
  }, async ({ name }) => {
    if (!(await fileExists(MCP_CONFIG_PATH))) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: "MCP config not found" }),
        }],
        isError: true,
      };
    }

    const config = await readJSON<{ mcpServers?: Record<string, unknown> }>(MCP_CONFIG_PATH);
    await createBackup(MCP_CONFIG_PATH);

    delete config.mcpServers?.[name];

    await writeJSON(MCP_CONFIG_PATH, config);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true }),
      }],
    };
  });

  // ============================================================
  // CLICKS TOOLS
  // ============================================================

  mcpServer.registerTool("list_clicks", {
    description: "List all clicks from all sessions with their status",
  }, async () => {
    const clicks = await discoverAllClicks();
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(clicks, null, 2),
      }],
    };
  });

  mcpServer.registerTool("toggle_click", {
    description: "Enable or disable a click",
    inputSchema: z.object({
      session: z.string().describe("Session name"),
      clickId: z.string().describe("Click ID"),
    }),
  }, async ({ session, clickId }) => {
    const sessionPath = getSessionPath(session);
    const clicksPath = path.join(sessionPath, "clicks.json");

    if (!(await fileExists(clicksPath))) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: "Clicks file not found" }),
        }],
        isError: true,
      };
    }

    const clicksFile = await readJSON<{ clicks: Array<{ id: string; enabled?: boolean }> }>(clicksPath);
    await createBackup(clicksPath);

    const click = clicksFile.clicks.find((c) => c.id === clickId);
    if (!click) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ error: "Click not found" }),
        }],
        isError: true,
      };
    }

    click.enabled = click.enabled === false ? true : false;
    await writeJSON(clicksPath, clicksFile);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ success: true, enabled: click.enabled }),
      }],
    };
  });

  // ============================================================
  // GRIPS TOOLS
  // ============================================================

  mcpServer.registerTool("list_grips", {
    description: "List all active grips",
  }, async () => {
    const grips = await discoverActiveGrips();
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(grips, null, 2),
      }],
    };
  });

  return mcpServer;
}

/**
 * Handle MCP HTTP requests (for Express integration)
 */
export async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  const server = createMcpServer();

  // Get or create session ID from header
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  let transport: StreamableHTTPServerTransport;

  if (sessionId && activeTransports.has(sessionId)) {
    // Reuse existing transport for this session
    transport = activeTransports.get(sessionId)!;
  } else {
    // Create new transport
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        activeTransports.set(id, transport);
        console.log(`[MCP] Session initialized: ${id}`);
      },
      onsessionclosed: (id) => {
        activeTransports.delete(id);
        console.log(`[MCP] Session closed: ${id}`);
      },
    });

    // Connect to MCP server
    await server.connect(transport);
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
}

/**
 * Close all active MCP sessions
 */
export async function closeMcpServer(): Promise<void> {
  for (const transport of activeTransports.values()) {
    await transport.close();
  }
  activeTransports.clear();

  if (mcpServer) {
    await mcpServer.close();
    mcpServer = null;
  }
}
