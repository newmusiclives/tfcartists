import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ djId: string }>;
}

/**
 * GET /api/voice-clone/[djId]
 * Check voice cloning status for a specific DJ
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { djId } = await params;
    const dj = await prisma.dJ.findUnique({
      where: { id: djId },
      select: {
        id: true,
        name: true,
        voiceProfileId: true,
        ttsVoice: true,
        ttsProvider: true,
      },
    });

    if (!dj) {
      return NextResponse.json({ error: "DJ not found." }, { status: 404 });
    }

    return NextResponse.json({
      djId: dj.id,
      djName: dj.name,
      hasClonedVoice: false,
      voiceProfileId: null,
      ttsVoice: dj.ttsVoice,
      ttsProvider: dj.ttsProvider,
    });
  } catch (error) {
    return handleApiError(error, "/api/voice-clone/[djId] GET");
  }
}

/**
 * DELETE /api/voice-clone/[djId]
 * Voice cloning is not available with the current TTS provider (Gemini).
 */
export async function DELETE(_request: NextRequest) {
  return NextResponse.json(
    { error: "Voice cloning is not available with the current TTS provider." },
    { status: 400 }
  );
}

/**
 * POST /api/voice-clone/[djId]
 * Voice cloning is not available with the current TTS provider (Gemini).
 */
export async function POST() {
  return NextResponse.json(
    { error: "Voice cloning is not available with the current TTS provider. The station uses Google Gemini for all voices." },
    { status: 400 }
  );
}
