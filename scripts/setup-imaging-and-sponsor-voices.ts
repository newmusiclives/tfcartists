/**
 * Configure Gemini voices for the 2 existing imaging voices and create
 * 4 new sponsor ad voices.
 *
 * - Updates "The Voice of NCR" (male) to use Algieba
 * - Updates "NCR Power Voice" (female) to use Autonoe
 * - Creates 4 new sponsor voices: Rasalgethi, Laomedeia, Iapetus, Achernar
 *
 * Idempotent — safe to re-run.
 *
 * Run: npx tsx scripts/setup-imaging-and-sponsor-voices.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const station = await prisma.station.findFirst({ where: { isActive: true } });
  if (!station) throw new Error("No active station found");

  // ========================================================================
  // STEP 1: Update existing imaging voices with Gemini voice names
  // ========================================================================
  console.log("\n=== STEP 1: Update imaging voices with Gemini voices ===");

  const imagingUpdates = [
    {
      displayName: "The Voice of NCR",
      gemini: "Algieba",
      defaultDirection:
        "Role: Authoritative station voice for North Country Radio. " +
        "Voice Texture: Deep, resonant, smooth, commanding. " +
        "Atmosphere: Professional sound-treated room, close-mic proximity effect, dry audio, broadcast compression. " +
        "Personality: Confident, cinematic, classic radio imaging voice. " +
        "Delivery: Smooth, measured pacing, slight gravitas. NOT a DJ — this is the voice of the station itself.",
    },
    {
      displayName: "NCR Power Voice",
      gemini: "Autonoe",
      defaultDirection:
        "Role: Power voice for North Country Radio imaging. " +
        "Voice Texture: Bright, optimistic, confident, cuts through music beds. " +
        "Atmosphere: Professional sound-treated room, close-mic, dry audio, broadcast compression. " +
        "Personality: Strong, warm, slight Southern edge, energetic. " +
        "Delivery: Forward and expressive, hits the brand line crisply. NOT a DJ — this is the high-energy station voice.",
    },
  ];

  for (const u of imagingUpdates) {
    const voice = await prisma.stationImagingVoice.findFirst({
      where: { stationId: station.id, displayName: u.displayName },
    });
    if (!voice) {
      console.log(`  SKIP: "${u.displayName}" not found`);
      continue;
    }
    const existingMeta = (voice.metadata as Record<string, unknown>) || {};
    // Don't overwrite voiceDirection if user already set one
    const existingDirection = (existingMeta as { voiceDirection?: string }).voiceDirection;
    await prisma.stationImagingVoice.update({
      where: { id: voice.id },
      data: {
        elevenlabsVoiceId: u.gemini,
        metadata: {
          ...existingMeta,
          voiceDirection: existingDirection || u.defaultDirection,
        },
      },
    });
    console.log(`  ✓ ${u.displayName} → Gemini voice: ${u.gemini}`);
  }

  // ========================================================================
  // STEP 2: Create 4 new sponsor ad voices
  // ========================================================================
  console.log("\n=== STEP 2: Create sponsor ad voices ===");

  const sponsorVoices = [
    {
      displayName: "Sponsor Voice — Rasalgethi (M)",
      voiceType: "male",
      gemini: "Rasalgethi",
      direction:
        "Role: Professional sponsor ad reader. " +
        "Voice Texture: Informative, polished, trustworthy. " +
        "Atmosphere: Studio booth, clean audio. " +
        "Personality: Knowledgeable, friendly, business-like. " +
        "Delivery: Clear, articulate, confident. Reads ad copy with conviction.",
    },
    {
      displayName: "Sponsor Voice — Laomedeia (F)",
      voiceType: "female",
      gemini: "Laomedeia",
      direction:
        "Role: Upbeat sponsor ad reader. " +
        "Voice Texture: Lively, bright, energetic. " +
        "Atmosphere: Studio booth, clean audio. " +
        "Personality: Friendly, enthusiastic, approachable. " +
        "Delivery: Animated and engaging, makes the ad feel like a recommendation from a friend.",
    },
    {
      displayName: "Sponsor Voice — Iapetus (M)",
      voiceType: "male",
      gemini: "Iapetus",
      direction:
        "Role: Conversational sponsor ad reader. " +
        "Voice Texture: Clear, articulate, warm. " +
        "Atmosphere: Studio booth, intimate close-mic feel. " +
        "Personality: Friendly, relatable, authentic. " +
        "Delivery: Natural conversational pacing, like talking to one listener at a time.",
    },
    {
      displayName: "Sponsor Voice — Achernar (F)",
      voiceType: "female",
      gemini: "Achernar",
      direction:
        "Role: Soft, gentle sponsor ad reader. " +
        "Voice Texture: Warm, gentle, soothing. " +
        "Atmosphere: Studio booth, intimate close-mic. " +
        "Personality: Reassuring, kind, trustworthy. " +
        "Delivery: Calm and unhurried — works well for community-focused or wellness-related sponsors.",
    },
  ];

  for (const sv of sponsorVoices) {
    const existing = await prisma.stationImagingVoice.findFirst({
      where: { stationId: station.id, displayName: sv.displayName },
    });

    const data = {
      stationId: station.id,
      displayName: sv.displayName,
      voiceType: sv.voiceType,
      elevenlabsVoiceId: sv.gemini,
      voiceStability: 0.75,
      voiceSimilarityBoost: 0.75,
      voiceStyle: 0.5,
      usageTypes: "sponsor",
      isActive: true,
      metadata: {
        voiceCharacter: `Gemini ${sv.gemini} — sponsor ad voice`,
        voiceDirection: sv.direction,
      },
    };

    if (existing) {
      // Don't overwrite voice direction if user already customized it
      const existingMeta = (existing.metadata as Record<string, unknown>) || {};
      const existingDirection = (existingMeta as { voiceDirection?: string }).voiceDirection;
      await prisma.stationImagingVoice.update({
        where: { id: existing.id },
        data: {
          ...data,
          metadata: {
            ...data.metadata,
            voiceDirection: existingDirection || sv.direction,
          },
        },
      });
      console.log(`  ✓ Updated: ${sv.displayName}`);
    } else {
      await prisma.stationImagingVoice.create({ data });
      console.log(`  ✓ Created: ${sv.displayName}`);
    }
  }

  // ========================================================================
  // VERIFICATION
  // ========================================================================
  console.log("\n=== VERIFICATION ===");
  const allVoices = await prisma.stationImagingVoice.findMany({
    where: { stationId: station.id, isActive: true },
    orderBy: { displayName: "asc" },
  });
  console.log(`Total active imaging voices: ${allVoices.length}`);
  for (const v of allVoices) {
    const dir = (v.metadata as { voiceDirection?: string } | null)?.voiceDirection;
    console.log(`  ${v.displayName.padEnd(40)} | type=${v.voiceType.padEnd(6)} | gemini=${(v.elevenlabsVoiceId || "(none)").padEnd(15)} | usage=${v.usageTypes} | direction=${dir ? "YES" : "no"}`);
  }

  console.log("\n✓ Done");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
