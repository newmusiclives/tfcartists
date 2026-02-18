import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

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

function saveAudioFile(buffer: Buffer, filename: string): string {
  try {
    const outputDir = path.join(
      process.cwd(),
      "public",
      "audio",
      "imaging"
    );
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outputDir, filename), buffer);
    return `/audio/imaging/${filename}`;
  } catch {
    return `data:audio/mpeg;base64,${buffer.toString("base64")}`;
  }
}

export async function POST(request: NextRequest) {
  try {
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
            const response = await openai.audio.speech.create({
              model: "tts-1-hd",
              voice: openaiVoice,
              input: script.text,
            });

            const buffer = Buffer.from(await response.arrayBuffer());
            const safeLabel = script.label
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
            const filename = `${voiceSlug}-${scriptType}-${safeLabel}.mp3`;
            const audioFilePath = saveAudioFile(buffer, filename);

            results.push({
              voiceName: voice.displayName,
              type: scriptType,
              label: script.label,
              success: true,
              audioFilePath,
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
