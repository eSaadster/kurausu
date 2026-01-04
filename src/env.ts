// Environment configuration for Klaus
// Minimal configuration - Baileys stores auth in ~/.klaus/credentials

import path from "node:path";
import os from "node:os";
import { existsSync } from "node:fs";
import dotenv from "dotenv";

import { defaultRuntime, type RuntimeEnv } from "./runtime.js";

export type EnvConfig = {
  // No external service configuration needed for Baileys
  // Auth state is managed locally in ~/.klaus/credentials
};

export function readEnv(runtime: RuntimeEnv = defaultRuntime): EnvConfig {
  // No external environment variables required for Baileys
  // All configuration is done via ~/.klaus/klaus.json
  return {};
}

export function ensureEnv(runtime: RuntimeEnv = defaultRuntime): void {
  // No external dependencies to verify
  // Baileys will connect directly to WhatsApp
  readEnv(runtime);
}

/**
 * Load session-specific .env for a given session.
 * Path: ~/klaus/whatsapp/{sessionName}/.env
 */
export function loadSessionEnv(sessionName: string): void {
  const sessionEnvPath = path.join(
    os.homedir(),
    "klaus",
    "whatsapp",
    sessionName,
    ".env",
  );
  if (existsSync(sessionEnvPath)) {
    dotenv.config({ path: sessionEnvPath, override: true });
  }
}
