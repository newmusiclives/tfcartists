import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { getTodaysShiftHours } from "@/lib/cron/voice-tracks-hour-runner";
import { logCronExecution } from "@/lib/cron/log";
import { stationToday } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/voice-tracks-dispatch
 *
 * Lightweight dispatcher: returns today's shift hours and which ones
 * still need processing. Does NOT do any heavy work — just queries the DB.
 *
 * Use this to:
 * 1. See what hours need voice track generation
 * 2. Feed the list to scripts/run-voice-tracks.ts or cron-job.org
 */
export async function GET(req: NextRequest) {
  const start = Date.now();
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hours = await getTodaysShiftHours();
    const pending = hours.filter((h) => !h.alreadyLocked);
    const locked = hours.filter((h) => h.alreadyLocked);

    await logCronExecution({
      jobName: "voice-tracks-dispatch",
      status: "success",
      duration: Date.now() - start,
      summary: { totalHours: hours.length, pending: pending.length, locked: locked.length } as any,
      startedAt: new Date(start),
    });

    return NextResponse.json({
      success: true,
      date: stationToday().toISOString().split("T")[0],
      totalHours: hours.length,
      pendingHours: pending.length,
      lockedHours: locked.length,
      pending: pending.map((h) => ({
        djId: h.djId,
        djName: h.djName,
        clockTemplateId: h.clockTemplateId,
        hourOfDay: h.hourOfDay,
        stationId: h.stationId,
      })),
    });
  } catch (error) {
    logger.error("Voice-tracks-dispatch failed", { error });
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}
