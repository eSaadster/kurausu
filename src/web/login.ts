// WhatsApp Web login via QR code or pairing code using Baileys
// Handles the authentication flow

import fs from "node:fs/promises";

import { DisconnectReason } from "@whiskeysockets/baileys";

import { danger, info, success } from "../globals.js";
import { logInfo } from "../logger.js";
import { defaultRuntime, type RuntimeEnv } from "../runtime.js";
import {
  createWaSocket,
  formatError,
  WA_WEB_AUTH_DIR,
  waitForWaConnection,
} from "./session.js";

/**
 * Login to WhatsApp Web via QR code or pairing code.
 * @param verbose - Enable verbose logging
 * @param phoneNumber - If provided, use pairing code instead of QR
 * @param waitForConnection - Dependency injection for testing
 * @param runtime - Runtime environment for logging
 */
export async function loginWeb(
  verbose: boolean,
  phoneNumber?: string,
  waitForConnection: typeof waitForWaConnection = waitForWaConnection,
  runtime: RuntimeEnv = defaultRuntime,
): Promise<void> {
  const usePairingCode = Boolean(phoneNumber);
  const sock = await createWaSocket(!usePairingCode, verbose);

  if (usePairingCode && phoneNumber) {
    // Wait for socket to be ready before requesting pairing code
    console.log(info("Waiting for WebSocket connection..."));

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for connection to be ready"));
      }, 30000);

      sock.ev.on("connection.update", (update) => {
        if (update.connection === "connecting") {
          console.log(info("WebSocket connecting..."));
        } else if (update.connection === "close") {
          clearTimeout(timeout);
          reject(new Error("Connection closed while waiting"));
        }
      });

      // Give it a moment to establish the WebSocket
      setTimeout(() => {
        clearTimeout(timeout);
        resolve();
      }, 3000);
    });

    // Request pairing code
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
    console.log(info(`Requesting pairing code for ${cleanNumber}...`));

    try {
      const code = await sock.requestPairingCode(cleanNumber);
      console.log(success(`\n📱 Pairing code: ${code}\n`));
      console.log(info("Enter this code on your phone:"));
      console.log(info("WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number\n"));
    } catch (err) {
      console.error(danger(`Failed to request pairing code: ${String(err)}`));
      throw err;
    }
  }

  logInfo("Waiting for WhatsApp connection...", runtime);

  try {
    await waitForConnection(sock);
    console.log(success("✅ Linked! Waiting for sync to complete..."));

    // Wait for Baileys to sync and save all credentials
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(success("✅ Credentials saved for future sends."));
  } catch (err) {
    const code =
      (err as { error?: { output?: { statusCode?: number } } })?.error?.output
        ?.statusCode ??
      (err as { output?: { statusCode?: number } })?.output?.statusCode;

    // Handle restart request after pairing (code 515)
    if (code === 515) {
      console.log(
        info(
          "WhatsApp asked for a restart after pairing (code 515); creds are saved. Restarting connection once…",
        ),
      );

      try {
        sock.ws?.close();
      } catch {
        // ignore close errors
      }

      const retry = await createWaSocket(false, verbose);
      try {
        await waitForConnection(retry);
        console.log(
          success(
            "✅ Linked after restart; web session ready. You can now send with provider=web.",
          ),
        );
        return;
      } finally {
        setTimeout(() => retry.ws?.close(), 500);
      }
    }

    // Handle logged out session
    if (code === DisconnectReason.loggedOut) {
      await fs.rm(WA_WEB_AUTH_DIR, { recursive: true, force: true });
      console.error(
        danger(
          "WhatsApp reported the session is logged out. Cleared cached web session; please rerun klaus login and scan the QR again.",
        ),
      );
      throw new Error("Session logged out; cache cleared. Re-run login.");
    }

    // Handle other errors
    const formatted = formatError(err);
    console.error(
      danger(
        `WhatsApp Web connection ended before fully opening. ${formatted}`,
      ),
    );
    throw new Error(formatted);
  } finally {
    // Let Baileys flush any final events before closing
    setTimeout(() => {
      try {
        sock.ws?.close();
      } catch {
        // ignore close errors
      }
    }, 2000);
  }
}
