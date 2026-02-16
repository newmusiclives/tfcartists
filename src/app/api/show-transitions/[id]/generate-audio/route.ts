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

    const buffer = Buffer.from(await response.arrayBuffer());

    // Build filename
    const safeName = transition.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const partSuffix =
      transition.handoffPart !== null ? `-part${transition.handoffPart}` : "";
    const filename = `${safeName}${partSuffix}.mp3`;

    // Try saving to public/ (works locally), fall back to data URI for serverless
    let audioFilePath: string;
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
      audioFilePath = `/audio/transitions/${filename}`;
    } catch {
      // Serverless (Netlify) — read-only filesystem, store as data URI
      audioFilePath = `data:audio/mpeg;base64,${buffer.toString("base64")}`;
    }

    // Try to persist to DB (fails on read-only SQLite in serverless)
    try {
      await prisma.showTransition.update({
        where: { id },
        data: { audioFilePath },
      });
    } catch {
      // DB is read-only on Netlify — audio still returned in response
    }

    return NextResponse.json({ audioFilePath, voice, filename });
  } catch (error) {
    return handleApiError(
      error,
      "/api/show-transitions/[id]/generate-audio"
    );
  }
}
