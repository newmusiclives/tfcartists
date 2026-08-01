import { flag } from "@/lib/flags";

/**
 * Resolve which Icecast mount a listener should be given.
 *
 * Liquidsoap publishes two mounts from the same source: 320kbps and 128kbps.
 * Both have always existed, but every caller hard-coded the 320k mount - so HQ
 * audio was already being served to everyone, and the `hq_stream` addon granted
 * something listeners had for free. A paid tier that changes nothing is worse
 * than no tier: it is a promise the product silently breaks.
 *
 * Standard is 128k, which is a normal streaming-radio bitrate and costs roughly
 * 40% of the bandwidth. HQ is the addon.
 */

export const STREAM_MOUNTS = {
  hq: "/stream/americana-hq.mp3",
  standard: "/stream/americana-mobile.mp3",
} as const;

/**
 * An explicit NEXT_PUBLIC_STREAM_URL still wins. Self-hosted operators point at
 * their own Icecast, and the flag has no authority over someone else's server.
 */
export function configuredStreamUrl(): string | null {
  return process.env.NEXT_PUBLIC_STREAM_URL || null;
}

export async function streamUrlFor(stationId?: string | null): Promise<string> {
  const configured = configuredStreamUrl();
  if (configured) return configured;

  const hq = await flag("hq_stream", stationId ?? undefined);
  return hq ? STREAM_MOUNTS.hq : STREAM_MOUNTS.standard;
}

/** Bitrate that matches the mount, for display and for stream-health checks. */
export function bitrateForUrl(url: string): number {
  return url.includes("americana-hq") ? 320 : 128;
}
