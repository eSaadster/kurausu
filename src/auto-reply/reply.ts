import crypto from "node:crypto";

import { loadConfig, type WarelayConfig } from "../config/config.js";
import {
  DEFAULT_IDLE_MINUTES,
  DEFAULT_RESET_TRIGGER,
  deriveSessionKey,
  loadSessionStore,
  resolveStorePath,
  saveSessionStore,
} from "../config/sessions.js";
import { info, isVerbose, logVerbose } from "../globals.js";
import { ensureMediaHosted } from "../media/host.js";
import { runCommandWithTimeout } from "../process/exec.js";
import { defaultRuntime, type RuntimeEnv } from "../runtime.js";
import { runCommandReply } from "./command-reply.js";
import {
  applyTemplate,
  type MsgContext,
  type TemplateContext,
} from "./templating.js";
import { isAudio, transcribeInboundAudio } from "./transcription.js";
import type { GetReplyOptions, ReplyPayload } from "./types.js";

export type { GetReplyOptions, ReplyPayload } from "./types.js";

export async function getReplyFromConfig(
  ctx: MsgContext,
  opts?: GetReplyOptions,
  configOverride?: WarelayConfig,
  commandRunner: typeof runCommandWithTimeout = runCommandWithTimeout,
): Promise<ReplyPayload | undefined> {
  // Choose reply from config: static text or external command stdout.
  const cfg = configOverride ?? loadConfig();
  const reply = cfg.inbound?.reply;
  const timeoutSeconds = Math.max(reply?.timeoutSeconds ?? 600, 1);
  const timeoutMs = timeoutSeconds * 1000;
  let started = false;
  const triggerTyping = async () => {
    await opts?.onReplyStart?.();
  };
  const onReplyStart = async () => {
    if (started) return;
    started = true;
    await triggerTyping();
  };
  let typingTimer: NodeJS.Timeout | undefined;
  const typingIntervalMs =
    reply?.mode === "command"
      ? (reply.typingIntervalSeconds ??
          reply?.session?.typingIntervalSeconds ??
          8) * 1000
      : 0;
  const cleanupTyping = () => {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = undefined;
    }
  };
  const startTypingLoop = async () => {
    if (!opts?.onReplyStart) return;
    if (typingIntervalMs <= 0) return;
    if (typingTimer) return;
    await triggerTyping();
    typingTimer = setInterval(() => {
      void triggerTyping();
    }, typingIntervalMs);
  };
  let transcribedText: string | undefined;

  // Optional audio transcription before templating/session handling.
  if (cfg.inbound?.transcribeAudio && isAudio(ctx.MediaType)) {
    const transcribed = await transcribeInboundAudio(cfg, ctx, defaultRuntime);
    if (transcribed?.text) {
      transcribedText = transcribed.text;
      ctx.Body = transcribed.text;
      ctx.Transcript = transcribed.text;
      logVerbose("Replaced Body with audio transcript for reply flow");
    }
  }

  // Optional session handling (conversation reuse + /new resets)
  const sessionCfg = reply?.session;
  const resetTriggers = sessionCfg?.resetTriggers?.length
    ? sessionCfg.resetTriggers
    : [DEFAULT_RESET_TRIGGER];
  const idleMinutes = Math.max(
    sessionCfg?.idleMinutes ?? DEFAULT_IDLE_MINUTES,
    1,
  );
  const sessionScope = sessionCfg?.scope ?? "per-sender";
  const storePath = resolveStorePath(sessionCfg?.store);
  let sessionStore: ReturnType<typeof loadSessionStore> | undefined;
  let sessionKey: string | undefined;

  let sessionId: string | undefined;
  let isNewSession = false;
  let bodyStripped: string | undefined;
  let systemSent = false;

  if (sessionCfg) {
    const trimmedBody = (ctx.Body ?? "").trim();
    for (const trigger of resetTriggers) {
      if (!trigger) continue;
      if (trimmedBody === trigger) {
        isNewSession = true;
        bodyStripped = "";
        break;
      }
      const triggerPrefix = `${trigger} `;
      if (trimmedBody.startsWith(triggerPrefix)) {
        isNewSession = true;
        bodyStripped = trimmedBody.slice(trigger.length).trimStart();
        break;
      }
    }

    sessionKey = deriveSessionKey(sessionScope, ctx);
    sessionStore = loadSessionStore(storePath);
    const entry = sessionStore[sessionKey];
    const idleMs = idleMinutes * 60_000;
    const freshEntry = entry && Date.now() - entry.updatedAt <= idleMs;

    if (!isNewSession && freshEntry) {
      sessionId = entry.sessionId;
      systemSent = entry.systemSent ?? false;
    } else {
      sessionId = crypto.randomUUID();
      isNewSession = true;
      systemSent = false;
    }

    sessionStore[sessionKey] = { sessionId, updatedAt: Date.now(), systemSent };
    await saveSessionStore(storePath, sessionStore);
  }

  const sessionCtx: TemplateContext = {
    ...ctx,
    BodyStripped: bodyStripped ?? ctx.Body,
    SessionId: sessionId,
    IsNewSession: isNewSession ? "true" : "false",
  };

  // Optional allowlist by origin number (E.164 without whatsapp: prefix)
  const allowFrom = cfg.inbound?.allowFrom;
  if (Array.isArray(allowFrom) && allowFrom.length > 0) {
    const from = (ctx.From ?? "").replace(/^whatsapp:/, "");
    // Support "*" as wildcard to allow all senders
    if (!allowFrom.includes("*") && !allowFrom.includes(from)) {
      logVerbose(
        `Skipping auto-reply: sender ${from || "<unknown>"} not in allowFrom list`,
      );
      cleanupTyping();
      return undefined;
    }
  }

  await startTypingLoop();

  // Optional prefix injected before Body for templating/command prompts.
  const sendSystemOnce = sessionCfg?.sendSystemOnce === true;
  const isFirstTurnInSession = isNewSession || !systemSent;
  const sessionIntro =
    isFirstTurnInSession && sessionCfg?.sessionIntro
      ? applyTemplate(sessionCfg.sessionIntro, sessionCtx)
      : "";
  const bodyPrefix = reply?.bodyPrefix
    ? applyTemplate(reply.bodyPrefix, sessionCtx)
    : "";
  const baseBody = sessionCtx.BodyStripped ?? sessionCtx.Body ?? "";
  const prefixedBodyBase = (() => {
    let body = baseBody;
    if (!sendSystemOnce || isFirstTurnInSession) {
      body = bodyPrefix ? `${bodyPrefix}${body}` : body;
    }
    if (sessionIntro) {
      body = `${sessionIntro}\n\n${body}`;
    }
    return body;
  })();
  if (
    sessionCfg &&
    sendSystemOnce &&
    isFirstTurnInSession &&
    sessionStore &&
    sessionKey
  ) {
    sessionStore[sessionKey] = {
      ...(sessionStore[sessionKey] ?? {}),
      sessionId: sessionId ?? crypto.randomUUID(),
      updatedAt: Date.now(),
      systemSent: true,
    };
    await saveSessionStore(storePath, sessionStore);
    systemSent = true;
  }

  const prefixedBody =
    transcribedText && reply?.mode === "command"
      ? [prefixedBodyBase, `Transcript:\n${transcribedText}`]
          .filter(Boolean)
          .join("\n\n")
      : prefixedBodyBase;
  const mediaNote = ctx.MediaPath?.length
    ? `[media attached: ${ctx.MediaPath}${ctx.MediaType ? ` (${ctx.MediaType})` : ""}${ctx.MediaUrl ? ` | ${ctx.MediaUrl}` : ""}]`
    : undefined;
  // For command prompts we prepend the media note so Claude et al. see it; text replies stay clean.
  const mediaReplyHint =
    mediaNote && reply?.mode === "command"
      ? "To send an image back, add a line like: MEDIA:https://example.com/image.jpg (no spaces). Keep caption in the text body."
      : undefined;
  const commandBody = mediaNote
    ? [mediaNote, mediaReplyHint, prefixedBody ?? ""]
        .filter(Boolean)
        .join("\n")
        .trim()
    : prefixedBody;
  const templatingCtx: TemplateContext = {
    ...sessionCtx,
    Body: commandBody,
    BodyStripped: commandBody,
  };
  if (!reply) {
    logVerbose("No inbound.reply configured; skipping auto-reply");
    cleanupTyping();
    return undefined;
  }

  if (reply.mode === "text" && reply.text) {
    await onReplyStart();
    logVerbose("Using text auto-reply from config");
    const result = {
      text: applyTemplate(reply.text, templatingCtx),
      mediaUrl: reply.mediaUrl,
    };
    cleanupTyping();
    return result;
  }

  if (reply && reply.mode === "command" && reply.command?.length) {
    await onReplyStart();
    const commandReply = {
      ...reply,
      command: reply.command,
      mode: "command" as const,
    };
    try {
      const { payload, meta } = await runCommandReply({
        reply: commandReply,
        templatingCtx,
        sendSystemOnce,
        isNewSession,
        isFirstTurnInSession,
        systemSent,
        timeoutMs,
        timeoutSeconds,
        commandRunner,
      });
      if (meta.claudeMeta && isVerbose()) {
        logVerbose(`Claude JSON meta: ${meta.claudeMeta}`);
      }
      return payload;
    } finally {
      cleanupTyping();
    }
  }

  cleanupTyping();
  return undefined;
}
