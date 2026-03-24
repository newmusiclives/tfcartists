import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { runVoiceTracksDaily } from "@/lib/cron/voice-tracks-daily-runner";
import { logCronExecution } from "@/lib/cron/log";
import { withCronLock } from "@/lib/cron/lock";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify cron secret
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

  return withCronLock("voice-tracks-daily", async () => {
    const _cronStart = Date.now();
    const _cronStartedAt = new Date();
    try {
      const result = await runVoiceTracksDaily();
      await logCronExecution({ jobName: "voice-tracks-daily", status: result.success ? "success" : "error", duration: Date.now() - _cronStart, summary: result as unknown as Record<string, unknown>, startedAt: _cronStartedAt });
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    } catch (error) {
      logger.error("Voice-tracks-daily cron failed", { error });
      await logCronExecution({ jobName: "voice-tracks-daily", status: "error", duration: Date.now() - _cronStart, error: error instanceof Error ? error.message : String(error), startedAt: _cronStartedAt });
      return NextResponse.json({ error: "Voice tracks daily cron failed", details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined }, { status: 500 });
    }
  });
}
