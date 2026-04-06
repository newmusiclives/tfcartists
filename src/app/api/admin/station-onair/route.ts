/**
 * Admin: Station on-air status.
 * GET  — check current status (always on-air now that ElevenLabs quota is gone)
 * POST — no-op, kept for backward compatibility
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    stationOffAir: false,
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Station is on-air. Gemini TTS has no quota restrictions.",
  });
}
