import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/errors";
import { generateVoiceTrackScripts } from "@/lib/radio/voice-track-generator";
import { withRateLimit } from "@/lib/rate-limit/limiter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, "ai");
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { hourPlaylistId } = body;

    if (!hourPlaylistId) {
      return NextResponse.json(
        { error: "hourPlaylistId is required" },
        { status: 400 }
      );
    }

    const result = await generateVoiceTrackScripts(hourPlaylistId);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "/api/voice-tracks/generate");
  }
}
