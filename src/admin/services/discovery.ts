/**
 * Session and resource discovery service
 */

import path from "node:path";
import type { SessionInfo, ClickStatus, GripStatus } from "../types.js";
import { expandPath, listDirectories, fileExists } from "./file-ops.js";

// Default paths
const WHATSAPP_BASE_PATH = "~/klaus/whatsapp";
const GRIPS_ACTIVE_PATH = "~/klaus/grips/active";
const GRIPS_TEMPLATES_PATH = "~/klaus/grips/templates";

/**
 * Discover all WhatsApp sessions
 */
export async function discoverSessions(): Promise<SessionInfo[]> {
  const basePath = expandPath(WHATSAPP_BASE_PATH);
  const dirs = await listDirectories(basePath);

  const sessions: SessionInfo[] = [];

  for (const name of dirs) {
    // Sessions start with @ (DM) or # (group)
    if (!name.startsWith("@") && !name.startsWith("#")) continue;

    const sessionPath = path.join(basePath, name);

    sessions.push({
      name,
      type: name.startsWith("@") ? "dm" : "group",
      path: sessionPath,
      hasEnv: await fileExists(path.join(sessionPath, ".env")),
      hasSystem: await fileExists(path.join(sessionPath, "SYSTEM.md")),
      hasMcporter: await fileExists(path.join(sessionPath, "mcporter.json")),
      hasClicks: await fileExists(path.join(sessionPath, "clicks.json")),
    });
  }

  // Sort: DMs first, then groups, alphabetically within each
  sessions.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dm" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return sessions;
}

/**
 * Get session base path
 */
export function getSessionPath(sessionName: string): string {
  return path.join(expandPath(WHATSAPP_BASE_PATH), sessionName);
}

/**
 * Get the WhatsApp base path
 */
export function getWhatsAppBasePath(): string {
  return expandPath(WHATSAPP_BASE_PATH);
}

/**
 * Get grips paths
 */
export function getGripsPaths(): { active: string; templates: string } {
  return {
    active: expandPath(GRIPS_ACTIVE_PATH),
    templates: expandPath(GRIPS_TEMPLATES_PATH),
  };
}

/**
 * Discover all clicks across all sessions
 */
export async function discoverAllClicks(): Promise<ClickStatus[]> {
  const sessions = await discoverSessions();
  const allClicks: ClickStatus[] = [];

  for (const session of sessions) {
    if (!session.hasClicks) continue;

    try {
      const clicksPath = path.join(session.path, "clicks.json");
      const { readJSON } = await import("./file-ops.js");
      const clicksFile = await readJSON<{ clicks?: Array<{ id: string; name: string; intervalMinutes: number; enabled?: boolean }> }>(clicksPath);

      if (clicksFile.clicks) {
        for (const click of clicksFile.clicks) {
          allClicks.push({
            id: click.id,
            session: session.name,
            name: click.name,
            enabled: click.enabled !== false,
            intervalMinutes: click.intervalMinutes,
          });
        }
      }
    } catch {
      // Ignore errors reading individual click files
    }
  }

  return allClicks;
}

/**
 * Discover active grips
 */
export async function discoverActiveGrips(): Promise<GripStatus[]> {
  const { active: activePath } = getGripsPaths();
  const dirs = await listDirectories(activePath);
  const grips: GripStatus[] = [];

  for (const dir of dirs) {
    try {
      const gripPath = path.join(activePath, dir, "grip.yaml");
      const { readText } = await import("./file-ops.js");
      const content = await readText(gripPath);

      // Simple YAML parsing for key fields
      const getId = (key: string) => {
        const match = content.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
        return match?.[1]?.trim().replace(/^["']|["']$/g, "") || "";
      };

      grips.push({
        id: getId("id") || dir,
        templateId: getId("templateId"),
        session: getId("session"),
        status: getId("status") as GripStatus["status"] || "unknown",
        started: getId("started"),
        attempts: parseInt(getId("attempts") || "0", 10),
        tmuxSession: getId("tmuxSession"),
      });
    } catch {
      // Ignore errors reading individual grip files
    }
  }

  return grips;
}
