import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getTodaysShiftHours } from "@/lib/cron/voice-tracks-hour-runner";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/voice-tracks-shifts
 *
 * Returns the list of today's shift hours so the run-all-daily orchestrator
 * can call voice-tracks-hour for each one individually.
 *
 * Auth: Bearer {CRON_SECRET}
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shifts = await getTodaysShiftHours();
  return NextResponse.json({ shifts });
}
