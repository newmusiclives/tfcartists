/**
 * Runtime Configuration Reader
 *
 * Reads config values from the database (SystemConfig) first,
 * falling back to environment variables. This allows credentials
 * to be entered through the admin UI.
 */

import { prisma } from "@/lib/db";

// In-memory cache to avoid hitting DB on every request
const cache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL = 60_000; // 1 minute

/**
 * Get a configuration value.
 * Checks: DB (SystemConfig) → environment variable → defaultValue
 */
export async function getConfig(key: string, defaultValue: string = ""): Promise<string> {
  // Check cache first
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    // Check database
    const dbConfig = await prisma.systemConfig.findUnique({ where: { key } });
    if (dbConfig?.value) {
      cache.set(key, { value: dbConfig.value, expiresAt: Date.now() + CACHE_TTL });
      return dbConfig.value;
    }
  } catch {
    // DB not available, fall through to env
  }

  // Fall back to environment variable
  const envVal = process.env[key];
  if (envVal && envVal !== "" && !envVal.includes("placeholder")) {
    return envVal;
  }

  return defaultValue;
}

/**
 * Check if a configuration value is set (either in DB or env).
 */
export async function hasConfig(key: string): Promise<boolean> {
  const value = await getConfig(key);
  return value !== "";
}

/**
 * Clear the config cache (useful after saving new values).
 */
export function clearConfigCache() {
  cache.clear();
}
