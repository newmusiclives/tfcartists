import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import { stationNow, stationDayType } from "@/lib/timezone";
import {
  generateWithOpenAI,
  generateWithGemini,
  saveAudioFile,
  pcmToWav,
  amplifyPcm,
  generatePcmWithOpenAI,
} from "@/lib/radio/voice-track-tts";
import { trimSilence } from "@/lib/radio/audio-mixer";
import { isAiSpendLimitReached, trackAiSpend } from "@/lib/ai/spend-tracker";
import OpenAI from "openai";
import { z } from "zod";

export const dynamic = "force-dynamic";

const dedicateSchema = z.object({
  requestId: z.string().min(1),
});

/**
 * Find the current on-air DJ via ClockAssignment for this station/hour.
 */
async function findCurrentDJ(stationId: string) {
  const now = stationNow();
  const currentHour = now.getHours().toString().padStart(2, "0") + ":00";
  const dayType = stationDayType();

  const assignment = await prisma.clockAssignment.findFirst({
    where: {
      stationId,
      isActive: true,
      dayType: { in: [dayType, "all"] },
      timeSlotStart: { lte: currentHour },
      timeSlotEnd: { gt: currentHour },
    },
    include: {
      dj: true,
    },
  });

  if (assignment?.dj) return assignment.dj;

  // Fallback: grab any active DJ for this station
  return prisma.dJ.findFirst({
    where: { stationId, isActive: true },
    orderBy: { priority: "desc" },
  });
}

/**
 * Generate a dedication script using OpenAI gpt-4o-mini in the DJ's voice.
 */
async function generateDedicationScript(
  dj: { name: string; personalityTraits: string | null; voiceDescription: string | null; catchPhrases: string | null; onAirStyle: string | null },
  listenerName: string,
  songTitle: string,
  artistName: string,
  message: string,
): Promise<string> {
  const apiKey = await getConfig("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const traits = dj.personalityTraits || "friendly, warm";
  const style = dj.onAirStyle || "conversational and genuine";
  const phrases = dj.catchPhrases || "";

  const systemPrompt = `You are ${dj.name}, a radio DJ. Your personality traits: ${traits}. Your on-air style: ${style}.${phrases ? ` Your signature phrases include: ${phrases}.` : ""}

Write a short, natural-sounding dedication (2-3 sentences max) to introduce a song request. Stay in character. Be warm and genuine. Do NOT use hashtags or emojis. Do NOT say "you're listening to" or mention the station name. Just deliver the dedication naturally as if talking on-air.`;

  const userPrompt = `A listener named "${listenerName}" has requested "${songTitle}" by ${artistName} with this dedication message: "${message}"

Write the on-air dedication. End by leading into the song (e.g. "Here's..." or "This is...").`;

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 200,
    temperature: 0.8,
  });

  const script = completion.choices[0]?.message?.content?.trim();
  if (!script) throw new Error("No script generated");

  await trackAiSpend({
    provider: "openai",
    operation: "chat",
    cost: 0.001,
    characters: (systemPrompt + userPrompt).length,
  });

  return script;
}

/**
 * POST /api/requests/dedicate — Generate an AI DJ dedication voice track
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const parsed = dedicateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Look up the song request
    const songRequest = await prisma.songRequest.findUnique({
      where: { id: parsed.data.requestId },
    });

    if (!songRequest) {
      return NextResponse.json({ error: "Song request not found" }, { status: 404 });
    }

    if (!songRequest.message || !songRequest.listenerName) {
      return NextResponse.json(
        { error: "This request has no dedication message or listener name" },
        { status: 400 },
      );
    }

    // Check AI spend limit
    if (await isAiSpendLimitReached()) {
      return NextResponse.json(
        { error: "AI daily spend limit reached. Try again tomorrow." },
        { status: 429 },
      );
    }

    // Find the current on-air DJ
    const dj = await findCurrentDJ(songRequest.stationId);
    if (!dj) {
      return NextResponse.json(
        { error: "No active DJ found for this station" },
        { status: 404 },
      );
    }

    // Generate the dedication script
    const scriptText = await generateDedicationScript(
      dj,
      songRequest.listenerName,
      songRequest.songTitle,
      songRequest.artistName,
      songRequest.message,
    );

    logger.info("Dedication script generated", {
      requestId: songRequest.id,
      djName: dj.name,
      scriptLength: scriptText.length,
    });

    // Generate TTS audio
    const voice = dj.ttsVoice || "alloy";
    const provider = dj.ttsProvider || "openai";
    const voiceDirection = dj.voiceDescription || null;

    let voicePcm: Buffer;
    if (provider === "gemini") {
      const { buffer } = await generateWithGemini(scriptText, voice, voiceDirection);
      voicePcm = buffer.subarray(44); // skip WAV header
    } else {
      voicePcm = await generatePcmWithOpenAI(scriptText, voice);
    }

    await trackAiSpend({
      provider,
      operation: "tts",
      cost: provider === "gemini" ? 0.004 : 0.015,
      characters: scriptText.length,
    });

    // Trim silence for tighter audio
    voicePcm = trimSilence(voicePcm);

    // Boost voice volume
    const boostedPcm = amplifyPcm(voicePcm, 2.0);

    // Convert to WAV and save
    const wavBuffer = pcmToWav(boostedPcm);
    const filename = `dedication-${songRequest.id}.wav`;
    const audioFilePath = saveAudioFile(wavBuffer, "dedications", filename);
    const audioDuration = Math.round((boostedPcm.length / 48000) * 10) / 10;

    // Create VoiceTrack record
    const now = stationNow();
    const voiceTrack = await prisma.voiceTrack.create({
      data: {
        stationId: songRequest.stationId,
        djId: dj.id,
        trackType: "dedication",
        songRequestId: songRequest.id,
        nextSongTitle: songRequest.songTitle,
        nextArtistName: songRequest.artistName,
        scriptText,
        audioFilePath,
        audioDuration,
        ttsVoice: voice,
        ttsProvider: provider,
        status: "audio_ready",
        airDate: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
        hourOfDay: now.getHours(),
      },
    });

    // Update SongRequest status to queued
    await prisma.songRequest.update({
      where: { id: songRequest.id },
      data: { status: "queued" },
    });

    logger.info("Dedication voice track created", {
      voiceTrackId: voiceTrack.id,
      requestId: songRequest.id,
    });

    return NextResponse.json({
      voiceTrackId: voiceTrack.id,
      scriptText,
      audioFilePath,
      audioDuration,
      djName: dj.name,
    });
  } catch (error) {
    return handleApiError(error, "/api/requests/dedicate");
  }
}
