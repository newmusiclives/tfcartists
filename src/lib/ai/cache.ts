/**
 * AI Generation Cache
 *
 * Caches AI-generated content to reduce API costs.
 * Uses database-backed cache with configurable TTL.
 *
 * Targets:
 * - Station imaging scripts (generate once, reuse for weeks)
 * - Feature scripts by template+song combo (same song = same feature)
 * - DJ intro/outro scripts by time slot (morning greeting reuse)
 *
 * Expected cost reduction: 40-60%
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import crypto from "crypto";

/**
 * Generate a cache key from inputs.
 */
function cacheKey(prefix: string, inputs: Record<string, string | number | undefined>): string {
  const sorted = Object.entries(inputs)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("|");
  const hash = crypto.createHash("sha256").update(`${prefix}:${sorted}`).digest("hex").slice(0, 16);
  return `${prefix}:${hash}`;
}

/**
 * Get a cached AI generation result.
 * Returns null if not cached or expired.
 */
export async function getCachedGeneration(
  prefix: string,
  inputs: Record<string, string | number | undefined>,
  maxAgeHours = 168 // 1 week default
): Promise<string | null> {
  const key = cacheKey(prefix, inputs);
  const minDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  try {
    const cached = await prisma.systemConfig.findUnique({
      where: { key: `cache:${key}` },
    });

    if (cached && cached.updatedAt > minDate) {
      logger.info("AI cache hit", { prefix, key });
      return cached.value;
    }
  } catch {
    // Cache miss is not an error
  }

  return null;
}

/**
 * Store an AI generation result in cache.
 */
export async function setCachedGeneration(
  prefix: string,
  inputs: Record<string, string | number | undefined>,
  value: string
): Promise<void> {
  const key = cacheKey(prefix, inputs);

  try {
    await prisma.systemConfig.upsert({
      where: { key: `cache:${key}` },
      update: { value, updatedAt: new Date() },
      create: {
        key: `cache:${key}`,
        value,
        category: "ai_cache",
        label: `Cache: ${prefix}`,
        encrypted: false,
      },
    });
    logger.info("AI cache set", { prefix, key });
  } catch (error) {
    logger.warn("AI cache write failed", { prefix, key, error });
  }
}

/**
 * Wrap an AI generation function with caching.
 * If a cached result exists and is fresh, returns it without calling the generator.
 */
export async function withCache(
  prefix: string,
  inputs: Record<string, string | number | undefined>,
  generator: () => Promise<string>,
  maxAgeHours = 168
): Promise<string> {
  const cached = await getCachedGeneration(prefix, inputs, maxAgeHours);
  if (cached) return cached;

  const result = await generator();
  await setCachedGeneration(prefix, inputs, result);
  return result;
}

/**
 * Cache for station imaging scripts.
 * Key: station ID + imaging type (sweeper, ID, promo)
 * TTL: 2 weeks (imaging rarely changes)
 */
export async function getCachedImagingScript(
  stationId: string,
  type: string,
  djId?: string
): Promise<string | null> {
  return getCachedGeneration("imaging", { stationId, type, djId }, 336); // 2 weeks
}

export async function setCachedImagingScript(
  stationId: string,
  type: string,
  script: string,
  djId?: string
): Promise<void> {
  return setCachedGeneration("imaging", { stationId, type, djId }, script);
}

/**
 * Cache for feature scripts by template + song combo.
 * Same song with same feature type = reuse the script.
 * Key: feature type + song title + artist name
 * TTL: 1 month
 */
export async function getCachedFeatureScript(
  featureTypeId: string,
  songTitle: string,
  artistName: string
): Promise<string | null> {
  return getCachedGeneration("feature", { featureTypeId, songTitle, artistName }, 720); // 30 days
}

export async function setCachedFeatureScript(
  featureTypeId: string,
  songTitle: string,
  artistName: string,
  script: string
): Promise<void> {
  return setCachedGeneration("feature", { featureTypeId, songTitle, artistName }, script);
}

/**
 * Clean up expired cache entries.
 * Run periodically (e.g., monthly) to prevent table bloat.
 */
export async function cleanExpiredCache(maxAgeHours = 720): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  const result = await prisma.systemConfig.deleteMany({
    where: {
      key: { startsWith: "cache:" },
      updatedAt: { lt: cutoff },
    },
  });

  logger.info("Cleaned expired AI cache entries", { deleted: result.count });
  return result.count;
}
