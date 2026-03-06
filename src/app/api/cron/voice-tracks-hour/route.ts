import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { runVoiceTracksHour } from "@/lib/cron/voice-tracks-hour-runner";
import { logCronExecution } from "@/lib/cron/log";

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

    const result = await runVoiceTracksHour({
      stationId,
      djId,
      clockTemplateId,
      hourOfDay,
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
