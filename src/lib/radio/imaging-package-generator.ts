/**
 * Imaging Package Generator
 *
 * Generates complete station imaging packages in 3 tiers:
 * - Basic ($49/mo): TOH, Station IDs, generic sweepers, promos
 * - Pro ($149/mo): + DJ-specific sweepers, show intros/outros, feature bumpers
 * - Enterprise ($299/mo): + DJ handoffs, seasonal refresh, custom music beds
 *
 * Uses the station's configured voices (ElevenLabs clones or TTS fallback).
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { aiProvider } from "@/lib/ai/providers";
import { pcmToWav, saveAudioFile } from "@/lib/radio/voice-track-tts";
import { mixVoiceWithMusicBed, trimSilence, appendSilence } from "@/lib/radio/audio-mixer";

// Tier element counts
const TIER_ELEMENTS = {
  basic: {
    toh: 8,
    station_id: 8,
    sweeper: 10, // generic only
    promo: 5,
    show_intro: 0,
    show_outro: 0,
    handoff: 0,
    feature_bumper: 0,
    price: 49,
  },
  pro: {
    toh: 8,
    station_id: 8,
    sweeper: 15, // per DJ
    promo: 8,
    show_intro: 2, // per DJ
    show_outro: 2, // per DJ
    handoff: 0,
    feature_bumper: 8,
    price: 149,
  },
  enterprise: {
    toh: 10,
    station_id: 10,
    sweeper: 15, // per DJ
    promo: 10,
    show_intro: 3, // per DJ
    show_outro: 3, // per DJ
    handoff: 2, // per DJ pair
    feature_bumper: 15,
    price: 299,
  },
} as const;

type Tier = keyof typeof TIER_ELEMENTS;

interface PackageConfig {
  stationId: string;
  tier: Tier;
  stationName: string;
  tagline: string;
  genre: string;
  djNames: string[];
  seasonalTheme?: string;
}

/**
 * Create an imaging package and generate all scripts.
 */
export async function createImagingPackage(config: PackageConfig): Promise<string> {
  const tierConfig = TIER_ELEMENTS[config.tier];

  // Calculate total elements
  const djCount = config.djNames.length;
  let total = tierConfig.toh + tierConfig.station_id + tierConfig.promo + tierConfig.feature_bumper;

  if (config.tier === "basic") {
    total += tierConfig.sweeper; // generic
  } else {
    total += tierConfig.sweeper * djCount; // per DJ
    total += tierConfig.show_intro * djCount;
    total += tierConfig.show_outro * djCount;
  }

  if (config.tier === "enterprise") {
    // Handoffs between each consecutive DJ pair
    total += tierConfig.handoff * Math.max(0, djCount - 1);
  }

  // Create the package
  const pkg = await prisma.imagingPackage.create({
    data: {
      stationId: config.stationId,
      tier: config.tier,
      status: "pending",
      stationName: config.stationName,
      tagline: config.tagline,
      genre: config.genre,
      djNames: JSON.stringify(config.djNames),
      seasonalTheme: config.seasonalTheme || null,
      totalElements: total,
      priceMonthly: tierConfig.price,
    },
  });

  return pkg.id;
}

/**
 * Generate all scripts for an imaging package.
 */
export async function generatePackageScripts(packageId: string): Promise<{ generated: number; errors: string[] }> {
  const pkg = await prisma.imagingPackage.findUnique({ where: { id: packageId } });
  if (!pkg) throw new Error("Package not found");

  const tierConfig = TIER_ELEMENTS[pkg.tier as Tier];
  const djNames: string[] = pkg.djNames ? JSON.parse(pkg.djNames) : [];
  const stationName = pkg.stationName || "The Station";
  const tagline = pkg.tagline || "";
  const genre = pkg.genre || "music";

  let generated = 0;
  const errors: string[] = [];

  const generateScripts = async (
    elementType: string,
    count: number,
    djName: string | null,
    targetDjPair: string | null,
  ) => {
    try {
      const scripts = await generateImagingScripts({
        elementType,
        count,
        stationName,
        tagline,
        genre,
        djName,
        targetDjPair,
        seasonalTheme: pkg.seasonalTheme,
      });

      for (let i = 0; i < scripts.length; i++) {
        await prisma.imagingElement.create({
          data: {
            packageId,
            elementType,
            variationNum: i + 1,
            label: scripts[i].label,
            scriptText: scripts[i].text,
            djName,
            targetDjPair,
            status: "script_ready",
          },
        });
        generated++;
      }
    } catch (err) {
      const msg = `${elementType}${djName ? ` (${djName})` : ""}: ${err instanceof Error ? err.message : String(err)}`;
      logger.error("Imaging script generation failed", { error: msg });
      errors.push(msg);
    }
  };

  // Generic elements (all tiers)
  await generateScripts("toh", tierConfig.toh, null, null);
  await generateScripts("station_id", tierConfig.station_id, null, null);
  await generateScripts("promo", tierConfig.promo, null, null);

  if (tierConfig.feature_bumper > 0) {
    await generateScripts("feature_bumper", tierConfig.feature_bumper, null, null);
  }

  // Sweepers
  if (pkg.tier === "basic") {
    await generateScripts("sweeper", tierConfig.sweeper, null, null);
  } else {
    for (const dj of djNames) {
      await generateScripts("sweeper", tierConfig.sweeper, dj, null);
    }
  }

  // DJ-specific (Pro + Enterprise)
  if (tierConfig.show_intro > 0) {
    for (const dj of djNames) {
      await generateScripts("show_intro", tierConfig.show_intro, dj, null);
      await generateScripts("show_outro", tierConfig.show_outro, dj, null);
    }
  }

  // Handoffs (Enterprise only)
  if (tierConfig.handoff > 0) {
    for (let i = 0; i < djNames.length - 1; i++) {
      const pair = `${djNames[i]}->${djNames[i + 1]}`;
      await generateScripts("handoff", tierConfig.handoff, null, pair);
    }
  }

  await prisma.imagingPackage.update({
    where: { id: packageId },
    data: { status: "generating", generatedCount: generated },
  });

  return { generated, errors };
}

