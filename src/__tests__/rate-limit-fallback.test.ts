import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Helper to create the Ratelimit mock factory with a given limit function.
 * Uses a class so `new Ratelimit(...)` works in the source code.
 * Also provides static `slidingWindow` method.
 */
function makeRatelimitMock(mockLimitFn: ReturnType<typeof vi.fn>) {
  class RatelimitMock {
    limit = mockLimitFn;
    static slidingWindow = vi.fn().mockReturnValue("sliding-window-config");
  }
  return { Ratelimit: RatelimitMock };
}

function makeLoggerMock() {
  return {
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    },
  };
}

describe("Rate Limiter Fail-Open Behavior", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    // Clear Upstash env vars so we get in-memory fallback by default
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  describe("checkRateLimit with Upstash error", () => {
    it("returns success: true when Upstash limiter.limit() throws (fail-open)", async () => {
      process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";

      const mockLimitFn = vi.fn().mockRejectedValue(new Error("Redis connection timeout"));
      const loggerMock = makeLoggerMock();

      vi.doMock("@/lib/logger", () => loggerMock);
      vi.doMock("@upstash/ratelimit", () => makeRatelimitMock(mockLimitFn));
      vi.doMock("@upstash/redis", () => ({ Redis: class {} }));

      const { checkRateLimit } = await import("@/lib/rate-limit/limiter");

      const result = await checkRateLimit("user:test-123", "api");

      expect(result.success).toBe(true);
      expect(result.error).toBe(
        "Rate limit check failed — request allowed (fallback)"
      );
      expect(loggerMock.logger.error).toHaveBeenCalledWith(
        "Rate limit check failed — falling back to allow",
        expect.objectContaining({
          identifier: "user:test-123",
          type: "api",
          error: "Redis connection timeout",
        })
      );
    });

    it("logs the error message from the thrown error", async () => {
      process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";

      const mockLimitFn = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
      const loggerMock = makeLoggerMock();

      vi.doMock("@/lib/logger", () => loggerMock);
      vi.doMock("@upstash/ratelimit", () => makeRatelimitMock(mockLimitFn));
      vi.doMock("@upstash/redis", () => ({ Redis: class {} }));

      const { checkRateLimit } = await import("@/lib/rate-limit/limiter");

      await checkRateLimit("ip:192.168.1.1", "ai");

      expect(loggerMock.logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Rate limit check failed"),
        expect.objectContaining({
          error: "ECONNREFUSED",
        })
      );
    });

    it("handles non-Error thrown values by converting to string", async () => {
      process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";

      const mockLimitFn = vi.fn().mockRejectedValue("string error");
      const loggerMock = makeLoggerMock();

      vi.doMock("@/lib/logger", () => loggerMock);
      vi.doMock("@upstash/ratelimit", () => makeRatelimitMock(mockLimitFn));
      vi.doMock("@upstash/redis", () => ({ Redis: class {} }));

      const { checkRateLimit } = await import("@/lib/rate-limit/limiter");

      const result = await checkRateLimit("user:test", "auth");

      expect(result.success).toBe(true);
      expect(loggerMock.logger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          error: "string error",
        })
      );
    });
  });

  describe("In-memory fallback (no Upstash configured)", () => {
    it("allows requests under the limit", async () => {
      const loggerMock = makeLoggerMock();

      vi.doMock("@/lib/logger", () => loggerMock);
      vi.doMock("@upstash/ratelimit", () => {
        class R {
          static slidingWindow = vi.fn();
        }
        return { Ratelimit: R };
      });
      vi.doMock("@upstash/redis", () => ({ Redis: class {} }));

      const { checkRateLimit } = await import("@/lib/rate-limit/limiter");

      const result = await checkRateLimit("user:memory-test", "api");
      expect(result.success).toBe(true);
      expect(result.remaining).toBeDefined();
    });

    it("returns success: true with remaining count for the first request", async () => {
      const loggerMock = makeLoggerMock();

      vi.doMock("@/lib/logger", () => loggerMock);
      vi.doMock("@upstash/ratelimit", () => {
        class R {
          static slidingWindow = vi.fn();
        }
        return { Ratelimit: R };
      });
      vi.doMock("@upstash/redis", () => ({ Redis: class {} }));

      const { checkRateLimit } = await import("@/lib/rate-limit/limiter");

      const result = await checkRateLimit("user:fresh-user", "api");
      expect(result.success).toBe(true);
      expect(result.limit).toBe(60); // api limit is 60
      // remaining should be limit - 1 for first request
      expect(result.remaining).toBe(59);
    });
  });
});
