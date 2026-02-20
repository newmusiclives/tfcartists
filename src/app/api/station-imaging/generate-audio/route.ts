import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { amplifyPcm, pcmToWav, saveAudioFile } from "@/lib/radio/voice-track-tts";
import { mixVoiceWithMusicBed } from "@/lib/radio/audio-mixer";
import OpenAI from "openai";
import { withRateLimit } from "@/lib/rate-limit/limiter";

export const dynamic = "force-dynamic";

interface ImagingScript {
  label: string;
  text: string;
  musicBed: string;
}

interface ImagingMetadata {
  scripts?: {
    station_id?: ImagingScript[];
    sweeper?: ImagingScript[];
    promo?: ImagingScript[];
    commercial?: ImagingScript[];
  };
}

// Voice gain for imaging — boost voice so it sits clearly above the bed
const VOICE_GAIN = 2.5;

// Map music bed description keywords to MusicBed categories
function parseMusicBedCategory(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes("soft") || lower.includes("gentle") || lower.includes("mellow")) return "soft";
  if (lower.includes("upbeat") || lower.includes("energetic") || lower.includes("bright")) return "upbeat";
  if (lower.includes("country") || lower.includes("americana") || lower.includes("twang")) return "country";
  if (lower.includes("corporate") || lower.includes("professional")) return "corporate";
  return "general";
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, "ai");
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { stationId, types } = body;

    if (!stationId) {
      return NextResponse.json(
        { error: "stationId is required" },
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

    const openai = new OpenAI({ apiKey });

    const voices = await prisma.stationImagingVoice.findMany({
      where: { stationId, isActive: true },
    });

    if (voices.length === 0) {
      return NextResponse.json({
        message: "No imaging voices found",
        results: [],
      });
    }

    // Pre-load active music beds for this station (for matching by category)
    const musicBeds = await prisma.musicBed.findMany({
      where: { stationId, isActive: true },
    });

    // Which script types to generate (default: all non-commercial)
    const scriptTypes = types || ["station_id", "sweeper", "promo"];

    const voiceMap: Record<string, "onyx" | "nova"> = {
      male: "onyx",
      female: "nova",
    };

    const results: Array<{
      voiceName: string;
      type: string;
      label: string;
      success: boolean;
      audioFilePath?: string;
      hasMusicBed?: boolean;
      error?: string;
    }> = [];

    for (const voice of voices) {
      const metadata = voice.metadata as ImagingMetadata | null;
      if (!metadata?.scripts) continue;

      const openaiVoice = voiceMap[voice.voiceType] || "onyx";
      const voiceSlug = voice.displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      for (const scriptType of scriptTypes) {
        const scripts =
          metadata.scripts[scriptType as keyof typeof metadata.scripts];
        if (!scripts || scripts.length === 0) continue;

        for (const script of scripts) {
          try {
            // Generate TTS as raw PCM for mixing
            const response = await openai.audio.speech.create({
              model: "tts-1-hd",
              voice: openaiVoice,
              input: script.text,
              response_format: "pcm",
            });

            const rawPcm = Buffer.from(await response.arrayBuffer());
            const boostedPcm = amplifyPcm(rawPcm, VOICE_GAIN);

            // Try to find a matching music bed by category
            let finalPcm = boostedPcm;
            let hasMusicBed = false;

            if (musicBeds.length > 0) {
              const category = script.musicBed ? parseMusicBedCategory(script.musicBed) : "general";
              // Prefer uploaded beds (data URIs = real music), then category match, then any
              const uploadedBeds = musicBeds.filter((b) => b.filePath?.startsWith("data:"));
              const bed =
                uploadedBeds.find((b) => b.category === category) ||
                uploadedBeds[Math.floor(Math.random() * uploadedBeds.length)] ||
                musicBeds.find((b) => b.category === category) ||
                musicBeds.find((b) => b.category === "general");

              if (bed?.filePath) {
                finalPcm = mixVoiceWithMusicBed(boostedPcm, bed.filePath, {
                  voiceGain: 1.0, // already boosted
                  bedGain: 0.6,
                });
                hasMusicBed = true;
              }
            }

            const wavBuffer = pcmToWav(finalPcm);

            const safeLabel = script.label
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
            const filename = `${voiceSlug}-${scriptType}-${safeLabel}.wav`;
            const audioFilePath = saveAudioFile(wavBuffer, "imaging", filename);

            results.push({
              voiceName: voice.displayName,
              type: scriptType,
              label: script.label,
              success: true,
              audioFilePath,
              hasMusicBed,
            });
          } catch (err) {
            results.push({
              voiceName: voice.displayName,
              type: scriptType,
              label: script.label,
              success: false,
              error: err instanceof Error ? err.message : "Unknown error",
            });
          }
        }
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Generated ${succeeded} of ${results.length} imaging audio files${failed > 0 ? ` (${failed} failed)` : ""}`,
      results,
    });
  } catch (error) {
    return handleApiError(error, "/api/station-imaging/generate-audio");
  }
}
