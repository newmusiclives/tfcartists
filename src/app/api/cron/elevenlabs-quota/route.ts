/**
 * ElevenLabs Quota Check Cron
 *
 * Runs periodically (every 4 hours recommended) to check ElevenLabs
 * character quota. If credits are exhausted, takes the station off-air
 * and notifies the admin. If credits are restored (e.g. monthly reset),
 * automatically brings the station back on-air.
 *
 * Schedule: every 4 hours
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import {
  enforceElevenLabsQuota,
  getElevenLabsQuota,
  isStationOffAir,
} from "@/lib/elevenlabs/quota-guard";
import { logCronExecution } from "@/lib/cron/log";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  const start = Date.now();

  try {
    // Run the quota enforcement check
    const result = await enforceElevenLabsQuota();
    const quota = result.quota || await getElevenLabsQuota();
    const offAir = await isStationOffAir();

    const summary = {
      proceed: result.proceed,
      stationOffAir: offAir,
      reason: result.reason || null,
      quota: quota
        ? {
            used: quota.characterCount,
            limit: quota.characterLimit,
            remaining: quota.charactersRemaining,
            usagePercent: Math.round((quota.characterCount / quota.characterLimit) * 100),
            tier: quota.tier,
            nextReset: quota.nextResetDate,
          }
        : null,
    };

    await logCronExecution({
      jobName: "elevenlabs-quota",
      status: "success",
      duration: Date.now() - start,
      summary,
      startedAt,
    });

    logger.info("ElevenLabs quota check complete", summary);

    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await logCronExecution({
      jobName: "elevenlabs-quota",
      status: "error",
      duration: Date.now() - start,
      error: msg,
      startedAt,
    });

    logger.error("ElevenLabs quota check cron failed", { error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
