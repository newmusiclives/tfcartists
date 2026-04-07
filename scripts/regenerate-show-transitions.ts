/**
 * Regenerate cached audio for every ShowTransition with Gemini.
 *
 * After wiping the ElevenLabs-era cache, the playout endpoint needs Gemini
 * audio for show intros, outros, and DJ handoffs. This calls generateWithGemini
 * directly so we don't need an HTTP roundtrip.
 *
 * Run with: npx tsx scripts/regenerate-show-transitions.ts
 */
import { prisma } from "../src/lib/db";
import { generateWithGemini, saveAudioFile, pcmToWav } from "../src/lib/radio/voice-track-tts";

async function main() {
  const transitions = await prisma.showTransition.findMany({
    where: { scriptText: { not: null } },
    orderBy: [{ handoffGroupId: "asc" }, { handoffPart: "asc" }],
  });
  console.log(`Regenerating ${transitions.length} show transitions with Gemini...`);

  let ok = 0;
  let failed = 0;
  for (const t of transitions) {
    try {
      // Pick the right DJ for this transition (from = part 1, to = part 2)
      let voiceDjId: string | null = null;
      if (t.handoffPart === 1 && t.fromDjId) voiceDjId = t.fromDjId;
      else if (t.handoffPart === 2 && t.toDjId) voiceDjId = t.toDjId;
      else if (t.fromDjId) voiceDjId = t.fromDjId;
      else if (t.toDjId) voiceDjId = t.toDjId;

      let voice = "Leda";
      let voiceDirection: string | null = null;
      if (voiceDjId) {
        const dj = await prisma.dJ.findUnique({
          where: { id: voiceDjId },
          select: { ttsVoice: true, voiceDescription: true, name: true },
        });
        if (dj?.ttsVoice) voice = dj.ttsVoice;
        voiceDirection = dj?.voiceDescription || null;
      }

      const { buffer } = await generateWithGemini(t.scriptText!, voice, voiceDirection);
      // generateWithGemini already returns a WAV buffer (header + PCM)

      const safeName = t.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const partSuffix = t.handoffPart !== null ? `-part${t.handoffPart}` : "";
      const filename = `${safeName}${partSuffix}.wav`;

      const audioFilePath = saveAudioFile(buffer, "transitions", filename);
      await prisma.showTransition.update({
        where: { id: t.id },
        data: { audioFilePath },
      });
      console.log(`  OK   ${t.name} (${voice})`);
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL ${t.name}: ${msg}`);
      failed++;
    }
  }
  console.log(`\nDone: ${ok} ok, ${failed} failed`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
