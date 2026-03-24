import { logger } from "@/lib/logger";

interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  lastSuccess: number;
}

const circuits = new Map<string, CircuitState>();

const FAILURE_THRESHOLD = 5;      // Open after 5 consecutive failures
const RESET_TIMEOUT_MS = 60_000;  // Try again after 60 seconds (half-open)
const SUCCESS_RESET = 2;          // Close after 2 successes in half-open

/**
 * Circuit breaker for external API calls.
 * Prevents hammering a failing service.
 */
export function getCircuitState(service: string): CircuitState {
  if (!circuits.has(service)) {
    circuits.set(service, { failures: 0, lastFailure: 0, isOpen: false, lastSuccess: Date.now() });
  }
  return circuits.get(service)!;
}

export function isCircuitOpen(service: string): boolean {
  const state = getCircuitState(service);
  if (!state.isOpen) return false;

  // Check if reset timeout has elapsed (half-open)
  if (Date.now() - state.lastFailure > RESET_TIMEOUT_MS) {
    return false; // Allow a trial request
  }

  return true;
}

export function recordSuccess(service: string): void {
  const state = getCircuitState(service);
  state.lastSuccess = Date.now();

  if (state.isOpen) {
    // In half-open state, count successes
    state.failures = Math.max(0, state.failures - SUCCESS_RESET);
    if (state.failures === 0) {
      state.isOpen = false;
      logger.info(`Circuit breaker CLOSED for ${service}`);
    }
  } else {
    state.failures = 0;
  }
}

export function recordFailure(service: string): void {
  const state = getCircuitState(service);
  state.failures++;
  state.lastFailure = Date.now();

  if (state.failures >= FAILURE_THRESHOLD && !state.isOpen) {
    state.isOpen = true;
    logger.error(`Circuit breaker OPEN for ${service} after ${state.failures} failures`);
  }
}

/**
 * Wrap an async function with circuit breaker protection.
 */
export async function withCircuitBreaker<T>(
  service: string,
  fn: () => Promise<T>,
  fallback?: T,
): Promise<T> {
  if (isCircuitOpen(service)) {
    logger.warn(`Circuit breaker is OPEN for ${service} — skipping call`);
    if (fallback !== undefined) return fallback;
    throw new Error(`Circuit breaker open for ${service}`);
  }

  try {
    const result = await fn();
    recordSuccess(service);
    return result;
  } catch (err) {
    recordFailure(service);
    throw err;
  }
}