/**
 * Generate TTS audio for all script_ready elements in a package.
 */
export async function generatePackageAudio(packageId: string): Promise<{ generated: number; errors: string[] }> {
  const pkg = await prisma.imagingPackage.findUnique({ where: { id: packageId } });
  if (!pkg) throw new Error("Package not found");

  const elements = await prisma.imagingElement.findMany({
    where: { packageId, status: "script_ready" },
  });

  // Load station's imaging voice config
  const station = await prisma.station.findUnique({
    where: { id: pkg.stationId },
    select: { id: true },
  });

  // Try to find imaging voices for this station
  const imagingVoices = await prisma.stationImagingVoice.findMany({
    where: { stationId: pkg.stationId, isActive: true },
  });

  // Find a music bed
  const allBeds = await prisma.musicBed.findMany({
    where: { stationId: pkg.stationId, isActive: true },
  });
  const realBeds = allBeds.filter((b) =>
    b.filePath && !b.filePath.startsWith("data:") && !b.name.toLowerCase().includes("pad")
  );
  const bed = realBeds.find((b) => b.category === "upbeat") || realBeds[0];
  const musicBedPath = bed?.filePath || null;

  let generated = 0;
  const errors: string[] = [];

  // Dynamic import for TTS functions (avoid circular deps)
  const { generatePcmWithOpenAI, generateWithGemini, generatePcmWithElevenLabs, amplifyPcm } =
    await import("@/lib/radio/voice-track-tts");

  for (const el of elements) {
    try {
      // Pick voice: use imaging voice if available, otherwise OpenAI
      let voicePcm: Buffer;

      const imagingVoice = imagingVoices.length > 0
        ? imagingVoices[el.variationNum % imagingVoices.length]
        : null;

      if (imagingVoice?.elevenlabsVoiceId) {
        const { getElevenLabsDailyBudget, trackElevenLabsChars } = await import("@/lib/elevenlabs/daily-budget");
        const budget = await getElevenLabsDailyBudget();
        if (!budget.canUseElevenLabs) {
          const msg = `${el.elementType} #${el.variationNum}: daily ElevenLabs budget exhausted (${budget.usedToday}/${budget.dailyBudget} chars)`;
          errors.push(msg);
          continue;
        }
        const { generatePcmWithElevenLabs: genEL } = await import("@/lib/radio/voice-track-tts");
        voicePcm = await genEL(el.scriptText, imagingVoice.elevenlabsVoiceId, {
          stability: imagingVoice.voiceStability ?? 0.75,
          similarityBoost: imagingVoice.voiceSimilarityBoost ?? 0.75,
        });
        await trackElevenLabsChars(el.scriptText.length);
      } else {
        // Fallback: try Gemini, then OpenAI
        try {
          const { buffer } = await generateWithGemini(el.scriptText, "Kore", null);
          voicePcm = buffer.subarray(44);
        } catch {
          voicePcm = await generatePcmWithOpenAI(el.scriptText, "echo");
        }
      }

      // Process audio: trim, boost, mix with bed
      voicePcm = trimSilence(voicePcm);
      voicePcm = appendSilence(voicePcm, 300);
      const boostedPcm = amplifyPcm(voicePcm, 4.0); // imaging gets loud voice

      let finalPcm: Buffer;
      if (musicBedPath) {
        const mixed = mixVoiceWithMusicBed(boostedPcm, musicBedPath, {
          voiceGain: 1.0,
          bedGain: 0.30,
          fadeInMs: 150,
          fadeOutMs: 400,
        });
        // If mixer failed (returned input buffer unchanged), fall back to gentle boost
        finalPcm = mixed === boostedPcm ? amplifyPcm(voicePcm, 1.5) : mixed;
      } else {
        finalPcm = amplifyPcm(voicePcm, 1.5);
      }

      const wavBuffer = pcmToWav(finalPcm);
      const filename = `img-${el.id}.wav`;
      const audioFilePath = saveAudioFile(wavBuffer, "imaging-packages", filename);
      const audioDuration = Math.round((finalPcm.length / 48000) * 10) / 10;

      await prisma.imagingElement.update({
        where: { id: el.id },
        data: { audioFilePath, audioDuration, status: "audio_ready" },
      });

      generated++;
    } catch (err) {
      const msg = `${el.elementType} #${el.variationNum}: ${err instanceof Error ? err.message : String(err)}`;
      logger.error("Imaging audio generation failed", { error: msg, elementId: el.id });
      errors.push(msg);

      await prisma.imagingElement.update({
        where: { id: el.id },
        data: { status: "failed", error: msg },
      });
    }
  }

  const failedCount = await prisma.imagingElement.count({
    where: { packageId, status: "failed" },
  });

  await prisma.imagingPackage.update({
    where: { id: packageId },
    data: {
      status: failedCount === 0 ? "complete" : "complete",
      generatedCount: generated,
      failedCount,
    },
  });

  return { generated, errors };
}

