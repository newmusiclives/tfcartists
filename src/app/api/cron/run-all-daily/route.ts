import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes — these jobs can take a while

const DAILY_JOBS = [
  "features-daily",
  "parker-daily",
  "cassidy-daily",
  "riley-daily",
  "harper-daily",
  "elliot-daily",
  "voice-tracks-daily",
];

/**
 * GET /api/cron/run-all-daily
 *
 * Orchestrator that runs all daily cron jobs in sequence.
 * Designed for external cron services (cron-job.org, etc.) on the free Netlify plan.
 *
 * Auth: Bearer {CRON_SECRET}
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const cronSecret = env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.URL || process.env.NEXTAUTH_URL || "https://truefans-radio.netlify.app";
  const results: Record<string, { status: number; duration: number; ok: boolean; error?: string }> = {};

  for (const job of DAILY_JOBS) {
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}/api/cron/${job}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${cronSecret}` },
      });
      results[job] = {
        status: res.status,
        duration: Date.now() - start,
        ok: res.ok,
      };
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        results[job].error = body.slice(0, 200);
      }
    } catch (err) {
      results[job] = {
        status: 0,
        duration: Date.now() - start,
        ok: false,
        error: String(err).slice(0, 200),
      };
    }
  }

  const allOk = Object.values(results).every((r) => r.ok);
  const totalDuration = Object.values(results).reduce((s, r) => s + r.duration, 0);

  return NextResponse.json({
    success: allOk,
    totalDuration,
    timestamp: new Date().toISOString(),
    results,
  });
}
