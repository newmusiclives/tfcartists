/**
 * Admin: Bring station back on-air manually.
 * GET  — check current status
 * POST — bring station on-air (resumes all crons)
 */

import { NextResponse } from "next/server";
import { isStationOffAir, bringStationOnAir, getElevenLabsQuota } from "@/lib/elevenlabs/quota-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const offAir = await isStationOffAir();
  const quota = await getElevenLabsQuota();
  return NextResponse.json({
    stationOffAir: offAir,
    quota: quota ? {
      used: quota.characterCount,
      limit: quota.characterLimit,
      remaining: quota.charactersRemaining,
      tier: quota.tier,
      nextReset: quota.nextResetDate,
    } : null,
  });
}

export async function POST() {
  await bringStationOnAir();
  return NextResponse.json({
    success: true,
    message: "Station brought back on-air. All cron jobs resumed.",
  });
}
