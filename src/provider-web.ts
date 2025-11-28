// Barrel exports for the web provider pieces (Baileys-based).
export {
  DEFAULT_WEB_MEDIA_BYTES,
  HEARTBEAT_PROMPT,
  HEARTBEAT_TOKEN,
  monitorWebProvider,
  resolveHeartbeatRecipients,
  runWebHeartbeatOnce,
  type WebMonitorTuning,
} from "./web/auto-reply.js";
export {
  extractMediaPlaceholder,
  extractText,
  monitorWebInbox,
  type WebInboundMessage,
  type WebListenerCloseReason,
} from "./web/inbound.js";
export { loadWebMedia, optimizeImageToJpeg } from "./web/media.js";
export { sendMessageWeb } from "./web/outbound.js";
export {
  createWaSocket,
  formatError,
  getStatusCode,
  logWebSelfId,
  logoutWeb,
  pickProvider,
  readWebSelfId,
  WA_WEB_AUTH_DIR,
  waitForWaConnection,
  webAuthExists,
} from "./web/session.js";
export { loginWeb } from "./web/login.js";
