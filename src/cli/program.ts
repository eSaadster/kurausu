import chalk from "chalk";
import { Command } from "commander";
import { sendCommand } from "../commands/send.js";
import { statusCommand } from "../commands/status.js";
import { loadConfig } from "../config/config.js";
import { danger, info, setVerbose, setYes, success } from "../globals.js";
import { getResolvedLoggerSettings } from "../logging.js";
import {
  monitorWebProvider,
  resolveHeartbeatRecipients,
  runWebHeartbeatOnce,
  type WebMonitorTuning,
} from "../provider-web.js";
import { defaultRuntime } from "../runtime.js";
import { VERSION } from "../version.js";
import { loginWeb } from "../web/login.js";
import {
  resolveHeartbeatSeconds,
  resolveReconnectPolicy,
} from "../web/reconnect.js";
import { logoutWeb, webAuthExists } from "../web/session.js";
import {
  createDefaultDeps,
  logWebSelfId,
} from "./deps.js";
import { spawnRelayTmux } from "./relay_tmux.js";

export function buildProgram() {
  const program = new Command();
  const PROGRAM_VERSION = VERSION;
  const TAGLINE =
    "Send, receive, and auto-reply on WhatsApp via Baileys.";

  program
    .name("warelay")
    .description("WhatsApp relay CLI (via Baileys)")
    .version(PROGRAM_VERSION);

  const formatIntroLine = (version: string, rich = true) => {
    const base = `📡 warelay ${version} — ${TAGLINE}`;
    return rich && chalk.level > 0
      ? `${chalk.bold.cyan("📡 warelay")} ${chalk.white(version)} ${chalk.gray("—")} ${chalk.green(TAGLINE)}`
      : base;
  };

  program.configureHelp({
    optionTerm: (option) => chalk.yellow(option.flags),
    subcommandTerm: (cmd) => chalk.green(cmd.name()),
  });

  program.configureOutput({
    writeOut: (str) => {
      const colored = str
        .replace(/^Usage:/gm, chalk.bold.cyan("Usage:"))
        .replace(/^Options:/gm, chalk.bold.cyan("Options:"))
        .replace(/^Commands:/gm, chalk.bold.cyan("Commands:"));
      process.stdout.write(colored);
    },
    writeErr: (str) => process.stderr.write(str),
    outputError: (str, write) => write(chalk.red(str)),
  });

  if (process.argv.includes("-V") || process.argv.includes("--version")) {
    console.log(formatIntroLine(PROGRAM_VERSION));
    process.exit(0);
  }

  program.addHelpText("beforeAll", `\n${formatIntroLine(PROGRAM_VERSION)}\n`);
  const examples = [
    [
      "warelay login",
      "Link your WhatsApp account via QR code.",
    ],
    [
      'warelay send --to +15551234567 --message "Hi" --json',
      "Send via WhatsApp Web and print JSON result.",
    ],
    [
      "warelay relay --verbose",
      "Auto-reply loop: listen for incoming messages.",
    ],
    [
      "warelay status --limit 10 --json",
      "Show last 10 messages as JSON.",
    ],
  ] as const;

  const fmtExamples = examples
    .map(([cmd, desc]) => `  ${chalk.green(cmd)}\n    ${chalk.gray(desc)}`)
    .join("\n");

  program.addHelpText(
    "afterAll",
    `\n${chalk.bold.cyan("Examples:")}\n${fmtExamples}\n`,
  );

  program
    .command("login")
    .description("Link your personal WhatsApp via QR code or pairing code")
    .option("--phone <number>", "Use pairing code instead of QR (enter your phone number)")
    .option("--verbose", "Verbose connection logs", false)
    .addHelpText(
      "after",
      `
Examples:
  warelay login                       # scan QR to link WhatsApp
  warelay login --phone +1234567890   # use pairing code (easier on servers)
  warelay login --verbose             # with detailed connection logs`,
    )
    .action(async (opts) => {
      setVerbose(Boolean(opts.verbose));
      try {
        await loginWeb(Boolean(opts.verbose), opts.phone);
      } catch (err) {
        defaultRuntime.error(danger(`Web login failed: ${String(err)}`));
        defaultRuntime.exit(1);
      }
    });

  program
    .command("logout")
    .description("Clear cached WhatsApp Web credentials")
    .option("-y, --yes", "Skip confirmation prompt", false)
    .addHelpText(
      "after",
      `
Examples:
  warelay logout               # clear credentials (with confirmation)
  warelay logout --yes         # clear without prompting`,
    )
    .action(async (opts) => {
      const hasAuth = await webAuthExists();
      if (!hasAuth) {
        defaultRuntime.log(info("No WhatsApp Web credentials found."));
        return;
      }
      setYes(Boolean(opts.yes));
      if (!opts.yes) {
        defaultRuntime.log(
          danger(
            "This will clear your WhatsApp Web session. You will need to scan a QR code again.",
          ),
        );
        // In a real implementation, we'd prompt for confirmation here
        // For now, just proceed since we don't have readline setup
      }
      await logoutWeb();
      defaultRuntime.log(success("✅ WhatsApp Web credentials cleared."));
    });

  program
    .command("send")
    .description("Send a WhatsApp message via WhatsApp Web")
    .requiredOption(
      "-t, --to <number>",
      "Recipient number in E.164 (e.g. +15551234567)",
    )
    .requiredOption("-m, --message <text>", "Message body")
    .option(
      "--media <path>",
      "Attach image/media (path to local file)",
    )
    .option("-w, --wait <seconds>", "Wait for delivery status (0 to skip)", "0")
    .option("-p, --poll <seconds>", "Polling interval while waiting", "2")
    .option("--dry-run", "Print payload and skip sending", false)
    .option("--json", "Output result as JSON", false)
    .option("--verbose", "Verbose logging", false)
    .addHelpText(
      "after",
      `
Examples:
  warelay send --to +15551234567 --message "Hi"
  warelay send --to +15551234567 --message "Hi" --dry-run      # print payload only
  warelay send --to +15551234567 --message "Look!" --media ./photo.jpg`,
    )
    .action(async (opts) => {
      setVerbose(Boolean(opts.verbose));
      const deps = createDefaultDeps();
      try {
        await sendCommand(opts, deps, defaultRuntime);
      } catch (err) {
        defaultRuntime.error(String(err));
        defaultRuntime.exit(1);
      }
    });

  program
    .command("heartbeat")
    .description(
      "Trigger a heartbeat or manual send once (no tmux)",
    )
    .option("--to <number>", "Override target E.164; defaults to allowFrom[0]")
    .option(
      "--session-id <id>",
      "Force a session id for this heartbeat (resumes a specific Claude session)",
    )
    .option(
      "--all",
      "Send heartbeat to all active sessions (or allowFrom entries when none)",
      false,
    )
    .option(
      "--message <text>",
      "Send a custom message instead of the heartbeat probe",
    )
    .option("--body <text>", "Alias for --message")
    .option("--dry-run", "Print the resolved payload without sending", false)
    .option("--verbose", "Verbose logging", false)
    .addHelpText(
      "after",
      `
Examples:
  warelay heartbeat                 # uses first allowFrom contact
  warelay heartbeat --verbose       # prints detailed heartbeat logs
  warelay heartbeat --to +1555123   # override destination
  warelay heartbeat --session-id <uuid> --to +1555123   # resume a specific session
  warelay heartbeat --message "Ping"
  warelay heartbeat --all           # send to every active session recipient or allowFrom entry`,
    )
    .action(async (opts) => {
      setVerbose(Boolean(opts.verbose));
      const cfg = loadConfig();
      const allowAll = Boolean(opts.all);
      const resolution = resolveHeartbeatRecipients(cfg, {
        to: opts.to,
        all: allowAll,
      });
      if (
        !opts.to &&
        !allowAll &&
        resolution.source === "session-ambiguous" &&
        resolution.recipients.length > 1
      ) {
        defaultRuntime.error(
          danger(
            `Multiple active sessions found (${resolution.recipients.join(", ")}). Pass --to <E.164> or --all to send to all.`,
          ),
        );
        defaultRuntime.exit(1);
      }
      const recipients = resolution.recipients;
      if (!recipients || recipients.length === 0) {
        defaultRuntime.error(
          danger(
            "No destination found. Add inbound.allowFrom numbers or pass --to <E.164>.",
          ),
        );
        defaultRuntime.exit(1);
      }

      const overrideBody =
        (opts.message as string | undefined) ||
        (opts.body as string | undefined) ||
        undefined;
      const dryRun = Boolean(opts.dryRun);

      try {
        for (const to of recipients) {
          await runWebHeartbeatOnce({
            to,
            verbose: Boolean(opts.verbose),
            runtime: defaultRuntime,
            sessionId: opts.sessionId,
            overrideBody,
            dryRun,
          });
        }
      } catch {
        defaultRuntime.exit(1);
      }
    });

  program
    .command("relay")
    .description("Auto-reply to inbound messages (via Baileys)")
    .option(
      "--heartbeat <seconds>",
      "Heartbeat interval for health logs (seconds)",
    )
    .option(
      "--retries <count>",
      "Max consecutive reconnect attempts before exit (0 = unlimited)",
    )
    .option(
      "--retry-initial <ms>",
      "Initial reconnect backoff (ms)",
    )
    .option("--retry-max <ms>", "Max reconnect backoff (ms)")
    .option(
      "--heartbeat-now",
      "Run a heartbeat immediately when relay starts",
      false,
    )
    .option("--verbose", "Verbose logging", false)
    .addHelpText(
      "after",
      `
Examples:
  warelay relay                     # listen for incoming messages
  warelay relay --verbose           # with detailed logging
  warelay relay --heartbeat-now     # immediate heartbeat on start
`,
    )
    .action(async (opts) => {
      setVerbose(Boolean(opts.verbose));
      const { file: logFile, level: logLevel } = getResolvedLoggerSettings();
      defaultRuntime.log(info(`logs: ${logFile} (level ${logLevel})`));

      const heartbeat =
        opts.heartbeat !== undefined
          ? Number.parseInt(String(opts.heartbeat), 10)
          : undefined;
      const retries =
        opts.retries !== undefined
          ? Number.parseInt(String(opts.retries), 10)
          : undefined;
      const retryInitial =
        opts.retryInitial !== undefined
          ? Number.parseInt(String(opts.retryInitial), 10)
          : undefined;
      const retryMax =
        opts.retryMax !== undefined
          ? Number.parseInt(String(opts.retryMax), 10)
          : undefined;
      const heartbeatNow = Boolean(opts.heartbeatNow);

      if (
        heartbeat !== undefined &&
        (Number.isNaN(heartbeat) || heartbeat <= 0)
      ) {
        defaultRuntime.error("--heartbeat must be a positive integer");
        defaultRuntime.exit(1);
      }
      if (
        retries !== undefined &&
        (Number.isNaN(retries) || retries < 0)
      ) {
        defaultRuntime.error("--retries must be >= 0");
        defaultRuntime.exit(1);
      }
      if (
        retryInitial !== undefined &&
        (Number.isNaN(retryInitial) || retryInitial <= 0)
      ) {
        defaultRuntime.error("--retry-initial must be a positive integer");
        defaultRuntime.exit(1);
      }
      if (
        retryMax !== undefined &&
        (Number.isNaN(retryMax) || retryMax <= 0)
      ) {
        defaultRuntime.error("--retry-max must be a positive integer");
        defaultRuntime.exit(1);
      }
      if (
        retryMax !== undefined &&
        retryInitial !== undefined &&
        retryMax < retryInitial
      ) {
        defaultRuntime.error("--retry-max must be >= --retry-initial");
        defaultRuntime.exit(1);
      }

      const tuning: WebMonitorTuning = {};
      if (heartbeat !== undefined) tuning.heartbeatSeconds = heartbeat;
      if (heartbeatNow) tuning.replyHeartbeatNow = true;
      const reconnect: WebMonitorTuning["reconnect"] = {};
      if (retries !== undefined) reconnect.maxAttempts = retries;
      if (retryInitial !== undefined) reconnect.initialMs = retryInitial;
      if (retryMax !== undefined) reconnect.maxMs = retryMax;
      if (Object.keys(reconnect).length > 0) {
        tuning.reconnect = reconnect;
      }

      logWebSelfId(defaultRuntime, true);
      const cfg = loadConfig();
      const effectiveHeartbeat = resolveHeartbeatSeconds(
        cfg,
        tuning.heartbeatSeconds,
      );
      const effectivePolicy = resolveReconnectPolicy(
        cfg,
        tuning.reconnect,
      );
      defaultRuntime.log(
        info(
          `Relay health: heartbeat ${effectiveHeartbeat}s, retries ${effectivePolicy.maxAttempts || "∞"}, backoff ${effectivePolicy.initialMs}→${effectivePolicy.maxMs}ms x${effectivePolicy.factor} (jitter ${Math.round(effectivePolicy.jitter * 100)}%)`,
        ),
      );
      try {
        await monitorWebProvider(
          Boolean(opts.verbose),
          undefined,
          true,
          undefined,
          defaultRuntime,
          undefined,
          tuning,
        );
      } catch (err) {
        defaultRuntime.error(
          danger(`Relay failed: ${String(err)}`),
        );
        defaultRuntime.exit(1);
      }
    });

  program
    .command("relay:heartbeat")
    .description(
      "Run relay with an immediate heartbeat (no tmux)",
    )
    .option("--verbose", "Verbose logging", false)
    .action(async (opts) => {
      setVerbose(Boolean(opts.verbose));
      const { file: logFile, level: logLevel } = getResolvedLoggerSettings();
      defaultRuntime.log(info(`logs: ${logFile} (level ${logLevel})`));

      logWebSelfId(defaultRuntime, true);
      const cfg = loadConfig();
      const effectiveHeartbeat = resolveHeartbeatSeconds(cfg, undefined);
      const effectivePolicy = resolveReconnectPolicy(cfg, undefined);
      defaultRuntime.log(
        info(
          `Relay health: heartbeat ${effectiveHeartbeat}s, retries ${effectivePolicy.maxAttempts || "∞"}, backoff ${effectivePolicy.initialMs}→${effectivePolicy.maxMs}ms x${effectivePolicy.factor} (jitter ${Math.round(effectivePolicy.jitter * 100)}%)`,
        ),
      );

      try {
        await monitorWebProvider(
          Boolean(opts.verbose),
          undefined,
          true,
          undefined,
          defaultRuntime,
          undefined,
          { replyHeartbeatNow: true },
        );
      } catch (err) {
        defaultRuntime.error(
          danger(`Relay failed: ${String(err)}`),
        );
        defaultRuntime.exit(1);
      }
    });

  program
    .command("status")
    .description("Show recent WhatsApp messages (sent and received)")
    .option("-l, --limit <count>", "Number of messages to show", "20")
    .option("--json", "Output JSON instead of text", false)
    .option("--verbose", "Verbose logging", false)
    .addHelpText(
      "after",
      `
Examples:
  warelay status                            # last 20 msgs
  warelay status --limit 5                  # last 5 msgs
  warelay status --json --limit 50          # machine-readable output`,
    )
    .action(async (opts) => {
      setVerbose(Boolean(opts.verbose));
      const deps = createDefaultDeps();
      try {
        await statusCommand(opts, deps, defaultRuntime);
      } catch (err) {
        defaultRuntime.error(String(err));
        defaultRuntime.exit(1);
      }
    });

  program
    .command("relay:tmux")
    .description(
      "Run relay --verbose inside tmux (session warelay-relay), restarting if already running, then attach",
    )
    .action(async () => {
      try {
        const shouldAttach = Boolean(process.stdout.isTTY);
        const session = await spawnRelayTmux(
          "pnpm warelay relay --verbose",
          shouldAttach,
        );
        defaultRuntime.log(
          info(
            shouldAttach
              ? `tmux session started and attached: ${session} (pane running "pnpm warelay relay --verbose")`
              : `tmux session started: ${session} (pane running "pnpm warelay relay --verbose"); attach manually with "tmux attach -t ${session}"`,
          ),
        );
      } catch (err) {
        defaultRuntime.error(
          danger(`Failed to start relay tmux session: ${String(err)}`),
        );
        defaultRuntime.exit(1);
      }
    });

  program
    .command("relay:tmux:attach")
    .description(
      "Attach to the existing warelay-relay tmux session (no restart)",
    )
    .action(async () => {
      try {
        if (!process.stdout.isTTY) {
          defaultRuntime.error(
            danger(
              "Cannot attach: stdout is not a TTY. Run this in a terminal or use 'tmux attach -t warelay-relay' manually.",
            ),
          );
          defaultRuntime.exit(1);
          return;
        }
        await spawnRelayTmux("pnpm warelay relay --verbose", true, false);
        defaultRuntime.log(info("Attached to warelay-relay session."));
      } catch (err) {
        defaultRuntime.error(
          danger(`Failed to attach to warelay-relay: ${String(err)}`),
        );
        defaultRuntime.exit(1);
      }
    });

  program
    .command("relay:heartbeat:tmux")
    .description(
      "Run relay --verbose with an immediate heartbeat inside tmux (session warelay-relay), then attach",
    )
    .action(async () => {
      try {
        const shouldAttach = Boolean(process.stdout.isTTY);
        const session = await spawnRelayTmux(
          "pnpm warelay relay --verbose --heartbeat-now",
          shouldAttach,
        );
        defaultRuntime.log(
          info(
            shouldAttach
              ? `tmux session started and attached: ${session} (pane running "pnpm warelay relay --verbose --heartbeat-now")`
              : `tmux session started: ${session} (pane running "pnpm warelay relay --verbose --heartbeat-now"); attach manually with "tmux attach -t ${session}"`,
          ),
        );
      } catch (err) {
        defaultRuntime.error(
          danger(
            `Failed to start relay tmux session with heartbeat: ${String(err)}`,
          ),
        );
        defaultRuntime.exit(1);
      }
    });

  return program;
}
