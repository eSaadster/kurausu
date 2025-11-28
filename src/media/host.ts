// Media hosting - simplified for Baileys (uses local files or buffers)
// Baileys can send media directly via buffer

import { saveMediaSource } from "./store.js";

export type HostedMedia = {
  url: string;  // Local file path
  id: string;
  size: number;
};

export async function ensureMediaHosted(
  source: string,
  opts: {
    port?: number;
    startServer?: boolean;
    runtime?: unknown;
  } = {},
): Promise<HostedMedia> {
  // Save the media locally and return the path
  // Baileys will load it via loadWebMedia when sending
  const saved = await saveMediaSource(source);
  return {
    url: saved.path,
    id: saved.id,
    size: saved.size,
  };
}
