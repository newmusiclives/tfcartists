import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { runVoiceTracksHour } from "@/lib/cron/voice-tracks-hour-runner";
import { logCronExecution } from "@/lib/cron/log";
import { stationToday } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/voice-tracks-hour?stationId=X&djId=Y&clockTemplateId=Z&hour=H
 *
 * Processes a SINGLE hour of voice track generation.
 * Designed to complete within Netlify's 30-second timeout.
 *
 * Call this repeatedly (one hour at a time) instead of the daily endpoint
 * which tries to process all hours at once and times out.
 */
export async function GET(req: NextRequest) {
  const start = Date.now();
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const stationId = searchParams.get("stationId");
    const djId = searchParams.get("djId");
    const clockTemplateId = searchParams.get("clockTemplateId");
    const hour = searchParams.get("hour");

    if (!stationId || !djId || !clockTemplateId || hour === null) {
      return NextResponse.json(
        { error: "Missing required params: stationId, djId, clockTemplateId, hour" },
        { status: 400 }
      );
    }

    const hourOfDay = parseInt(hour, 10);
    if (isNaN(hourOfDay) || hourOfDay < 0 || hourOfDay > 23) {
      return NextResponse.json({ error: "Invalid hour (0-23)" }, { status: 400 });
    }

    // Gather songs from already-locked playlists for this DJ today
    // to prevent cross-hour repeats when processing hours individually
    const today = stationToday();
    const lockedPlaylists = await prisma.hourPlaylist.findMany({
      where: {
        stationId,
        djId,
        airDate: today,
        hourOfDay: { not: hourOfDay },
        status: { in: ["locked", "aired"] },
      },
      select: { slots: true },
    });

    const excludeSongIds = new Set<string>();
    for (const lp of lockedPlaylists) {
      if (!lp.slots) continue;
      const lpSlots: Array<{ songId?: string }> = JSON.parse(
        typeof lp.slots === "string" ? lp.slots : JSON.stringify(lp.slots)
      );
      for (const slot of lpSlots) {
        if (slot.songId) excludeSongIds.add(slot.songId);
      }
    }

    const result = await runVoiceTracksHour({
      stationId,
      djId,
      clockTemplateId,
      hourOfDay,
      excludeSongIds,
    });

    await logCronExecution({
      jobName: `voice-tracks-hour-${hourOfDay}`,
      status: result.success ? "success" : "error",
      duration: Date.now() - start,
      summary: result as unknown as Record<string, unknown>,
      startedAt: new Date(start),
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    logger.error("Voice-tracks-hour cron failed", { error });
    return NextResponse.json(
      { error: "Voice tracks hour processing failed" },
      { status: 500 }
    );
  }
}
