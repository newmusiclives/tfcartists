import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationId } = body;

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

    const openai = new OpenAI({ apiKey });
    const outputDir = path.join(
      process.cwd(),
      "public",
      "audio",
      "transitions"
    );
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const results: Array<{
      id: string;
      name: string;
      success: boolean;
      audioFilePath?: string;
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

        let voice = "alloy";
        if (voiceDjId) {
          const dj = await prisma.dJ.findUnique({
            where: { id: voiceDjId },
            select: { ttsVoice: true },
          });
          if (dj?.ttsVoice) {
            voice = dj.ttsVoice;
          }
        }

        const response = await openai.audio.speech.create({
          model: "tts-1-hd",
          voice: voice as "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable" | "nova" | "onyx" | "sage" | "shimmer",
          input: transition.scriptText!,
        });

        const safeName = transition.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const partSuffix =
          transition.handoffPart !== null
            ? `-part${transition.handoffPart}`
            : "";
        const filename = `${safeName}${partSuffix}.mp3`;

        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(path.join(outputDir, filename), buffer);

        const audioFilePath = `/audio/transitions/${filename}`;
        await prisma.showTransition.update({
          where: { id: transition.id },
          data: { audioFilePath },
        });

        results.push({
          id: transition.id,
          name: transition.name,
          success: true,
          audioFilePath,
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
