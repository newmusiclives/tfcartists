import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice-clone
 * Voice cloning is not available with the current TTS provider (Gemini).
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Voice cloning is not available with the current TTS provider. The station uses Google Gemini for all voices.",
    },
    { status: 400 }
  );
}

/**
 * GET /api/voice-clone
 * List all DJs with their voice cloning status
 */
export async function GET() {
  try {
    const djs = await prisma.dJ.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        voiceProfileId: true,
        ttsVoice: true,
        ttsProvider: true,
        photoUrl: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      djs,
      elevenlabsConfigured: false,
    });
  } catch (error) {
    return handleApiError(error, "/api/voice-clone");
  }
}
