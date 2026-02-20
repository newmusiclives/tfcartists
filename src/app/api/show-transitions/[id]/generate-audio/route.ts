import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import {
  generateWithOpenAI,
  generateWithGemini,
  saveAudioFile,
} from "@/lib/radio/voice-track-tts";
import { withRateLimit } from "@/lib/rate-limit/limiter";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await withRateLimit(request, "ai");
    if (rateLimited) return rateLimited;

    const { id } = await params;

    const transition = await prisma.showTransition.findUnique({
      where: { id },
    });
    if (!transition) {
      return NextResponse.json(
        { error: "Transition not found" },
        { status: 404 }
      );
    }

    if (!transition.scriptText) {
      return NextResponse.json(
        { error: "No script text to generate audio from" },
        { status: 400 }
      );
    }

    // Determine which DJ voice to use
    // For handoff groups: part 1 uses fromDj voice, part 2 uses toDj voice
    let voiceDjId: string | null = null;
    if (transition.handoffPart === 1 && transition.fromDjId) {
      voiceDjId = transition.fromDjId;
    } else if (transition.handoffPart === 2 && transition.toDjId) {
      voiceDjId = transition.toDjId;
    } else if (transition.fromDjId) {
      voiceDjId = transition.fromDjId;
    } else if (transition.toDjId) {
      voiceDjId = transition.toDjId;
    }

    let voice = "alloy";
    let provider = "openai";
    if (voiceDjId) {
      const dj = await prisma.dJ.findUnique({
        where: { id: voiceDjId },
        select: { ttsVoice: true, ttsProvider: true },
      });
      if (dj?.ttsVoice) {
        voice = dj.ttsVoice;
      }
      if (dj?.ttsProvider) {
        provider = dj.ttsProvider;
      }
    }

    let buffer: Buffer;
    let ext: string;

    if (provider === "gemini") {
      ({ buffer, ext } = await generateWithGemini(transition.scriptText, voice));
    } else {
      ({ buffer, ext } = await generateWithOpenAI(transition.scriptText, voice));
    }

    // Build filename
    const safeName = transition.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const partSuffix =
      transition.handoffPart !== null ? `-part${transition.handoffPart}` : "";
    const filename = `${safeName}${partSuffix}.${ext}`;

    const audioFilePath = saveAudioFile(buffer, "transitions", filename);

    // Try to persist to DB (fails on read-only SQLite in serverless)
    try {
      await prisma.showTransition.update({
        where: { id },
        data: { audioFilePath },
      });
    } catch {
      // DB is read-only on Netlify — audio still returned in response
    }

    return NextResponse.json({ audioFilePath, voice, provider, filename });
  } catch (error) {
    return handleApiError(
      error,
      "/api/show-transitions/[id]/generate-audio"
    );
  }
}
