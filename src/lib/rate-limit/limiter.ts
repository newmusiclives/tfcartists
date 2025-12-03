import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

/**
 * Rate Limiting Configuration
 *
 * Protects expensive API endpoints from abuse
 *
 * PRODUCTION: Uses Upstash Redis for distributed rate limiting
 * DEVELOPMENT: Uses in-memory store (resets on server restart)
 */

// In-memory store for development
class MemoryStore {
  private store: Map<string, { count: number; reset: number }> = new Map();

  async get(key: string): Promise<number | null> {
    const item = this.store.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.reset) {
      this.store.delete(key);
      return null;
    }

    return item.count;
  }

  async set(key: string, count: number, ttl: number): Promise<void> {
    this.store.set(key, {
      count,
      reset: Date.now() + ttl * 1000,
    });
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newCount = (current || 0) + 1;
    // Use a default TTL of 60 seconds for incr operations
    await this.set(key, newCount, 60);
    return newCount;
  }
}

const memoryStore = new MemoryStore();

/**
 * Create rate limiter instance
 *
 * If UPSTASH_REDIS_REST_URL is configured, uses Redis
 * Otherwise, uses in-memory store for development
 */
function createRateLimiter(
  requests: number,
  window: string = "1 m"
): Ratelimit | null {
  const isProduction = process.env.NODE_ENV === "production";
  const hasUpstash =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (hasUpstash) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, window as any),
        analytics: true,
      });
    } catch (error) {
      logger.error("Failed to initialize Upstash rate limiter", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  // Development mode: use in-memory store
  if (!isProduction) {
    logger.warn(
      "Rate limiting using in-memory store (development only). Configure UPSTASH_REDIS_REST_URL for production."
    );
    return null; // We'll handle rate limiting manually with memory store
  }

  // Production without Upstash configured
  logger.warn("Rate limiting not configured. Set up Upstash Redis for production.");
  return null;
}

/**
 * Rate limit configurations for different endpoint types
 */
export const rateLimiters = {
  // AI endpoints (expensive operations)
  ai: createRateLimiter(10, "1 m"), // 10 requests per minute

  // API endpoints (general)
  api: createRateLimiter(60, "1 m"), // 60 requests per minute

  // Authentication endpoints
  auth: createRateLimiter(5, "5 m"), // 5 requests per 5 minutes
};

/**
 * Check rate limit for a given identifier
 */
export async function checkRateLimit(
  identifier: string,
  limiterType: keyof typeof rateLimiters = "api"
): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  error?: string;
}> {
  const limiter = rateLimiters[limiterType];

  // If no limiter configured (development), allow all requests
  if (!limiter) {
    // In development, use simple in-memory rate limiting
    if (process.env.NODE_ENV === "development") {
      const key = `ratelimit:${limiterType}:${identifier}`;
      const count = await memoryStore.incr(key);

      // Define limits for each type
      const limits = {
        ai: 10,
        api: 60,
        auth: 5,
      };

      const limit = limits[limiterType];

      if (count > limit) {
        logger.warn("Rate limit exceeded (in-memory)", {
          identifier,
          type: limiterType,
          count,
          limit,
        });

        return {
          success: false,
          limit,
          remaining: 0,
          error: "Rate limit exceeded",
        };
      }

      return {
        success: true,
        limit,
        remaining: limit - count,
      };
    }

    // Production without rate limiter - log warning but allow
    logger.warn("Rate limiting not configured - allowing request", {
      identifier,
      type: limiterType,
    });

    return { success: true };
  }

  // Use Upstash rate limiter
  try {
    const result = await limiter.limit(identifier);

    if (!result.success) {
      logger.warn("Rate limit exceeded", {
        identifier,
        type: limiterType,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      });
    }

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    logger.error("Rate limit check failed", {
      identifier,
      type: limiterType,
      error: error instanceof Error ? error.message : String(error),
    });

    // On error, allow the request but log it
    return {
      success: true,
      error: "Rate limit check failed",
    };
  }
}

/**
 * Get identifier from request for rate limiting
 *
 * Priority: User ID > IP address > Anonymous
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from various headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return `ip:${forwardedFor.split(",")[0].trim()}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback to anonymous (not ideal for production)
  return "anonymous";
}

/**
 * Middleware helper to check rate limits in API routes
 */
export async function withRateLimit(
  request: Request,
  limiterType: keyof typeof rateLimiters,
  userId?: string
): Promise<Response | null> {
  const identifier = getRateLimitIdentifier(request, userId);
  const result = await checkRateLimit(identifier, limiterType);

  if (!result.success) {
    return Response.json(
      {
        error: "Too many requests",
        message: "You have exceeded the rate limit. Please try again later.",
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": result.limit?.toString() || "0",
          "X-RateLimit-Remaining": result.remaining?.toString() || "0",
          "X-RateLimit-Reset": result.reset?.toString() || "0",
          "Retry-After": result.reset
            ? Math.ceil((result.reset - Date.now()) / 1000).toString()
            : "60",
        },
      }
    );
  }

  return null; // No rate limit hit, proceed with request
}
