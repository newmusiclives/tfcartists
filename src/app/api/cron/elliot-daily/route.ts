import { NextRequest, NextResponse } from "next/server";
import { elliot } from "@/lib/ai/elliot-agent";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { logCronExecution, isCronSuspended } from "@/lib/cron/log";

export const dynamic = "force-dynamic";

/**
 * Elliot Daily Automation Cron Job
 * Runs every day at 4:50 AM
 *
 * Tasks:
 * 1. Generate daily viral content (TikTok, Reel, Story)
 * 2. Identify and engage at-risk listeners
 * 3. Welcome new listeners
 * 4. Run active campaigns
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/elliot-daily",
 *     "schedule": "0 11 * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  const _cronStart = Date.now();
  const _cronStartedAt = new Date();
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = env.CRON_SECRET;
    if (!cronSecret) {
      logger.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron attempt", { path: "/api/cron/elliot-daily" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this job is suspended
    const suspended = await isCronSuspended("elliot-daily");
    if (suspended) return suspended;

    logger.info("Starting Elliot daily automation");

    // Run Elliot's daily automation
    const results = await elliot.runDailyAutomation();

    logger.info("Elliot daily automation completed", results);

    await logCronExecution({ jobName: "elliot-daily", status: "success", duration: Date.now() - _cronStart, summary: results as Record<string, unknown>, startedAt: _cronStartedAt });

    return NextResponse.json({
      success: true,
      message: "Elliot daily automation completed",
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error("Elliot daily automation failed", { error });

    await logCronExecution({ jobName: "elliot-daily", status: "error", duration: Date.now() - _cronStart, error: error instanceof Error ? error.message : String(error), startedAt: _cronStartedAt });

    return NextResponse.json(
      {
        error: "Daily automation failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
