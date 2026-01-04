// Session management for WhatsApp Web using Baileys
// Handles socket creation, auth state persistence, and connection management

import { randomUUID } from "node:crypto";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
  type ConnectionState,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";

import { isVerbose, logVerbose, info } from "../globals.js";
import { defaultRuntime, type RuntimeEnv } from "../runtime.js";
import type { Provider } from "../utils.js";
import { CONFIG_DIR } from "../utils.js";
import { getChildLogger } from "../logging.js";

export const WA_WEB_AUTH_DIR = path.join(CONFIG_DIR, "credentials");

const sessionLogger = getChildLogger({ module: "baileys-session" });

// Use pino logger for Baileys (it expects pino-compatible logger)
const baileysLogger = pino({ level: isVerbose() ? "debug" : "silent" });

/**
 * Create a Baileys WhatsApp socket with auth state persistence.
 * @param printQR - Whether to print QR code to terminal for authentication
 * @param verbose - Enable verbose logging
 */
export async function createWaSocket(
  printQR: boolean,
  verbose: boolean,
): Promise<WASocket> {
  await fs.mkdir(WA_WEB_AUTH_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(WA_WEB_AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  if (verbose) {
    logVerbose(`Using Baileys v${version.join(".")}, latest: ${isLatest}`);
  }

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
    },
    logger: baileysLogger,
    printQRInTerminal: false,
    browser: ["klaus", "cli", "1.0.0"],
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  // Save credentials on update
  sock.ev.on("creds.update", saveCreds);

  // Handle WebSocket-level errors to prevent unhandled exceptions from crashing the process
  if (
    sock.ws &&
    typeof (sock.ws as unknown as { on?: unknown }).on === "function"
  ) {
    (sock.ws as unknown as { on: (event: string, cb: (err: Error) => void) => void }).on("error", (err: Error) => {
      sessionLogger.error({ error: String(err) }, "WebSocket error");
    });
  }

  // Handle connection updates for verbose logging
  sock.ev.on("connection.update", (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update;

    // Always log connection updates when verbose
    if (verbose) {
      const errInfo = lastDisconnect?.error
        ? JSON.stringify(lastDisconnect.error, Object.getOwnPropertyNames(lastDisconnect.error))
        : 'none';
      console.log(`[ws] connection=${connection ?? 'undefined'}, hasQR=${!!qr}, error=${errInfo}`);
    }

    if (qr && printQR) {
      // Manually print QR code since printQRInTerminal is deprecated
      console.log("\n📱 Scan this QR code with WhatsApp:\n");
      qrcode.generate(qr, { small: true });
      console.log("");
    }

    if (connection === "close") {
      const statusCode = getStatusCode(lastDisconnect?.error);
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      const errDetails = lastDisconnect?.error
        ? JSON.stringify(lastDisconnect.error, Object.getOwnPropertyNames(lastDisconnect.error))
        : 'unknown';
      console.log(`Connection closed: status=${statusCode}, shouldReconnect=${shouldReconnect}, details=${errDetails}`);
      sessionLogger.info(
        { statusCode, shouldReconnect },
        "Connection closed",
      );
    } else if (connection === "open") {
      console.log("Connection opened successfully!");
      sessionLogger.info("Connection opened successfully");
    }
  });

  return sock;
}

/**
 * Wait for the WhatsApp connection to open.
 * Returns a promise that resolves when connected or rejects on failure.
 */
export function waitForWaConnection(sock: WASocket): Promise<void> {
  return new Promise((resolve, reject) => {
    type OffCapable = {
      off?: (event: string, listener: (...args: unknown[]) => void) => void;
    };
    const evWithOff = sock.ev as unknown as OffCapable;

    const handler = (...args: unknown[]) => {
      const update = (args[0] ?? {}) as Partial<ConnectionState>;
      if (update.connection === "open") {
        evWithOff.off?.("connection.update", handler);
        resolve();
      }
      if (update.connection === "close") {
        evWithOff.off?.("connection.update", handler);
        reject(update.lastDisconnect ?? new Error("Connection closed"));
      }
    };

    sock.ev.on("connection.update", handler);
  });
}

/**
 * Check if WhatsApp Web credentials exist.
 */
export async function webAuthExists(): Promise<boolean> {
  try {
    const credsPath = path.join(WA_WEB_AUTH_DIR, "creds.json");
    await fs.access(credsPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Log out from WhatsApp Web by clearing stored credentials.
 */
export async function logoutWeb(): Promise<void> {
  try {
    await fs.rm(WA_WEB_AUTH_DIR, { recursive: true, force: true });
  } catch {
    // Directory might not exist
  }
}

/**
 * Read the cached user JID and phone number from credentials.
 */
export function readWebSelfId(): { jid: string; e164: string } | null {
  try {
    const credsPath = path.join(WA_WEB_AUTH_DIR, "creds.json");
    const data = fsSync.readFileSync(credsPath, "utf8");
    const creds = JSON.parse(data);
    const jid = creds.me?.id;
    if (!jid) return null;

    // Extract phone number from JID
    const match = jid.match(/^(\d+)/);
    const e164 = match ? `+${match[1]}` : jid;

    return { jid, e164 };
  } catch {
    return null;
  }
}

/**
 * Extract status code from error objects.
 */
export function getStatusCode(err: unknown): number | undefined {
  return (
    (err as { output?: { statusCode?: number } })?.output?.statusCode ??
    (err as { status?: number })?.status
  );
}

/**
 * Format error for display.
 */
export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  const status = getStatusCode(err);
  const code = (err as { code?: unknown })?.code;
  if (status || code)
    return `status=${status ?? "unknown"} code=${code ?? "unknown"}`;
  return String(err);
}

/**
 * Return the age (in milliseconds) of the credentials file, or null when missing.
 */
export function getWebAuthAgeMs(): number | null {
  try {
    const credsPath = path.join(WA_WEB_AUTH_DIR, "creds.json");
    const stats = fsSync.statSync(credsPath);
    return Date.now() - stats.mtimeMs;
  } catch {
    return null;
  }
}

/**
 * Generate a new connection ID for correlation.
 */
export function newConnectionId(): string {
  return randomUUID();
}

/**
 * Log the current WhatsApp Web session identity.
 */
export function logWebSelfId(
  runtime: RuntimeEnv = defaultRuntime,
  includeProviderPrefix = false,
): void {
  const selfId = readWebSelfId();
  const prefix = includeProviderPrefix ? "Web Provider: " : "";
  if (selfId) {
    runtime.log(info(`${prefix}${selfId.e164}`));
  } else {
    runtime.log(info(`${prefix}Not logged in`));
  }
}

/**
 * Pick the provider based on preference and auth state.
 */
export async function pickProvider(
  pref: Provider | "auto",
): Promise<Provider> {
  // Only "web" provider is supported
  if (pref !== "auto") return pref;
  return "web";
}
