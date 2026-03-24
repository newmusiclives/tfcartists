/**
 * In-memory now-playing state pushed by Liquidsoap.
 * This is the authoritative source — Liquidsoap knows exactly what's on air.
 *
 * Separated from the route file because Next.js route files only allow
 * specific exports (GET, POST, etc.).
 */

let currentTrack: {
  title: string;
  artist_name: string;
  updatedAt: number;
} | null = null;

/** Read the current now-playing state (used by /api/now-playing) */
export function getLiquidoapNowPlaying() {
  if (!currentTrack) return null;
  // Stale after 5 minutes — stream may be down
  if (Date.now() - currentTrack.updatedAt > 5 * 60 * 1000) return null;
  return currentTrack;
}

/** Update the now-playing state (called by /api/notify_now_playing) */
export function setLiquidoapNowPlaying(title: string, artist_name: string) {
  currentTrack = { title, artist_name, updatedAt: Date.now() };
}
