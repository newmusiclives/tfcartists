/**
 * Feature flags - server side.
 *
 * Resolution order, highest priority first:
 *   1. Environment override   FLAG_<KEY>       - emergency kill switch, no DB needed
 *   2. Per-station override   flag:<key>:station:<id>
 *   3. Global setting         flag:<key>
 *   4. Registry default
 *
 * Values live in the existing Config key/value table, so no migration is needed.
 * Reads are cached in-process for a short period: these are checked on hot paths
 * and a database round trip per check would be wasteful. The cache is per
 * serverless instance, so a change propagates within CACHE_TTL everywhere.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  FLAGS,
  FLAG_KEYS,
  type FlagKey,
  flagConfigKey,
  flagEnvKey,
  isFlagKey,
} from "./registry";

export * from "./registry";

const CACHE_TTL = 30_000; // 30s - short enough that a toggle feels immediate

interface CacheEntry {
  value: boolean;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function parseBool(raw: string | null | undefined): boolean | undefined {
  if (raw === null || raw === undefined) return undefined;
  const v = raw.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(v)) return true;
  if (["false", "0", "no", "off"].includes(v)) return false;
  return undefined;
}

/** Environment override. Checked first and never cached - it cannot change at runtime. */
function envOverride(key: FlagKey): boolean | undefined {
  return parseBool(process.env[flagEnvKey(key)]);
}

/**
 * Is this flag on?
 *
 * Never throws. If the database is unreachable the registry default is used, so
 * a database blip cannot silently switch features on.
 */
export async function flag(key: FlagKey, stationId?: string | null): Promise<boolean> {
  const override = envOverride(key);
  if (override !== undefined) return override;

  const cacheKey = flagConfigKey(key, stationId);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const def = FLAGS[key];
  let value: boolean = def.defaultValue;

  try {
    const keys = [flagConfigKey(key)];
    // Only consult a station override when the flag actually supports one
    if (stationId && def.scope === "station") {
      keys.unshift(flagConfigKey(key, stationId));
    }

    const rows = await prisma.config.findMany({ where: { key: { in: keys } } });
    const byKey = new Map(rows.map((r) => [r.key, r.value]));

    for (const k of keys) {
      const parsed = parseBool(byKey.get(k));
      if (parsed !== undefined) {
        value = parsed;
        break;
      }
    }
  } catch (error) {
    logger.warn("Flag lookup failed, using registry default", {
      flag: key,
      default: def.defaultValue,
      error: error instanceof Error ? error.message : String(error),
    });
    value = def.defaultValue;
  }

  cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL });
  return value;
}

/** Resolve several flags at once. One query instead of N. */
export async function flags(
  keys: FlagKey[],
  stationId?: string | null
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  await Promise.all(
    keys.map(async (k) => {
      result[k] = await flag(k, stationId);
    })
  );
  return result;
}

/** Every flag's resolved value - used to seed the client provider. */
export async function allFlags(stationId?: string | null): Promise<Record<FlagKey, boolean>> {
  return (await flags(FLAG_KEYS, stationId)) as Record<FlagKey, boolean>;
}

export interface FlagState {
  key: FlagKey;
  label: string;
  description: string;
  category: string;
  scope: string;
  costNote?: string;
  defaultValue: boolean;
  globalValue: boolean | null;
  stationValue: boolean | null;
  effective: boolean;
  lockedByEnv: boolean;
}

/** Full picture for the admin UI: where each value comes from, not just the answer. */
export async function flagStates(stationId?: string | null): Promise<FlagState[]> {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.config.findMany({
      where: { key: { startsWith: "flag:" } },
      select: { key: true, value: true },
    });
  } catch (error) {
    logger.warn("Could not read flag config", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  return FLAG_KEYS.map((key) => {
    const def = FLAGS[key];
    const globalValue = parseBool(byKey.get(flagConfigKey(key))) ?? null;
    const stationValue =
      stationId && def.scope === "station"
        ? parseBool(byKey.get(flagConfigKey(key, stationId))) ?? null
        : null;
    const env = envOverride(key);

    const effective =
      env !== undefined ? env : stationValue ?? globalValue ?? def.defaultValue;

    return {
      key,
      label: def.label,
      description: def.description,
      category: def.category,
      scope: def.scope,
      costNote: "costNote" in def ? (def.costNote as string) : undefined,
      defaultValue: def.defaultValue,
      globalValue,
      stationValue,
      effective,
      lockedByEnv: env !== undefined,
    };
  });
}


/**
 * Turn a flag on or off. Pass value=null to clear the override and fall back to
 * the next level down (station -> global -> default).
 */
export async function setFlag(
  key: FlagKey,
  value: boolean | null,
  options: { stationId?: string | null; actor?: string } = {}
): Promise<void> {
  if (!isFlagKey(key)) throw new Error(`Unknown flag: ${key}`);

  const { stationId = null, actor = "unknown" } = options;
  const def = FLAGS[key];
  if (stationId && def.scope !== "station") {
    throw new Error(`Flag "${key}" is global and cannot be set per station`);
  }

  const configKey = flagConfigKey(key, stationId);

  if (value === null) {
    await prisma.config.deleteMany({ where: { key: configKey } });
  } else {
    await prisma.config.upsert({
      where: { key: configKey },
      create: { key: configKey, value: String(value) },
      update: { value: String(value) },
    });
  }

  cache.delete(configKey);
  // A global change can alter the effective value for every station
  if (!stationId) cache.clear();

  logger.info("Feature flag changed", {
    flag: key,
    value: value === null ? "cleared" : value,
    stationId: stationId ?? "global",
    actor,
  });
}

/** Drop the cache. Useful in tests and after a bulk import. */
export function clearFlagCache(): void {
  cache.clear();
}
