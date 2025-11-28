import type { CliDeps } from "../cli/deps.js";
import type { RuntimeEnv } from "../runtime.js";

export async function sendCommand(
  opts: {
    to: string;
    message: string;
    wait?: string;
    poll?: string;
    json?: boolean;
    dryRun?: boolean;
    media?: string;
  },
  deps: CliDeps,
  runtime: RuntimeEnv,
) {
  if (opts.dryRun) {
    runtime.log(
      `[dry-run] would send via WhatsApp Web -> ${opts.to}: ${opts.message}${opts.media ? ` (media ${opts.media})` : ""}`,
    );
    return;
  }

  const res = await deps
    .sendMessageWeb(opts.to, opts.message, {
      verbose: false,
      mediaUrl: opts.media,
    })
    .catch((err) => {
      runtime.error(`❌ Send failed: ${String(err)}`);
      throw err;
    });

  if (opts.json) {
    runtime.log(
      JSON.stringify(
        {
          provider: "web",
          to: opts.to,
          messageId: res.messageId,
          mediaPath: opts.media ?? null,
        },
        null,
        2,
      ),
    );
  }
}
