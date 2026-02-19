import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/errors";
import { generateVoiceTrackAudio } from "@/lib/radio/voice-track-tts";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hourPlaylistId } = body;

    if (!hourPlaylistId) {
      return NextResponse.json(
        { error: "hourPlaylistId is required" },
        { status: 400 }
      );
    }

    const result = await generateVoiceTrackAudio(hourPlaylistId);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "/api/voice-tracks/generate-audio");
  }
}
