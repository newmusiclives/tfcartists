/**
 * Show Reel Segment Generation API
 *
 * POST { stationName, tagline?, genre, venueName?, prospectName?, segmentIndex }
 *
 * Generates ONE DJ segment at a time to stay within Netlify's serverless timeout.
 * The frontend calls this 4 times (segmentIndex 0-3) to build the full reel.
 */

import { NextRequest, NextResponse } from "next/server";
import { STATION_TEMPLATES } from "@/lib/station-templates";
import {
  generatePcmWithOpenAI,
  generateWithGemini,
  amplifyPcm,
  pcmToWav,
  saveAudioFile,
} from "@/lib/radio/voice-track-tts";
import { mixVoiceWithMusicBed } from "@/lib/radio/audio-mixer";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { trackAiSpend } from "@/lib/ai/spend-tracker";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// DJ definitions for the show reel
const SHOWREEL_DJS = [
  {
    name: "Hank",
    slot: "Morning Show",
    timeLabel: "6:00 AM",
    voice: "onyx",
    traits: "warm, storytelling, nostalgic, gravel-voiced Southern gentleman",
    vibe: "front porch morning coffee",
    isPersonalized: false,
  },
  {
    name: "Loretta Merrick",
    slot: "Desert Folk Dispatch",
    timeLabel: "10:00 AM",
    voice: "nova",
    traits: "British accent, knowledgeable, intimate, shares discovery stories, unpretentious",
    vibe: "somewhere between the M6 and the Mississippi",
    isPersonalized: true,
  },
  {
    name: "Doc",
    slot: "The Afternoon Session",
    timeLabel: "2:00 PM",
    voice: "echo",
    traits: "erudite, calm, insightful, dry wit, music historian",
    vibe: "university radio professor",
    isPersonalized: false,
  },
  {
    name: "Cody",
    slot: "Drive Time",
    timeLabel: "5:00 PM",
    voice: "fable",
    traits: "enthusiastic, witty, relatable, young energy, new discoveries",
    vibe: "new generation country, road trip energy",
    isPersonalized: false,
  },
];

