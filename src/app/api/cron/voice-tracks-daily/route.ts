import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { runVoiceTracksDaily } from "@/lib/cron/voice-tracks-daily-runner";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === "development";

    // Verify cron secret (skip in development)
    if (!isDev) {
      const authHeader = req.headers.get("authorization");
      const cronSecret = env.CRON_SECRET;
      if (!cronSecret) {
        logger.error("CRON_SECRET not configured");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
      }
      if (authHeader !== `Bearer ${cronSecret}`) {
        logger.warn("Unauthorized cron attempt", { path: "/api/cron/voice-tracks-daily" });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await runVoiceTracksDaily();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    logger.error("Voice-tracks-daily cron failed", { error });
    return NextResponse.json(
      {
        error: "Voice tracks daily cron failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
