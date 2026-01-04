/**
 * Clicks control routes
 */

import { Router, type Request, type Response } from "express";
import path from "node:path";
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import { readJSON, writeJSON, fileExists, expandPath } from "../services/file-ops.js";
import { discoverSessions, getSessionPath } from "../services/discovery.js";
import { createBackup } from "../services/backup.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

interface ClickConfig {
  id: string;
  name: string;
  instructions: string;
  intervalMinutes: number;
  alertCriteria?: string;
  enabled?: boolean;
  model?: string;
  useSessionMemory?: boolean;
  useClickMemory?: boolean;
}

interface ClicksFile {
  clicks: ClickConfig[];
  alertChannel?: string;
  alertTarget?: string;
  sharedContext?: string;
}

interface ClickState {
  clickId: string;
  lastRunTime: number;
  lastResult?: "OK" | "ALERT" | "ERROR";
  lastSummary?: string;
  consecutiveFailures: number;
  runCount: number;
}

// In-memory scheduler status
let schedulerRunning = false;

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

// Get all clicks state
async function getClicksState(): Promise<Record<string, ClickState>> {
  const statePath = expandPath("~/.klaus/scratchpad/clicks/.state.json");
  try {
    if (await fileExists(statePath)) {
      return await readJSON<Record<string, ClickState>>(statePath);
    }
  } catch {
    // Ignore
  }
  return {};
}

// Clicks dashboard
router.get("/", async (req: Request, res: Response) => {
  try {
    const sessions = await discoverSessions();
    const clicksState = await getClicksState();

    // Collect all clicks from all sessions
    const allClicks: Array<{
      session: string;
      click: ClickConfig;
      state?: ClickState;
    }> = [];

    for (const session of sessions) {
      if (!session.hasClicks) continue;

      try {
        const clicksPath = path.join(session.path, "clicks.json");
        const clicksFile = await readJSON<ClicksFile>(clicksPath);

        for (const click of clicksFile.clicks || []) {
          const stateKey = `${session.name}:${click.id}`;
          allClicks.push({
            session: session.name,
            click,
            state: clicksState[stateKey],
          });
        }
      } catch {
        // Ignore errors reading individual click files
      }
    }

    await renderPage(res, "clicks", {
      title: "Clicks Scheduler",
      allClicks,
      schedulerRunning,
    });
  } catch (err) {
    console.error("Clicks page error:", err);
    res.status(500).send("Error loading clicks");
  }
});

// Get scheduler status
router.get("/status", async (_req: Request, res: Response) => {
  const state = await getClicksState();
  res.json({
    running: schedulerRunning,
    clicks: Object.values(state),
  });
});

// Toggle click enabled/disabled
router.post("/:session/:id/toggle", async (req: Request, res: Response) => {
  if (res.locals.readOnly) {
    res.status(403).json({ error: "Read-only mode" });
    return;
  }

  try {
    const { session, id } = req.params;
    const sessionPath = getSessionPath(session);
    const clicksPath = path.join(sessionPath, "clicks.json");

    if (!(await fileExists(clicksPath))) {
      res.status(404).json({ error: "Clicks file not found" });
      return;
    }

    const clicksFile = await readJSON<ClicksFile>(clicksPath);
    await createBackup(clicksPath);

    const click = clicksFile.clicks.find((c) => c.id === id);
    if (!click) {
      res.status(404).json({ error: "Click not found" });
      return;
    }

    click.enabled = click.enabled === false ? true : false;
    await writeJSON(clicksPath, clicksFile);

    res.json({ success: true, enabled: click.enabled });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Manually trigger click
router.post("/:session/:id/trigger", async (req: Request, res: Response) => {
  const { session, id } = req.params;

  // TODO: Implement actual click triggering via ClickScheduler
  // For now, just return success
  res.json({
    success: true,
    message: `Click ${id} in session ${session} triggered`,
  });
});

// Start scheduler
router.post("/scheduler/start", async (_req: Request, res: Response) => {
  // TODO: Implement actual scheduler start
  schedulerRunning = true;
  res.json({ success: true, message: "Scheduler started" });
});

// Stop scheduler
router.post("/scheduler/stop", async (_req: Request, res: Response) => {
  // TODO: Implement actual scheduler stop
  schedulerRunning = false;
  res.json({ success: true, message: "Scheduler stopped" });
});

export default router;
