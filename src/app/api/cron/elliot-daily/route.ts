import { NextRequest, NextResponse } from "next/server";
import { elliot } from "@/lib/ai/elliot-agent";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

/**
 * Elliot Daily Automation Cron Job
 * Runs every day at 11:00 AM
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

    logger.info("Starting Elliot daily automation");

    // Run Elliot's daily automation
    const results = await elliot.runDailyAutomation();

    logger.info("Elliot daily automation completed", results);

    return NextResponse.json({
      success: true,
      message: "Elliot daily automation completed",
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error("Elliot daily automation failed", { error });

    return NextResponse.json(
      {
        error: "Daily automation failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
