// Environment configuration for Warelay
// Minimal configuration - Baileys stores auth in ~/.warelay/credentials

import { defaultRuntime, type RuntimeEnv } from "./runtime.js";

export type EnvConfig = {
  // No external service configuration needed for Baileys
  // Auth state is managed locally in ~/.warelay/credentials
};

export function readEnv(runtime: RuntimeEnv = defaultRuntime): EnvConfig {
  // No external environment variables required for Baileys
  // All configuration is done via ~/.warelay/warelay.json
  return {};
}

export function ensureEnv(runtime: RuntimeEnv = defaultRuntime): void {
  // No external dependencies to verify
  // Baileys will connect directly to WhatsApp
  readEnv(runtime);
}
