/**
 * Admin console Express server
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import ejs from "ejs";
import type { AdminConfig, DashboardData } from "./types.js";
import { discoverSessions, discoverAllClicks, discoverActiveGrips } from "./services/discovery.js";
import { signalReload } from "./services/process-signal.js";
import { readJSON, fileExists } from "./services/file-ops.js";
import routes from "./routes/index.js";
import { handleMcpRequest, closeMcpServer } from "./mcp-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Render a page with the layout wrapper
 */
async function renderPage(
  res: Response,
  page: string,
  data: Record<string, unknown>,
): Promise<void> {
  const viewsDir = path.join(__dirname, "views");

  // Render the page content first
  const pageContent = await ejs.renderFile(
    path.join(viewsDir, "pages", `${page}.ejs`),
    { ...res.locals, ...data },
  );

  // Then render the layout with the page content as body
  res.render("layout", {
    ...data,
    body: pageContent,
  });
}

export function createAdminApp(config: AdminConfig): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Set up EJS
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  // Static files
  app.use("/admin/static", express.static(path.join(__dirname, "public")));

  // Helper to format time
  app.locals.formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Middleware to inject sessions into all views
  app.use("/admin", async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.locals.sessions = await discoverSessions();
      res.locals.currentPath = req.path === "/" ? "/admin" : `/admin${req.path}`;
      res.locals.readOnly = config.readOnly;
    } catch {
      res.locals.sessions = [];
    }
    next();
  });

  // Dashboard
  app.get("/admin", async (_req: Request, res: Response) => {
    try {
      const data: DashboardData = await getDashboardData();
      await renderPage(res, "dashboard", {
        title: "Dashboard",
        showReload: true,
        data,
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      res.status(500).send("Error loading dashboard");
    }
  });

  // Status endpoint for htmx polling
  app.get("/admin/status", async (_req: Request, res: Response) => {
    const data: DashboardData = await getDashboardData();
    res.render("partials/status-cards", { data });
  });

  // Health check
  app.get("/admin/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Reload config signal
  app.post("/admin/reload", async (_req: Request, res: Response) => {
    if (config.readOnly) {
      res.status(403).json({ error: "Read-only mode" });
      return;
    }
    try {
      await signalReload();
      res.json({ status: "ok", message: "Config reload signal sent" });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // MCP Server endpoint - handles GET (SSE), POST (messages), DELETE (close session)
  // This exposes all admin operations as MCP tools for programmatic access
  app.all("/admin/mcp", async (req: Request, res: Response) => {
    if (config.readOnly && req.method !== "GET") {
      res.status(403).json({ error: "Read-only mode" });
      return;
    }
    try {
      await handleMcpRequest(req, res);
    } catch (err) {
      console.error("[MCP] Request error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: String(err) });
      }
    }
  });

  // Mount route modules
  app.use("/admin", routes);

  // 404 handler for admin routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/admin")) {
      res.status(404).render("layout", {
        title: "Not Found",
        body: '<div class="card"><p>Page not found</p></div>',
      });
    } else {
      next();
    }
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Admin error:", err);
    res.status(500).render("layout", {
      title: "Error",
      error: err.message,
      body: '<div class="card"><p>An error occurred</p></div>',
    });
  });

  return app;
}

async function getDashboardData(): Promise<DashboardData> {
  const sessions = await discoverSessions();
  const clicks = await discoverAllClicks();
  const grips = await discoverActiveGrips();

  // Count MCP servers from source config
  let mcpCount = 0;
  const mcpConfigPath = path.join(process.cwd(), "config", "mcporter.json");
  try {
    if (await fileExists(mcpConfigPath)) {
      const mcpConfig = await readJSON<{ mcpServers?: Record<string, unknown> }>(mcpConfigPath);
      mcpCount = Object.keys(mcpConfig.mcpServers || {}).length;
    }
  } catch {
    // Ignore errors reading MCP config
  }

  // Count enabled clicks
  const clicksEnabled = clicks.filter((c) => c.enabled).length;

  // Get recent activity from clicks state
  const recentActivity: DashboardData["recentActivity"] = [];

  // Add recent click activity
  for (const click of clicks.slice(0, 5)) {
    if (click.lastRun) {
      recentActivity.push({
        type: "click",
        message: `${click.name} (${click.session})`,
        time: click.lastRun,
        status: click.lastResult === "OK" ? "ok" : click.lastResult === "ALERT" ? "alert" : "error",
      });
    }
  }

  // Add active grips
  for (const grip of grips) {
    recentActivity.push({
      type: "grip",
      message: `${grip.id} - ${grip.status}`,
      time: new Date(grip.started).getTime() || Date.now(),
      status: grip.status === "active" ? "ok" : grip.status === "completed" ? "ok" : "error",
    });
  }

  // Sort by time, most recent first
  recentActivity.sort((a, b) => b.time - a.time);

  return {
    mcpCount,
    mcpOnline: 0, // TODO: Track live connection status
    clicksCount: clicks.length,
    clicksEnabled,
    gripsActive: grips.filter((g) => g.status === "active").length,
    gripsTotal: grips.length,
    sessionsCount: sessions.length,
    recentActivity: recentActivity.slice(0, 10),
  };
}

export async function startAdminServer(
  port: number,
  host = "127.0.0.1",
  readOnly = false,
): Promise<void> {
  const config: AdminConfig = { port, host, readOnly };
  const app = createAdminApp(config);

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host);

    server.once("listening", () => {
      console.log(`\n  Admin console: http://${host}:${port}/admin\n`);
      resolve();
    });

    server.once("error", (err) => {
      console.error(`Failed to start admin server: ${err.message}`);
      reject(err);
    });
  });
}
