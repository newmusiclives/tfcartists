import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

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

    let voice = "alloy"; // default fallback
    if (voiceDjId) {
      const dj = await prisma.dJ.findUnique({
        where: { id: voiceDjId },
        select: { ttsVoice: true },
      });
      if (dj?.ttsVoice) {
        voice = dj.ttsVoice;
      }
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: voice as "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable" | "nova" | "onyx" | "sage" | "shimmer",
      input: transition.scriptText,
    });

    // Save the audio file
    const outputDir = path.join(
      process.cwd(),
      "public",
      "audio",
      "transitions"
    );
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Build filename: sanitize the transition name
    const safeName = transition.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const partSuffix =
      transition.handoffPart !== null ? `-part${transition.handoffPart}` : "";
    const filename = `${safeName}${partSuffix}.mp3`;

    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Update database
    const audioFilePath = `/audio/transitions/${filename}`;
    await prisma.showTransition.update({
      where: { id },
      data: { audioFilePath },
    });

    return NextResponse.json({ audioFilePath, voice, filename });
  } catch (error) {
    return handleApiError(
      error,
      "/api/show-transitions/[id]/generate-audio"
    );
  }
}
