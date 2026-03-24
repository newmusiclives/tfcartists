import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const DAILY_JOBS = [
  "features-daily",
  "parker-daily",
  "cassidy-daily",
  "riley-daily",
  "harper-daily",
  "elliot-daily",
  "feature-audio",
];

/**
 * GET /api/cron/run-all-daily
 *
 * Orchestrator that runs all daily cron jobs in sequence.
 * Designed for external cron services (cron-job.org, etc.) on the free Netlify plan.
 *
 * Voice tracks are processed per-hour via voice-tracks-shifts + voice-tracks-hour
 * to avoid Netlify's 30-second function timeout.
 *
 * Auth: Bearer {CRON_SECRET}
 */
export async function GET(req: NextRequest) {
  const cronSecret = env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.URL || process.env.NEXTAUTH_URL || "https://truefans-radio.netlify.app";
  const results: Record<string, { status: number; duration: number; ok: boolean; error?: string }> = {};

  // Run standard daily jobs
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

  // Voice tracks: get today's shift hours and process each individually.
  // This avoids the 30s Netlify timeout by processing one hour at a time
  // instead of calling voice-tracks-daily which does all hours in one request.
  const vtStart = Date.now();
  try {
    const shiftRes = await fetch(`${baseUrl}/api/cron/voice-tracks-shifts`, {
      method: "GET",
      headers: { Authorization: `Bearer ${cronSecret}` },
    });

    if (shiftRes.ok) {
      const { shifts } = await shiftRes.json();
      let vtOk = true;
      let vtProcessed = 0;

      for (const shift of shifts || []) {
        try {
          const params = new URLSearchParams({
            stationId: shift.stationId,
            djId: shift.djId,
            clockTemplateId: shift.clockTemplateId,
            hour: String(shift.hourOfDay),
          });
          const hourRes = await fetch(`${baseUrl}/api/cron/voice-tracks-hour?${params}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${cronSecret}` },
          });
          if (!hourRes.ok) vtOk = false;
          vtProcessed++;
        } catch {
          vtOk = false;
        }
      }

      results["voice-tracks"] = {
        status: vtOk ? 200 : 500,
        duration: Date.now() - vtStart,
        ok: vtOk,
        ...(vtOk ? {} : { error: `Some hours failed (${vtProcessed}/${(shifts || []).length} processed)` }),
      };
    } else {
      results["voice-tracks"] = {
        status: shiftRes.status,
        duration: Date.now() - vtStart,
        ok: false,
        error: "Failed to get shift hours",
      };
    }
  } catch (err) {
    results["voice-tracks"] = {
      status: 0,
      duration: Date.now() - vtStart,
      ok: false,
      error: String(err).slice(0, 200),
    };
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
