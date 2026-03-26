import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const SLOW_THRESHOLD_MS = 5000;

interface TimerStats {
  totalRequests: number;
  totalMs: number;
  avgMs: number;
  maxMs: number;
  slowCount: number;
  lastUpdated: string;
}

/**
 * Wraps a Next.js API route handler to track response times.
 * Logs slow responses (>5s) as warnings and stores aggregated stats in the Config table.
 *
 * Usage:
 *   import { withApiTimer } from "@/lib/monitoring/api-timer";
 *   async function handler(req: NextRequest) { ... }
 *   export const GET = withApiTimer("my-endpoint", handler);
 */
export function withApiTimer(
  endpointName: string,
  handler: (req: NextRequest) => Promise<NextResponse | Response>
): (req: NextRequest) => Promise<NextResponse | Response> {
  return async (req: NextRequest) => {
    const start = Date.now();

    try {
      const response = await handler(req);
      const duration = Date.now() - start;

      // Fire-and-forget stats update
      updateTimerStats(endpointName, duration).catch(() => {});

      if (duration > SLOW_THRESHOLD_MS) {
        logger.warn(`[api-timer] Slow response: ${endpointName} took ${duration}ms`, { threshold: SLOW_THRESHOLD_MS });
      }

      return response;
    } catch (err) {
      const duration = Date.now() - start;
      updateTimerStats(endpointName, duration).catch(() => {});

      if (duration > SLOW_THRESHOLD_MS) {
        logger.warn(`[api-timer] Slow + failed response: ${endpointName} took ${duration}ms`);
      }

      throw err;
    }
  };
}

/**
 * Update aggregated timer stats in the Config table.
 */
async function updateTimerStats(endpointName: string, durationMs: number): Promise<void> {
  const key = `api_timer:${endpointName}`;

  try {
    const existing = await prisma.config.findUnique({ where: { key } });

    let stats: TimerStats;

    if (existing) {
      try {
        stats = JSON.parse(existing.value);
      } catch {
        stats = { totalRequests: 0, totalMs: 0, avgMs: 0, maxMs: 0, slowCount: 0, lastUpdated: "" };
      }
    } else {
      stats = { totalRequests: 0, totalMs: 0, avgMs: 0, maxMs: 0, slowCount: 0, lastUpdated: "" };
    }

    stats.totalRequests++;
    stats.totalMs += durationMs;
    stats.avgMs = Math.round(stats.totalMs / stats.totalRequests);
    stats.maxMs = Math.max(stats.maxMs, durationMs);
    if (durationMs > SLOW_THRESHOLD_MS) stats.slowCount++;
    stats.lastUpdated = new Date().toISOString();

    await prisma.config.upsert({
      where: { key },
      update: { value: JSON.stringify(stats) },
      create: { key, value: JSON.stringify(stats) },
    });
  } catch {
    // Don't let timer failures affect the request
  }
}
