import type { CliDeps } from "../cli/deps.js";
import type { RuntimeEnv } from "../runtime.js";
import { readWebSelfId, webAuthExists, getWebAuthAgeMs } from "../web/session.js";

export async function statusCommand(
  opts: { limit: string; json?: boolean },
  deps: CliDeps,
  runtime: RuntimeEnv,
) {
  const hasAuth = await webAuthExists();
  const selfId = readWebSelfId();
  const authAgeMs = getWebAuthAgeMs();

  const status = {
    authenticated: hasAuth,
    account: selfId?.e164 ?? null,
    jid: selfId?.jid ?? null,
    credentialsAgeMs: authAgeMs,
    credentialsAgeHuman: authAgeMs
      ? formatDuration(authAgeMs)
      : null,
  };

  if (opts.json) {
    runtime.log(JSON.stringify(status, null, 2));
    return;
  }

  if (!hasAuth) {
    runtime.log("Not authenticated. Run 'klaus login' to link your WhatsApp account.");
    return;
  }

  runtime.log(`WhatsApp Web Status:`);
  runtime.log(`  Account: ${status.account ?? "Unknown"}`);
  runtime.log(`  JID: ${status.jid ?? "Unknown"}`);
  runtime.log(`  Credentials Age: ${status.credentialsAgeHuman ?? "Unknown"}`);
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
