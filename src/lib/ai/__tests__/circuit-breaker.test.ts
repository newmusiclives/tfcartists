import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  getCircuitState,
  isCircuitOpen,
  recordSuccess,
  recordFailure,
  withCircuitBreaker,
} from "../circuit-breaker";

// The circuit breaker uses an in-memory Map, so we need unique service names
// per test to avoid cross-test contamination.
let testId = 0;
function uniqueService() {
  return `test-service-${++testId}-${Date.now()}`;
}

describe("circuit-breaker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCircuitState", () => {
    it("initializes a new circuit in closed state", () => {
      const service = uniqueService();
      const state = getCircuitState(service);

      expect(state.failures).toBe(0);
      expect(state.isOpen).toBe(false);
      expect(state.lastFailure).toBe(0);
      expect(state.lastSuccess).toBeGreaterThan(0);
    });

    it("returns the same state object on subsequent calls", () => {
      const service = uniqueService();
      const state1 = getCircuitState(service);
      const state2 = getCircuitState(service);

      expect(state1).toBe(state2);
    });
  });

  describe("isCircuitOpen", () => {
    it("returns false for a new circuit", () => {
      const service = uniqueService();
      expect(isCircuitOpen(service)).toBe(false);
    });

    it("returns true after threshold failures", () => {
      const service = uniqueService();

      // Record 5 failures (the threshold)
      for (let i = 0; i < 5; i++) {
        recordFailure(service);
      }

      expect(isCircuitOpen(service)).toBe(true);
    });

    it("returns false (half-open) after reset timeout", () => {
      const service = uniqueService();

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        recordFailure(service);
      }
      expect(isCircuitOpen(service)).toBe(true);

      // Simulate timeout elapsed by backdating lastFailure
      const state = getCircuitState(service);
      state.lastFailure = Date.now() - 61_000; // 61 seconds ago (timeout is 60s)

      expect(isCircuitOpen(service)).toBe(false); // half-open
    });
  });

  describe("recordFailure", () => {
    it("increments failure count", () => {
      const service = uniqueService();

      recordFailure(service);
      expect(getCircuitState(service).failures).toBe(1);

      recordFailure(service);
      expect(getCircuitState(service).failures).toBe(2);
    });

    it("opens circuit after 5 failures (threshold)", () => {
      const service = uniqueService();

      for (let i = 0; i < 4; i++) {
        recordFailure(service);
      }
      expect(getCircuitState(service).isOpen).toBe(false);

      recordFailure(service); // 5th failure
      expect(getCircuitState(service).isOpen).toBe(true);
    });

    it("updates lastFailure timestamp", () => {
      const service = uniqueService();
      const before = Date.now();

      recordFailure(service);

      const state = getCircuitState(service);
      expect(state.lastFailure).toBeGreaterThanOrEqual(before);
    });
  });

  describe("recordSuccess", () => {
    it("resets failure count in closed state", () => {
      const service = uniqueService();

      recordFailure(service);
      recordFailure(service);
      expect(getCircuitState(service).failures).toBe(2);

      recordSuccess(service);
      expect(getCircuitState(service).failures).toBe(0);
    });

    it("decrements failures in half-open state", () => {
      const service = uniqueService();

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        recordFailure(service);
      }
      expect(getCircuitState(service).isOpen).toBe(true);

      // Record success in open (half-open) state
      // SUCCESS_RESET is 2, so failures go from 5 to 3
      recordSuccess(service);
      expect(getCircuitState(service).failures).toBe(3);
      expect(getCircuitState(service).isOpen).toBe(true); // still open
    });

    it("closes circuit after enough successes in half-open state", () => {
      const service = uniqueService();

      // Open the circuit with exactly 5 failures
      for (let i = 0; i < 5; i++) {
        recordFailure(service);
      }

      // Each success reduces by SUCCESS_RESET (2)
      // 5 -> 3 -> 1 ... but Math.max(0, 1-2) = 0, so 3 successes close it
      recordSuccess(service); // 5 - 2 = 3
      expect(getCircuitState(service).isOpen).toBe(true);

      recordSuccess(service); // 3 - 2 = 1
      expect(getCircuitState(service).isOpen).toBe(true);

      recordSuccess(service); // max(0, 1 - 2) = 0 -> closes
      expect(getCircuitState(service).isOpen).toBe(false);
      expect(getCircuitState(service).failures).toBe(0);
    });
  });

  describe("withCircuitBreaker", () => {
    it("executes function and returns result when circuit is closed", async () => {
      const service = uniqueService();
      const fn = vi.fn().mockResolvedValue("success");

      const result = await withCircuitBreaker(service, fn);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("records success after successful call", async () => {
      const service = uniqueService();

      // Add some failures first
      recordFailure(service);
      recordFailure(service);

      await withCircuitBreaker(service, async () => "ok");

      // Success should reset failures in closed state
      expect(getCircuitState(service).failures).toBe(0);
    });

    it("records failure and rethrows on error", async () => {
      const service = uniqueService();
      const error = new Error("API timeout");

      await expect(
        withCircuitBreaker(service, async () => {
          throw error;
        })
      ).rejects.toThrow("API timeout");

      expect(getCircuitState(service).failures).toBe(1);
    });

    it("returns fallback when circuit is open", async () => {
      const service = uniqueService();

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        recordFailure(service);
      }

      const fn = vi.fn();
      const result = await withCircuitBreaker(service, fn, "fallback-value");

      expect(result).toBe("fallback-value");
      expect(fn).not.toHaveBeenCalled(); // function should NOT be called
    });

    it("throws when circuit is open and no fallback provided", async () => {
      const service = uniqueService();

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        recordFailure(service);
      }

      await expect(
        withCircuitBreaker(service, async () => "never-reached")
      ).rejects.toThrow("Circuit breaker open");
    });

    it("allows trial request in half-open state", async () => {
      const service = uniqueService();

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        recordFailure(service);
      }

      // Simulate timeout elapsed
      getCircuitState(service).lastFailure = Date.now() - 61_000;

      const fn = vi.fn().mockResolvedValue("trial-success");
      const result = await withCircuitBreaker(service, fn);

      expect(result).toBe("trial-success");
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