function findTemplate(genre: string) {
  const lower = genre.toLowerCase();
  const exact = STATION_TEMPLATES.find((t) => t.id === lower);
  if (exact) return exact;
  const best = STATION_TEMPLATES.map((t) => {
    const tg = t.genre.toLowerCase().split(/[,\s]+/);
    const ig = lower.split(/[,\s]+/);
    const score = ig.filter((g) => tg.some((x) => x.includes(g) || g.includes(x))).length;
    return { template: t, score };
  }).sort((a, b) => b.score - a.score);
  return best[0]?.score > 0 ? best[0].template : STATION_TEMPLATES[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationName, genre, venueName, prospectName, segmentIndex } = body;

    if (!stationName || !genre || segmentIndex === undefined) {
      return NextResponse.json(
        { error: "stationName, genre, and segmentIndex are required" },
        { status: 400 },
      );
    }

    const idx = Number(segmentIndex);
    if (idx < 0 || idx >= SHOWREEL_DJS.length) {
      return NextResponse.json({ error: "Invalid segmentIndex (0-3)" }, { status: 400 });
    }

    const template = findTemplate(genre);
    const tagline = body.tagline || template.tagline;
    const dj = SHOWREEL_DJS[idx];

    const openaiKey = await getConfig("OPENAI_API_KEY");
    if (!openaiKey) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey: openaiKey });

    // Find a music bed
    let musicBedPath: string | null = null;
    try {
      const station = await prisma.station.findFirst();
      if (station) {
        const beds = await prisma.musicBed.findMany({
          where: { stationId: station.id, isActive: true },
        });
        const realBeds = beds.filter(
          (b) => b.filePath && !b.filePath.startsWith("data:") && !b.name.toLowerCase().includes("pad"),
        );
        const bed =
          realBeds.find((b) => b.category === "soft") ||
          realBeds[0] ||
          beds.find((b) => b.filePath && !b.filePath.startsWith("data:"));
        if (bed?.filePath) musicBedPath = bed.filePath;
      }
    } catch {
      // Music bed lookup failed — proceed without
    }

    const isLoretta = dj.isPersonalized;
    const hasPersonalization = isLoretta && prospectName;

    // Build the script prompt
    const personalizedInstructions = hasPersonalization
      ? `\n\nIMPORTANT: This is the PERSONALIZED segment. Loretta must naturally mention "${prospectName}" by name at least once — as if she's talking directly to them.${venueName ? ` Also reference "${venueName}" as a location/venue/event.` : ""} Make it feel warm and personal, like Loretta is welcoming ${prospectName} to the station for the first time.`
      : "";

    const scriptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.85,
      max_tokens: 350,
      messages: [
        {
          role: "system",
          content: `You are a radio copywriter. Write a smooth, professional radio DJ segment script.
The script should flow naturally as one continuous read — no stage directions, no sound effects labels, no brackets.
DJ: ${dj.name}. Show: "${dj.slot}". Personality: ${dj.traits}. Vibe: ${dj.vibe}.
Keep it under 120 words so it reads in about 50-60 seconds.${personalizedInstructions}`,
        },
        {
          role: "user",
          content: `Write a DJ segment for "${stationName}" (${genre} station, tagline: "${tagline}").

Structure:
1. Station ID: "You're listening to ${stationName}, ${tagline}"
2. DJ intro: ${dj.name} welcomes listeners — it's ${dj.timeLabel}
3. ${hasPersonalization ? `Personal welcome to ${prospectName}${venueName ? ` at ${venueName}` : ""}` : `Tease upcoming ${genre} music`}
4. Song intro: hype the next track
5. Brief station close: "${stationName}"

Write it as a single flowing script — no labels, just the words the DJ speaks.`,
        },
      ],
    });

    const script = scriptResponse.choices[0]?.message?.content;
    if (!script) {
      return NextResponse.json({ error: `Failed to generate script for ${dj.name}` }, { status: 500 });
    }

    await trackAiSpend({ provider: "openai", operation: "chat", cost: 0.001, tokens: 500 });

    // Generate TTS audio
    let voicePcm: Buffer;

    // Use Gemini TTS for all DJ segments, fall back to OpenAI
    try {
      const { buffer } = await generateWithGemini(script, dj.voice || "Leda", null);
      voicePcm = buffer.subarray(44); // strip WAV header
      await trackAiSpend({ provider: "google", operation: "tts", cost: 0.004, characters: script.length });
    } catch {
      voicePcm = await generatePcmWithOpenAI(script, dj.voice);
      await trackAiSpend({ provider: "openai", operation: "tts", cost: 0.015, characters: script.length });
    }

    // Mix with music bed if available
    let finalPcm: Buffer;
    if (musicBedPath) {
      try {
        const boostedPcm = amplifyPcm(voicePcm, 2.0);
        const mixed = mixVoiceWithMusicBed(boostedPcm, musicBedPath, {
          voiceGain: 1.0,
          bedGain: 0.25,
          fadeInMs: 200,
          fadeOutMs: 600,
        });
        // If mixer failed (returned input buffer unchanged), fall back to gentle boost
        finalPcm = mixed === boostedPcm ? amplifyPcm(voicePcm, 1.5) : mixed;
      } catch {
        finalPcm = amplifyPcm(voicePcm, 1.5); // Mixing failed — gentle boost only
      }
    } else {
      finalPcm = amplifyPcm(voicePcm, 1.5);
    }

    const wavBuffer = pcmToWav(finalPcm);
    const timestamp = Date.now();
    const safeName = stationName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 20);
    const djSlug = dj.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const filename = `reel-${safeName}-${djSlug}-${timestamp}.wav`;

    let audioUrl: string;
    try {
      audioUrl = saveAudioFile(wavBuffer, "showreels", filename);
    } catch {
      // Serverless can't write to disk — return base64 data URI
      audioUrl = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
    }

    return NextResponse.json({
      segmentIndex: idx,
      djName: dj.name,
      slot: dj.slot,
      timeLabel: dj.timeLabel,
      script,
      audioUrl,
      isPersonalized: !!hasPersonalization,
      usedPersonalizedVoice: !!hasPersonalization,
    });
  } catch (error) {
    logger.error("Show reel segment generation error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate segment. Please try again." },
      { status: 500 },
    );
  }
}
