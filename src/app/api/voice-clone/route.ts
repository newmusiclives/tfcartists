import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice-clone
 * Clone a voice using ElevenLabs API and assign it to a DJ.
 * Accepts multipart form data: djId, audioFile, voiceName, description
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = await getConfig("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "ElevenLabs API key is not configured. Go to Admin > Settings and add your ELEVENLABS_API_KEY to enable voice cloning.",
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const djId = formData.get("djId") as string;
    const audioFile = formData.get("audioFile") as File | null;
    const voiceName = formData.get("voiceName") as string;
    const description = (formData.get("description") as string) || "";

    if (!djId || !audioFile || !voiceName) {
      return NextResponse.json(
        { error: "djId, audioFile, and voiceName are required." },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "audio/wav",
      "audio/x-wav",
      "audio/mpeg",
      "audio/mp3",
    ];
    if (!validTypes.includes(audioFile.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Please upload a WAV or MP3 file.",
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Verify DJ exists
    const dj = await prisma.dJ.findUnique({ where: { id: djId } });
    if (!dj) {
      return NextResponse.json({ error: "DJ not found." }, { status: 404 });
    }

    // Build multipart form for ElevenLabs
    const elevenLabsForm = new FormData();
    elevenLabsForm.append("name", voiceName);
    elevenLabsForm.append("description", description);

    // Convert File to Blob for the ElevenLabs API
    const arrayBuffer = await audioFile.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: audioFile.type });
    elevenLabsForm.append("files", blob, audioFile.name || "sample.wav");

    // Call ElevenLabs voice cloning API
    const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: elevenLabsForm,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg =
        errorData?.detail?.message ||
        errorData?.detail ||
        errorData?.message ||
        `ElevenLabs API error (${response.status})`;
      return NextResponse.json(
        { error: `Voice cloning failed: ${msg}` },
        { status: 502 }
      );
    }

    const result = await response.json();
    const voiceId = result.voice_id;

    if (!voiceId) {
      return NextResponse.json(
        { error: "ElevenLabs did not return a voice ID." },
        { status: 502 }
      );
    }

    // Update DJ record
    await prisma.dJ.update({
      where: { id: djId },
      data: {
        voiceProfileId: voiceId,
        ttsProvider: "elevenlabs",
      },
    });

    return NextResponse.json({
      voiceId,
      voiceName,
      message: `Voice "${voiceName}" cloned successfully and assigned to ${dj.name}.`,
    });
  } catch (error) {
    return handleApiError(error, "/api/voice-clone");
  }
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

    const apiKey = await getConfig("ELEVENLABS_API_KEY");

    return NextResponse.json({
      djs,
      elevenlabsConfigured: !!apiKey,
    });
  } catch (error) {
    return handleApiError(error, "/api/voice-clone");
  }
}
