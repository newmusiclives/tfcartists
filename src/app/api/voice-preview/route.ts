import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini, generateWithOpenAI } from "@/lib/radio/voice-track-tts";
import { handleApiError } from "@/lib/api/errors";
import { getConfig, clearConfigCache } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/voice-preview?debug=1
 * Diagnostic endpoint — returns where GOOGLE_API_KEY is being read from.
 *
 * GET /api/voice-preview?clearDbKey=1
 * Deletes the GOOGLE_API_KEY entry from the SystemConfig table so the
 * code falls back to the environment variable.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (params.get("clearDbKey") === "1") {
    const { prisma } = await import("@/lib/db");
    const deleted = await prisma.systemConfig.deleteMany({ where: { key: "GOOGLE_API_KEY" } });
    clearConfigCache();
    return NextResponse.json({ success: true, deleted: deleted.count });
  }

  if (params.get("debug") !== "1") {
    return NextResponse.json({ error: "Use ?debug=1 or ?clearDbKey=1" }, { status: 400 });
  }
  clearConfigCache();
  const dbKey = await getConfig("GOOGLE_API_KEY");
  const envKey = process.env.GOOGLE_API_KEY;
  const mask = (k: string | undefined) =>
    k ? `${k.slice(0, 6)}...${k.slice(-4)} (len ${k.length})` : "(not set)";
  return NextResponse.json({
    fromGetConfig: mask(dbKey),
    fromEnv: mask(envKey),
    note: "generateWithGemini now reads env first, then db (env wins if set)",
  });
}

/**
 * POST /api/voice-preview
 * Generate a short TTS voice demo and return it as a base64 data URI.
 * Body: { voice, provider, voiceDirection?, text? }
 */
export async function POST(request: NextRequest) {
  try {
    // Always clear cache so a freshly-saved key is picked up immediately
    clearConfigCache();

    const body = await request.json();
    const voice = body.voice || "Leda";
    const provider = body.provider || "gemini";
    const voiceDirection = body.voiceDirection || null;
    const text =
      body.text ||
      `Hey there, you're listening to the best music around. Stay tuned, we've got some great tracks coming up next.`;

    let buffer: Buffer;
    let ext: string;

    if (provider === "elevenlabs") {
      throw new Error("ElevenLabs TTS is no longer supported — use Gemini");
    }
    if (provider === "gemini") {
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
