import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ICECAST_STATUS_URL =
  process.env.ICECAST_STATUS_URL || "/stream/status-json.xsl";

// In-memory cache to avoid hammering Icecast
let cached: { count: number; peak: number; timestamp: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10_000; // 10 seconds

// Track peak listeners for the current day
let peakCount = 0;
let peakDate = "";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * GET /api/listeners/count
 *
 * Returns the current live listener count from Icecast.
 * Caches for 10 seconds to avoid excessive requests.
 */
export async function GET() {
  // Return cached value if fresh
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(
      { count: cached.count, peak: cached.peak, timestamp: cached.timestamp },
      {
        headers: {
          "Cache-Control": "public, max-age=10, stale-while-revalidate=5",
        },
      }
    );
  }

  let count = 0;
  const timestamp = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(ICECAST_STATUS_URL, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const icestats = data?.icestats;

      if (icestats) {
        // Source can be a single object or an array
        const sources = Array.isArray(icestats.source)
          ? icestats.source
          : icestats.source
            ? [icestats.source]
            : [];

        // Sum listeners across all mount points
        count = sources.reduce(
          (sum: number, s: any) =>
            sum + (s.listeners != null ? Number(s.listeners) : 0),
          0
        );
      }
    }
  } catch {
    // Icecast unreachable -- fall back to 0
    count = 0;
  }

  // Track daily peak
  const today = todayKey();
  if (today !== peakDate) {
    peakCount = 0;
    peakDate = today;
  }
  if (count > peakCount) {
    peakCount = count;
  }

  cached = { count, peak: peakCount, timestamp, fetchedAt: Date.now() };

  return NextResponse.json(
    { count, peak: peakCount, timestamp },
    {
      headers: {
        "Cache-Control": "public, max-age=10, stale-while-revalidate=5",
      },
    }
  );
}
