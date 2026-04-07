import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import * as fs from "fs";
import * as path from "path";
import { withRateLimit } from "@/lib/rate-limit/limiter";
import { generateWithGemini as generateWithGeminiShared } from "@/lib/radio/voice-track-tts";

export const dynamic = "force-dynamic";

/** Convert raw PCM (24kHz, 16-bit, mono) to a WAV buffer */
function pcmToWav(pcm: Buffer): Buffer {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcm.length;
  const headerSize = 44;

  const header = Buffer.alloc(headerSize);
  header.write("RIFF", 0);
  header.writeUInt32LE(dataSize + headerSize - 8, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

function saveAudioFile(buffer: Buffer, filename: string): string {
  try {
    const outputDir = path.join(
      process.cwd(),
      "public",
      "audio",
      "transitions"
    );
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outputDir, filename), buffer);
    return `/audio/transitions/${filename}`;
  } catch {
    // Serverless (Netlify) — read-only filesystem, store as data URI
    return `data:audio/mpeg;base64,${buffer.toString("base64")}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, "ai");
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { stationId } = body;

    if (!stationId) {
      return NextResponse.json(
        { error: "stationId is required" },
        { status: 400 }
      );
    }

    // Find all transitions with scripts but no audio
    const transitions = await prisma.showTransition.findMany({
      where: {
        stationId,
        scriptText: { not: null },
        OR: [{ audioFilePath: null }, { audioFilePath: "" }],
      },
      orderBy: [{ handoffGroupId: "asc" }, { handoffPart: "asc" }],
    });

    if (transitions.length === 0) {
      return NextResponse.json({
        message: "No transitions need audio generation",
        results: [],
      });
    }

    const results: Array<{
      id: string;
      name: string;
      success: boolean;
      audioFilePath?: string;
      provider?: string;
      error?: string;
    }> = [];

    // Process sequentially to avoid rate limits
    for (const transition of transitions) {
      try {
        // Determine voice
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

        // Always use Gemini — even legacy openai/elevenlabs DJs are
        // routed through Gemini per the April 2026 migration.
        let voice = "Leda";
        let voiceDesc: string | null = null;
        if (voiceDjId) {
          const dj = await prisma.dJ.findUnique({
            where: { id: voiceDjId },
            select: { ttsVoice: true, voiceDescription: true },
          });
          if (dj?.ttsVoice) voice = dj.ttsVoice;
          voiceDesc = dj?.voiceDescription || null;
        }

        const { buffer, ext } = await generateWithGeminiShared(
          transition.scriptText!,
          voice,
          voiceDesc,
        );
        const provider = "gemini";

        const safeName = transition.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const partSuffix =
          transition.handoffPart !== null
            ? `-part${transition.handoffPart}`
            : "";
        const filename = `${safeName}${partSuffix}.${ext}`;

        const audioFilePath = saveAudioFile(buffer, filename);

        try {
          await prisma.showTransition.update({
            where: { id: transition.id },
            data: { audioFilePath },
          });
        } catch {
          // DB is read-only on Netlify — audio still returned in response
        }

        results.push({
          id: transition.id,
          name: transition.name,
          success: true,
          audioFilePath,
          provider,
        });
      } catch (err) {
        results.push({
          id: transition.id,
          name: transition.name,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Generated ${succeeded} of ${results.length} transition audio files${failed > 0 ? ` (${failed} failed)` : ""}`,
      results,
    });
  } catch (error) {
    return handleApiError(
      error,
      "/api/show-transitions/generate-audio-bulk"
    );
  }
}
