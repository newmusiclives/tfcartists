import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini, generateWithOpenAI } from "@/lib/radio/voice-track-tts";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice-preview
 * Generate a short TTS voice demo and return it as a base64 data URI.
 * Body: { voice, provider, voiceDirection?, text? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const voice = body.voice || "Leda";
    const provider = body.provider || "gemini";
    const voiceDirection = body.voiceDirection || null;
    const text =
      body.text ||
      `Hey there, you're listening to the best music around. Stay tuned, we've got some great tracks coming up next.`;

    let buffer: Buffer;
    let ext: string;

    if (provider === "gemini" || provider === "elevenlabs") {
      ({ buffer, ext } = await generateWithGemini(text, voice, voiceDirection));
    } else {
      ({ buffer, ext } = await generateWithOpenAI(text, voice));
    }

    const mimeType = ext === "wav" ? "audio/wav" : "audio/mpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    return NextResponse.json({ audio: dataUri });
  } catch (error) {
    return handleApiError(error, "/api/voice-preview");
  }
}
