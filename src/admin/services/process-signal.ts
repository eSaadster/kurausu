/**
 * Process signaling service
 *
 * Signals the main klaus process to reload configuration.
 * Uses a file-based signal that the main process watches.
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const SIGNAL_FILE = path.join(os.homedir(), ".klaus", ".reload");

/**
 * Signal the main process to reload configuration
 */
export async function signalReload(): Promise<void> {
  const dir = path.dirname(SIGNAL_FILE);
  await fs.mkdir(dir, { recursive: true });

  // Touch the signal file
  const now = new Date().toISOString();
  await fs.writeFile(SIGNAL_FILE, now, "utf-8");
}

/**
 * Check if a reload signal is pending
 */
export async function checkReloadSignal(): Promise<boolean> {
  try {
    await fs.access(SIGNAL_FILE);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear the reload signal after processing
 */
export async function clearReloadSignal(): Promise<void> {
  try {
    await fs.rm(SIGNAL_FILE);
  } catch {
    // Ignore if file doesn't exist
  }
}

/**
 * Watch for reload signals
 * Returns a cleanup function
 */
export function watchReloadSignal(callback: () => void): () => void {
  const dir = path.dirname(SIGNAL_FILE);

  let abortController: AbortController | null = new AbortController();

  // Start watching
  (async () => {
    try {
      await fs.mkdir(dir, { recursive: true });
      const watcher = fs.watch(dir, { signal: abortController?.signal });

      for await (const event of watcher) {
        if (event.filename === ".reload") {
          callback();
          await clearReloadSignal();
        }
      }
    } catch {
      // Watch failed or aborted, ignore
    }
  })();

  // Return cleanup function
  return () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  };
}
