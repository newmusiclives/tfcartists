/**
 * ElevenLabs Quota Check Cron — DEPRECATED
 *
 * The station has switched to Gemini TTS. This endpoint is kept
 * for backward compatibility with existing cron schedules but
 * performs no work.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    deprecated: true,
    message: "ElevenLabs quota check is no longer needed — station uses Gemini TTS.",
  });
}
