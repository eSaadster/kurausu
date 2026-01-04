#!/usr/bin/env node
import process from "node:process";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { getReplyFromConfig } from "./auto-reply/reply.js";
import { applyTemplate } from "./auto-reply/templating.js";
import { createDefaultDeps } from "./cli/deps.js";
import { promptYesNo } from "./cli/prompt.js";
import { waitForever } from "./cli/wait.js";
import { loadConfig } from "./config/config.js";
import {
  deriveSessionKey,
  loadSessionStore,
  resolveStorePath,
  saveSessionStore,
} from "./config/sessions.js";
import { readEnv, ensureEnv } from "./env.js";
import { ensureBinary } from "./infra/binaries.js";
import {
  describePortOwner,
  ensurePortAvailable,
  handlePortError,
  PortInUseError,
} from "./infra/ports.js";
import { runCommandWithTimeout, runExec } from "./process/exec.js";
import { monitorWebProvider, sendMessageWeb } from "./provider-web.js";
import { normalizeE164, toWhatsappJid } from "./utils.js";
import { loginWeb } from "./web/login.js";
import {
  createWaSocket,
  waitForWaConnection,
  webAuthExists,
  logoutWeb,
  readWebSelfId,
  logWebSelfId,
  pickProvider,
} from "./web/session.js";

dotenv.config({ quiet: true });

import { buildProgram } from "./cli/program.js";

const program = buildProgram();

export {
  applyTemplate,
  createDefaultDeps,
  createWaSocket,
  deriveSessionKey,
  describePortOwner,
  ensureBinary,
  ensureEnv,
  ensurePortAvailable,
  getReplyFromConfig,
  handlePortError,
  loadConfig,
  loadSessionStore,
  loginWeb,
  logoutWeb,
  logWebSelfId,
  monitorWebProvider,
  normalizeE164,
  pickProvider,
  PortInUseError,
  promptYesNo,
  readEnv,
  readWebSelfId,
  resolveStorePath,
  runCommandWithTimeout,
  runExec,
  saveSessionStore,
  sendMessageWeb,
  toWhatsappJid,
  waitForever,
  waitForWaConnection,
  webAuthExists,
  program,
};

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  // Global error handlers to prevent silent crashes from unhandled rejections/exceptions.
  // These log the error and exit gracefully instead of crashing without trace.
  process.on("unhandledRejection", (reason, _promise) => {
    console.error(
      "[klaus] Unhandled promise rejection:",
      reason instanceof Error ? (reason.stack ?? reason.message) : reason,
    );
    process.exit(1);
  });

  process.on("uncaughtException", (error) => {
    console.error(
      "[klaus] Uncaught exception:",
      error.stack ?? error.message,
    );
    process.exit(1);
  });

  program.parseAsync(process.argv);
}