// ============================================================================
// Script generation via AI
// ============================================================================

interface ScriptConfig {
  elementType: string;
  count: number;
  stationName: string;
  tagline: string;
  genre: string;
  djName: string | null;
  targetDjPair: string | null;
  seasonalTheme?: string | null;
}

async function generateImagingScripts(config: ScriptConfig): Promise<Array<{ label: string; text: string }>> {
  const typeDescriptions: Record<string, string> = {
    toh: "Top of Hour station ID — plays at the top of each hour. Short, punchy, identifies the station. 5-8 seconds when spoken.",
    station_id: "Station ID — quick identifier played between songs. Very short and punchy. 3-5 seconds when spoken.",
    sweeper: "Sweeper — short branded liner played between songs. Energetic, identifies the station. 4-6 seconds when spoken.",
    promo: "Promo — promotes the station, a feature, or encourages listening. 8-12 seconds when spoken.",
    show_intro: "Show Intro — introduces the DJ's show at the start. Welcoming, sets the mood. 8-15 seconds when spoken.",
    show_outro: "Show Outro — wraps up the DJ's show. Thanks listeners, teases what's next. 8-12 seconds when spoken.",
    handoff: "DJ Handoff — transition between two DJs. Outgoing DJ thanks listeners and introduces the next DJ. 10-15 seconds when spoken.",
    feature_bumper: "Feature Bumper — short intro to a feature segment (trivia, music spotlight, etc.). 5-8 seconds when spoken.",
  };

  const description = typeDescriptions[config.elementType] || "Radio imaging element";
  const djContext = config.djName ? `\nThis is for DJ "${config.djName}".` : "";
  const handoffContext = config.targetDjPair
    ? `\nThis is a handoff from ${config.targetDjPair.replace("->", " to ")}.`
    : "";
  const seasonContext = config.seasonalTheme ? `\nSeasonal theme: ${config.seasonalTheme}` : "";

  const prompt = `Generate ${config.count} unique ${config.elementType} scripts for a radio station.

Station: ${config.stationName}
Tagline: "${config.tagline}"
Genre: ${config.genre}
Type: ${description}${djContext}${handoffContext}${seasonContext}

Rules:
- Each script must be DIFFERENT in wording and energy
- Keep them natural and conversational, not corporate
- They should sound like real radio, not AI-generated
- Include the station name naturally (not forced)
- Match the energy to the genre
- Scripts should be the RIGHT LENGTH for their type — not too short

Return as JSON array: [{"label": "Short description", "text": "The script text"}]
Return ONLY the JSON array, no other text.`;

  const result = await aiProvider.chat(
    [
      { role: "system", content: "You are a radio imaging writer. You write punchy, authentic radio scripts that sound natural when read by a voice actor. Output valid JSON only." },
      { role: "user", content: prompt },
    ],
    { maxTokens: 2000, temperature: 0.9 },
  );

  try {
    const parsed = JSON.parse(result.content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    logger.error("Failed to parse imaging scripts", { raw: result.content.substring(0, 200) });
    return [];
  }
}
