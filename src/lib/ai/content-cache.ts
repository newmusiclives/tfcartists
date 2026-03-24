/**
 * AI Content Cache — reduces AI API costs by 40-60%
 *
 * Caching layer that checks for existing/similar AI-generated content
 * before making new API calls. Uses the SystemConfig table for persistent
 * key-value storage with TTL enforcement.
 *
 * Cache key pattern: ai_cache:{type}:{hash}
 *
 * TTL by content type:
 * - Station imaging scripts: 7 days (imaging changes rarely)
 * - Voice track scripts: 24 hours (day-specific content)
 * - Feature scripts (template+song): 30 days (same combo = same feature)
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import crypto from "crypto";

// TTL constants in hours
const TTL_IMAGING_HOURS = 7 * 24; // 7 days
const TTL_VOICE_TRACK_HOURS = 24; // 24 hours
const TTL_FEATURE_HOURS = 30 * 24; // 30 days

/**
 * Generate a deterministic cache key from structured inputs.
 * Uses SHA-256 hash of sorted key-value pairs to ensure consistency.
 */
function buildCacheKey(
  type: string,
  inputs: Record<string, string | number | undefined | null>,
): string {
  const sorted = Object.entries(inputs)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("|");
  const hash = crypto
    .createHash("sha256")
    .update(`${type}:${sorted}`)
    .digest("hex")
    .slice(0, 16);
  return `ai_cache:${type}:${hash}`;
}

/**
 * Retrieve a cached AI generation result.
 * Returns null if not found or expired.
 */
export async function getFromCache(
  type: string,
  inputs: Record<string, string | number | undefined | null>,
  maxAgeHours: number,
): Promise<string | null> {
  const key = buildCacheKey(type, inputs);
  const minDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  try {
    const cached = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (cached && cached.updatedAt > minDate) {
      logger.info("AI content cache HIT", { type, key });
      return cached.value;
    }

    if (cached) {
      logger.info("AI content cache EXPIRED", { type, key });
    }
  } catch {
    // Cache miss is not an error
  }

  return null;
}

/**
 * Store an AI generation result in the cache.
 */
export async function setInCache(
  type: string,
  inputs: Record<string, string | number | undefined | null>,
  value: string,
): Promise<void> {
  const key = buildCacheKey(type, inputs);

  try {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: {
        key,
        value,
        category: "ai_cache",
        label: `AI Cache: ${type}`,
        encrypted: false,
      },
    });
    logger.info("AI content cache SET", { type, key });
  } catch (error) {
    logger.warn("AI content cache write failed", { type, key, error });
  }
}

// ---------------------------------------------------------------------------
// Station Imaging Cache (TTL: 7 days)
// ---------------------------------------------------------------------------

/**
 * Check cache for station imaging scripts.
 * Key inputs: stationId + category (e.g., "sweeper_hank_westwood")
 */
export async function getCachedImagingScripts(
  stationId: string,
  category: string,
): Promise<string | null> {
  return getFromCache("imaging_scripts", { stationId, category }, TTL_IMAGING_HOURS);
}

/**
 * Store generated imaging scripts in cache.
 * Value is the full JSON string of the scripts array.
 */
export async function setCachedImagingScripts(
  stationId: string,
  category: string,
  scriptsJson: string,
): Promise<void> {
  return setInCache("imaging_scripts", { stationId, category }, scriptsJson);
}

// ---------------------------------------------------------------------------
// Voice Track Cache (TTL: 24 hours)
// ---------------------------------------------------------------------------

/**
 * Check cache for a voice track script.
 * Key inputs: djId + trackType + nextSongId + hourOfDay
 */
export async function getCachedVoiceTrackScript(
  djId: string,
  trackType: string,
  nextSongId: string | undefined,
  hourOfDay: number,
): Promise<string | null> {
  return getFromCache(
    "voice_track",
    { djId, trackType, nextSongId, hourOfDay },
    TTL_VOICE_TRACK_HOURS,
  );
}

export async function setCachedVoiceTrackScript(
  djId: string,
  trackType: string,
  nextSongId: string | undefined,
  hourOfDay: number,
  script: string,
): Promise<void> {
  return setInCache(
    "voice_track",
    { djId, trackType, nextSongId, hourOfDay },
    script,
  );
}

// ---------------------------------------------------------------------------
// Feature Script Cache (TTL: 30 days)
// ---------------------------------------------------------------------------

/**
 * Check cache for a feature script by template+song combo.
 * Same feature type + same song = reuse the generated dialogue.
 */
export async function getCachedFeatureScript(
  featureTypeId: string,
  songId: string,
  djId: string,
): Promise<string | null> {
  return getFromCache(
    "feature_script",
    { featureTypeId, songId, djId },
    TTL_FEATURE_HOURS,
  );
}

export async function setCachedFeatureScript(
  featureTypeId: string,
  songId: string,
  djId: string,
  script: string,
): Promise<void> {
  return setInCache(
    "feature_script",
    { featureTypeId, songId, djId },
    script,
  );
}

// ---------------------------------------------------------------------------
// Relink Feature Cache (TTL: 30 days)
// Same template+song combo during relinkFeatures should reuse dialogue.
// ---------------------------------------------------------------------------

export async function getCachedRelinkDialogue(
  featureTypeId: string,
  songId: string,
  djId: string,
): Promise<string | null> {
  return getFromCache(
    "relink_dialogue",
    { featureTypeId, songId, djId },
    TTL_FEATURE_HOURS,
  );
}

export async function setCachedRelinkDialogue(
  featureTypeId: string,
  songId: string,
  djId: string,
  dialogue: string,
): Promise<void> {
  return setInCache(
    "relink_dialogue",
    { featureTypeId, songId, djId },
    dialogue,
  );
}

// ---------------------------------------------------------------------------
// Cache Maintenance
// ---------------------------------------------------------------------------

/**
 * Clean up expired cache entries to prevent SystemConfig table bloat.
 * Should be called periodically (e.g., from maintenance cron).
 */
export async function cleanExpiredContentCache(maxAgeHours = 30 * 24): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  const result = await prisma.systemConfig.deleteMany({
    where: {
      key: { startsWith: "ai_cache:" },
      updatedAt: { lt: cutoff },
    },
  });

  if (result.count > 0) {
    logger.info("Cleaned expired AI content cache entries", { deleted: result.count });
  }

  return result.count;
}
