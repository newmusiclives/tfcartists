/**
 * Public API Key Authentication
 *
 * Validates API keys passed via X-API-Key header or ?api_key query param.
 * Keys are stored in SystemConfig as a JSON array under "api_keys".
 * Includes in-memory rate limiting at 100 requests/minute per key.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const API_KEYS_CONFIG_KEY = "api_keys";

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  stationId: string;
  createdAt: string;
  lastUsedAt?: string;
  createdBy: string;
}

export interface ApiKeyValidation {
  valid: boolean;
  stationId: string;
  keyName: string;
  keyId: string;
}

// In-memory rate limit tracking: key -> { count, windowStart }
const rateLimits = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 100;

/**
 * Check and increment rate limit for a given API key ID.
 * Returns true if the request is allowed, false if rate limited.
 */
function checkRateLimit(keyId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimits.get(keyId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(keyId, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  entry.count++;
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);
  const resetAt = entry.windowStart + RATE_LIMIT_WINDOW_MS;

  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining, resetAt };
}

/**
 * Load all API keys from SystemConfig.
 */
export async function getApiKeys(): Promise<ApiKey[]> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: API_KEYS_CONFIG_KEY },
    });
    if (!config) return [];
    return JSON.parse(config.value) as ApiKey[];
  } catch {
    return [];
  }
}

/**
 * Save API keys to SystemConfig.
 */
export async function saveApiKeys(keys: ApiKey[]): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: API_KEYS_CONFIG_KEY },
    create: {
      key: API_KEYS_CONFIG_KEY,
      value: JSON.stringify(keys),
      category: "api",
      label: "Public API Keys",
      encrypted: false,
    },
    update: {
      value: JSON.stringify(keys),
      updatedAt: new Date(),
    },
  });
}

/**
 * Validate an API key from the request.
 * Checks X-API-Key header first, then ?api_key query param.
 * Returns validation result or null if no key / invalid key.
 */
export async function validateApiKey(
  request: NextRequest
): Promise<{ validation: ApiKeyValidation; rateLimit: { remaining: number; resetAt: number } } | null> {
  // Extract key from header or query param
  const apiKey =
    request.headers.get("x-api-key") ||
    request.nextUrl.searchParams.get("api_key");

  if (!apiKey) return null;

  // Load keys and find match
  const keys = await getApiKeys();
  const matchedKey = keys.find((k) => k.key === apiKey);

  if (!matchedKey) return null;

  // Check rate limit
  const rateLimit = checkRateLimit(matchedKey.id);
  if (!rateLimit.allowed) {
    return null; // Rate limited — caller should check separately
  }

  // Update last used (fire and forget)
  matchedKey.lastUsedAt = new Date().toISOString();
  saveApiKeys(keys).catch(() => {});

  return {
    validation: {
      valid: true,
      stationId: matchedKey.stationId,
      keyName: matchedKey.name,
      keyId: matchedKey.id,
    },
    rateLimit: {
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt,
    },
  };
}

/**
 * Standalone rate limit check (returns details for 429 response).
 */
export function getRateLimitStatus(keyId: string): { allowed: boolean; remaining: number; resetAt: number } {
  return checkRateLimit(keyId);
}

/**
 * Full middleware-style helper: validates key + checks rate limit.
 * Returns { auth, headers } on success, or a JSON error response object.
 */
export async function requireApiKey(request: NextRequest): Promise<
  | { auth: ApiKeyValidation; headers: Record<string, string> }
  | { error: string; status: number; headers?: Record<string, string> }
> {
  const apiKey =
    request.headers.get("x-api-key") ||
    request.nextUrl.searchParams.get("api_key");

  if (!apiKey) {
    return { error: "Missing API key. Provide X-API-Key header or api_key query parameter.", status: 401 };
  }

  const keys = await getApiKeys();
  const matchedKey = keys.find((k) => k.key === apiKey);

  if (!matchedKey) {
    return { error: "Invalid API key.", status: 401 };
  }

  // Check rate limit
  const rateLimit = checkRateLimit(matchedKey.id);
  const rlHeaders: Record<string, string> = {
    "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
  };

  if (!rateLimit.allowed) {
    return {
      error: "Rate limit exceeded. Maximum 100 requests per minute.",
      status: 429,
      headers: rlHeaders,
    };
  }

  // Update last used (fire and forget)
  matchedKey.lastUsedAt = new Date().toISOString();
  saveApiKeys(keys).catch(() => {});

  return {
    auth: {
      valid: true,
      stationId: matchedKey.stationId,
      keyName: matchedKey.name,
      keyId: matchedKey.id,
    },
    headers: rlHeaders,
  };
}
