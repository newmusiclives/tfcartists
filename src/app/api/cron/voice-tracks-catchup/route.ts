import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { generateSingleVoiceTrackAudio } from "@/lib/radio/voice-track-tts";
import { logCronExecution } from "@/lib/cron/log";
import { stationToday } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/voice-tracks-catchup
 *
 * Catch-up cron that processes leftover voice tracks stuck at "script_ready".
 * Processes tracks ONE AT A TIME to stay within serverless timeouts.
 * Designed to be called every 5-10 minutes via external cron (e.g., cron-job.org).
 *
 * Optional query params:
 *   - limit: max tracks to process per call (default 3)
 *   - date: target date YYYY-MM-DD (default today)
 *   - force: if "true", also re-process audio_ready tracks (for fixing corrupted audio)
 */
export async function GET(req: NextRequest) {
  const start = Date.now();
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "3", 10), 10);
    const dateParam = searchParams.get("date");
    const force = searchParams.get("force") === "true";
    const airDate = dateParam ? new Date(dateParam + "T00:00:00.000Z") : stationToday();

    // When force=true, reset audio_ready tracks back to script_ready
    // so they get regenerated (used to fix corrupted audio)
    if (force) {
      const resetCount = await prisma.voiceTrack.updateMany({
        where: {
          airDate,
          status: "audio_ready",
          scriptText: { not: null },
        },
        data: { status: "script_ready", audioFilePath: null, audioDuration: null },
      });
      logger.info(`Catchup force mode: reset ${resetCount.count} audio_ready tracks to script_ready`);
    }

    // Find voice tracks stuck at script_ready for the target date
    const stuckTracks = await prisma.voiceTrack.findMany({
      where: {
        airDate,
        status: "script_ready",
        scriptText: { not: null },
      },
      orderBy: [
        { hourOfDay: "asc" },
        { position: "asc" },
      ],
      take: limit,
      select: {
        id: true,
        hourOfDay: true,
        position: true,
        djId: true,
      },
    });

    if (stuckTracks.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No stuck tracks to process",
        processed: 0,
        remaining: 0,
      });
    }

    // Also count total remaining for reporting
    const totalRemaining = await prisma.voiceTrack.count({
      where: { airDate, status: "script_ready", scriptText: { not: null } },
    });

    const results: Array<{ id: string; hour: number; pos: number; success: boolean; error?: string }> = [];

    for (const track of stuckTracks) {
      const result = await generateSingleVoiceTrackAudio(track.id);
      results.push({
        id: track.id,
        hour: track.hourOfDay,
        pos: track.position,
        success: result.success,
        error: result.error,
      });
      logger.info(`Catchup: VT ${track.id} hour=${track.hourOfDay} pos=${track.position} → ${result.success ? "OK" : result.error}`);
    }

    const processed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    await logCronExecution({
      jobName: "voice-tracks-catchup",
      status: failed === results.length ? "error" : "success",
      duration: Date.now() - start,
      summary: { processed, failed, remaining: totalRemaining - processed, results } as unknown as Record<string, unknown>,
      startedAt: new Date(start),
    });

    return NextResponse.json({
      success: true,
      processed,
      failed,
      remaining: totalRemaining - processed,
      results,
      durationMs: Date.now() - start,
    });
  } catch (error) {
    logger.error("Voice-tracks-catchup cron failed", { error });

    await logCronExecution({
      jobName: "voice-tracks-catchup",
      status: "error",
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
      startedAt: new Date(start),
    });

    return NextResponse.json(
      { error: "Catchup cron failed" },
      { status: 500 },
    );
  }
}
