// CLI Dependencies - for Baileys-based operation

import { info } from "../globals.js";
import { ensureBinary } from "../infra/binaries.js";
import { ensurePortAvailable, handlePortError } from "../infra/ports.js";
import {
  logWebSelfId,
  monitorWebProvider,
  sendMessageWeb,
} from "../providers/web/index.js";
import { defaultRuntime, type RuntimeEnv } from "../runtime.js";
import { waitForever } from "./wait.js";
import { readWebSelfId } from "../web/session.js";

export type CliDeps = {
  sendMessageWeb: typeof sendMessageWeb;
  ensurePortAvailable: typeof ensurePortAvailable;
  waitForever: typeof waitForever;
  ensureBinary: typeof ensureBinary;
  handlePortError: typeof handlePortError;
  monitorWebProvider: typeof monitorWebProvider;
};

export function createDefaultDeps(): CliDeps {
  // Default dependency bundle used by CLI commands and tests.
  return {
    sendMessageWeb,
    ensurePortAvailable,
    waitForever,
    ensureBinary,
    handlePortError,
    monitorWebProvider,
  };
}

export function logProviderInfo(runtime: RuntimeEnv = defaultRuntime) {
  // Log the WhatsApp Web session info for clarity in CLI output.
  const selfId = readWebSelfId();
  if (selfId) {
    runtime.log(info(`Provider: WhatsApp Web | ${selfId.e164}`));
  } else {
    runtime.log(info("Provider: WhatsApp Web | Not logged in"));
  }
}

export { logWebSelfId };
