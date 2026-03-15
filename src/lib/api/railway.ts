import { logger } from "@/lib/logger";

const RAILWAY_API = process.env.RAILWAY_BACKEND_URL || "https://tfc-radio-backend-production.up.railway.app";

/** Maximum number of retry attempts for transient failures. */
const MAX_RETRIES = 2;
/** Base delay in ms between retries (doubles each attempt). */
const RETRY_BASE_DELAY_MS = 1000;

/**
 * Fetch wrapper for the Railway playout backend.
 * Includes automatic retries for transient failures and structured logging.
 */
export async function railwayFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${RAILWAY_API}${path}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      // Don't retry client errors (4xx) — only server errors (5xx) and network failures
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res;
      }

      // Server error — retry if we have attempts left
      lastError = new Error(`Railway ${res.status}: ${res.statusText}`);
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        logger.warn(`Railway fetch failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms`, {
          url, status: res.status,
        });
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        logger.warn(`Railway fetch error (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms`, {
          url, error: lastError.message,
        });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  logger.error("Railway fetch failed after all retries", {
    url, error: lastError?.message,
  });
  throw lastError || new Error(`Railway fetch failed: ${url}`);
}

/**
 * Check if the Railway backend is reachable and responding.
 * Returns health status without throwing on failure.
 */
export async function railwayHealthCheck(): Promise<{
  healthy: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const res = await fetch(`${RAILWAY_API}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return {
      healthy: res.ok,
      latencyMs: Date.now() - start,
      ...(res.ok ? {} : { error: `Status ${res.status}` }),
    };
  } catch (err) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Fetch the current now-playing state from Railway.
 */
export async function railwayNowPlaying(): Promise<{
  title?: string;
  artist?: string;
  djName?: string;
  error?: string;
} | null> {
  try {
    const res = await railwayFetch("/api/now_playing");
    if (!res.ok) return { error: `Status ${res.status}` };
    return await res.json();
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
