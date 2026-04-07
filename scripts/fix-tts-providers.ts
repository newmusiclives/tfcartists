/**
 * One-shot data fix:
 *  1. Reassign every OpenAI-voice DJ to a character-appropriate Gemini voice.
 *  2. Normalize DJ.ttsProvider from DJ.ttsVoice using the canonical voice
 *     name → provider mapping.
 *  3. Replace any StationImagingVoice.elevenlabsVoiceId that isn't a known
 *     Gemini voice name with a sensible Gemini default (Autonoe for female,
 *     Algieba for male). These are leftover ElevenLabs IDs from before the
 *     imaging picker was switched to Gemini-only.
 *
 * Run with: npx tsx scripts/fix-tts-providers.ts
 */
import { prisma } from "../src/lib/db";
import { GEMINI_VOICE_NAMES, resolveTtsProvider } from "../src/lib/tts/voice-providers";

// Persona-driven mapping of weekend DJs from OpenAI voices to Gemini voices.
// Avoids voices already used by weekday DJs (Enceladus, Kore, Algenib, Achernar)
// and voices reserved for station imaging (Algieba, Autonoe) and sponsor ads
// (Rasalgethi, Laomedeia, Iapetus).
const WEEKEND_DJ_VOICE_REMAP: Record<string, string> = {
  "Ezra Stone":      "Schedar",      // M, deliberate — twilight contemplation
  "Paul Saunders":   "Achird",       // M, friendly, approachable — passionate curator
  "Levi Bridges":    "Puck",         // M, upbeat, energetic — adventure soundtrack
  "Iris Langley":    "Vindemiatrix", // F, gentle, kind — intimate storyteller
  "Mark Faulkner":   "Alnilam",      // M, firm, strong — deep Texas drawl
  "Sam Turnbull":    "Aoede",        // F, warm — porch guitar at dawn
  "Jo McAllister":   "Callirhoe",    // F, easy-going, relaxed — relatable coworker
  "Ruby Finch":      "Zephyr",       // F, bright, cheerful — Appalachian lilt
};

async function main() {
  console.log("=== Weekend DJ → Gemini voice reassignment ===");
  for (const [djName, geminiVoice] of Object.entries(WEEKEND_DJ_VOICE_REMAP)) {
    const result = await prisma.dJ.updateMany({
      where: { name: djName },
      data: { ttsVoice: geminiVoice, ttsProvider: "gemini" },
    });
    console.log(`  ${result.count > 0 ? "REMAP" : "MISS "} ${djName.padEnd(28)} → ${geminiVoice}`);
  }

  console.log("\n=== DJ ttsProvider normalization ===");
  const djs = await prisma.dJ.findMany({
    select: { id: true, name: true, ttsVoice: true, ttsProvider: true },
  });

  let djFixed = 0;
  for (const dj of djs) {
    const resolved = resolveTtsProvider(dj.ttsVoice);
    if (!resolved) {
      console.log(`  SKIP  ${dj.name.padEnd(28)} voice=${dj.ttsVoice ?? "(null)"} (unknown)`);
      continue;
    }
    if (resolved === dj.ttsProvider) {
      console.log(`  OK    ${dj.name.padEnd(28)} ${dj.ttsVoice} / ${dj.ttsProvider}`);
      continue;
    }
    await prisma.dJ.update({
      where: { id: dj.id },
      data: { ttsProvider: resolved },
    });
    console.log(`  FIX   ${dj.name.padEnd(28)} ${dj.ttsVoice}: ${dj.ttsProvider} → ${resolved}`);
    djFixed++;
  }
  console.log(`\nDJs updated: ${djFixed}/${djs.length}`);

  console.log("\n=== StationImagingVoice normalization ===");
  const voices = await prisma.stationImagingVoice.findMany({
    select: { id: true, displayName: true, voiceType: true, elevenlabsVoiceId: true },
  });

  let voiceFixed = 0;
  for (const v of voices) {
    const current = v.elevenlabsVoiceId;
    if (current && GEMINI_VOICE_NAMES.has(current)) {
      console.log(`  OK    ${v.displayName.padEnd(36)} ${current}`);
      continue;
    }
    const replacement = v.voiceType === "female" ? "Autonoe" : "Algieba";
    await prisma.stationImagingVoice.update({
      where: { id: v.id },
      data: { elevenlabsVoiceId: replacement },
    });
    console.log(`  FIX   ${v.displayName.padEnd(36)} ${current ?? "(null)"} → ${replacement}`);
    voiceFixed++;
  }
  console.log(`\nImaging voices updated: ${voiceFixed}/${voices.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
