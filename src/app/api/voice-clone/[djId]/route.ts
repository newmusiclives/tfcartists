import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getConfig } from "@/lib/config";
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
        voiceStability: true,
        voiceSimilarityBoost: true,
      },
    });

    if (!dj) {
      return NextResponse.json({ error: "DJ not found." }, { status: 404 });
    }

    const hasClonedVoice = !!dj.voiceProfileId;

    return NextResponse.json({
      djId: dj.id,
      djName: dj.name,
      hasClonedVoice,
      voiceProfileId: dj.voiceProfileId,
      ttsVoice: dj.ttsVoice,
      ttsProvider: dj.ttsProvider,
      voiceStability: dj.voiceStability,
      voiceSimilarityBoost: dj.voiceSimilarityBoost,
    });
  } catch (error) {
    return handleApiError(error, "/api/voice-clone/[djId] GET");
  }
}

/**
 * DELETE /api/voice-clone/[djId]
 * Remove cloned voice from ElevenLabs and clear DJ's voiceProfileId
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { djId } = await params;
    const dj = await prisma.dJ.findUnique({
      where: { id: djId },
      select: { id: true, name: true, voiceProfileId: true },
    });

    if (!dj) {
      return NextResponse.json({ error: "DJ not found." }, { status: 404 });
    }

    if (!dj.voiceProfileId) {
      return NextResponse.json(
        { error: "This DJ does not have a cloned voice." },
        { status: 400 }
      );
    }

    // Try to delete from ElevenLabs
    const apiKey = await getConfig("ELEVENLABS_API_KEY");
    if (apiKey) {
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/voices/${dj.voiceProfileId}`,
          {
            method: "DELETE",
            headers: { "xi-api-key": apiKey },
          }
        );
        if (!response.ok && response.status !== 404) {
          // Log but don't fail — we still want to clear the local reference
          console.warn(
            `ElevenLabs voice deletion returned ${response.status}`
          );
        }
      } catch (err) {
        console.warn("Failed to delete voice from ElevenLabs:", err);
      }
    }

    // Clear DJ voice fields
    await prisma.dJ.update({
      where: { id: djId },
      data: {
        voiceProfileId: null,
        ttsProvider: "openai",
      },
    });

    return NextResponse.json({
      message: `Cloned voice removed from ${dj.name}. DJ reverted to default TTS.`,
    });
  } catch (error) {
    return handleApiError(error, "/api/voice-clone/[djId] DELETE");
  }
}

/**
 * POST /api/voice-clone/[djId]
 * Generate a test speech sample using the DJ's cloned voice
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { djId } = await params;
    const body = await request.json();
    const text =
      body.text ||
      "Hey there, you're listening to TrueFans Radio. Stay tuned, we've got great music coming up next.";

    const dj = await prisma.dJ.findUnique({
      where: { id: djId },
      select: {
        id: true,
        name: true,
        voiceProfileId: true,
        voiceStability: true,
        voiceSimilarityBoost: true,
      },
    });

    if (!dj) {
      return NextResponse.json({ error: "DJ not found." }, { status: 404 });
    }

    if (!dj.voiceProfileId) {
      return NextResponse.json(
        { error: "This DJ does not have a cloned voice. Upload a sample first." },
        { status: 400 }
      );
    }

    const apiKey = await getConfig("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key is not configured." },
        { status: 400 }
      );
    }

    // Generate speech with cloned voice
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${dj.voiceProfileId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: dj.voiceStability ?? 0.75,
            similarity_boost: dj.voiceSimilarityBoost ?? 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg =
        errorData?.detail?.message ||
        errorData?.detail ||
        `ElevenLabs TTS error (${response.status})`;
      return NextResponse.json(
        { error: `Voice preview failed: ${msg}` },
        { status: 502 }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      audio: `data:audio/mpeg;base64,${base64Audio}`,
      text,
      djName: dj.name,
    });
  } catch (error) {
    return handleApiError(error, "/api/voice-clone/[djId] POST");
  }
}
