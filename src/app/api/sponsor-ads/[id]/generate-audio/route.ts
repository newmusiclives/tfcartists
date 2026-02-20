import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import {
  amplifyPcm,
  pcmToWav,
  saveAudioFile,
} from "@/lib/radio/voice-track-tts";
import { mixVoiceWithMusicBed } from "@/lib/radio/audio-mixer";
import OpenAI from "openai";
import { withRateLimit } from "@/lib/rate-limit/limiter";

export const dynamic = "force-dynamic";

// Map imaging voice type to OpenAI TTS voice (matches bulk generate-audio route)
const voiceMap: Record<string, string> = {
  male: "onyx",
  female: "nova",
};

// Voice gain — boost TTS voice so it sits above the music bed
const VOICE_GAIN = 1.8;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await withRateLimit(request, "ai");
    if (rateLimited) return rateLimited;

    const { id } = await params;

    const ad = await prisma.sponsorAd.findUnique({
      where: { id },
      include: { musicBed: true },
    });

    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    if (!ad.scriptText) {
      return NextResponse.json(
        { error: "Ad has no scriptText to generate audio from" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Pick voice from station's imaging voice settings
    let openaiVoice = "onyx";
    const imagingVoice = await prisma.stationImagingVoice.findFirst({
      where: { stationId: ad.stationId, isActive: true },
    });
    if (imagingVoice) {
      openaiVoice = voiceMap[imagingVoice.voiceType] || "onyx";
    }

    // Generate TTS as raw PCM so we can boost the voice volume
    const openai = new OpenAI({ apiKey });
    const response = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: openaiVoice as "onyx" | "nova" | "alloy" | "echo" | "fable" | "shimmer",
      input: ad.scriptText,
      response_format: "pcm",
    });

    const rawPcm = Buffer.from(await response.arrayBuffer());
    const boostedPcm = amplifyPcm(rawPcm, VOICE_GAIN);

    // Mix with music bed if the ad has one assigned
    let finalPcm = boostedPcm;
    if (ad.musicBed?.filePath) {
      finalPcm = mixVoiceWithMusicBed(boostedPcm, ad.musicBed.filePath, {
        voiceGain: 1.0, // voice already boosted by VOICE_GAIN
        bedGain: 0.25,
      });
    }

    const wavBuffer = pcmToWav(finalPcm);

    const safeName = ad.adTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `ad-${safeName}-${id.slice(-6)}.wav`;
    const audioFilePath = saveAudioFile(wavBuffer, "commercials", filename);

    // Estimate duration from PCM length (24kHz, 16-bit mono = 48000 bytes/sec)
    const durationSeconds = Math.round((finalPcm.length / 48000) * 10) / 10;

    const updatedAd = await prisma.sponsorAd.update({
      where: { id },
      data: { audioFilePath, durationSeconds },
      include: { musicBed: true },
    });

    return NextResponse.json({ ad: updatedAd });
  } catch (error) {
    return handleApiError(error, "/api/sponsor-ads/[id]/generate-audio");
  }
}
