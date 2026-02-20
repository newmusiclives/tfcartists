/**
 * Regenerate all sponsor ad + imaging audio with uploaded music beds.
 * Run with: npx tsx scripts/regen-all-audio.ts
 */
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { mixVoiceWithMusicBed } from "../src/lib/radio/audio-mixer";
import { amplifyPcm, pcmToWav, saveAudioFile } from "../src/lib/radio/voice-track-tts";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VOICE_GAIN = 2.5;
const BED_GAIN = 0.6;
const voiceMap: Record<string, string> = { male: "onyx", female: "nova" };

async function main() {
  const stationId = "cmls8oc3c00ku7d3fgc19wrvl";

  // Get uploaded beds (real music, stored as data URIs)
  const uploadedBeds = await prisma.musicBed.findMany({
    where: { stationId, isActive: true, filePath: { startsWith: "data:" } },
  });
  console.log("Uploaded beds:", uploadedBeds.length);

  // --- SPONSOR ADS ---
  const ads = await prisma.sponsorAd.findMany({
    where: { stationId, isActive: true, scriptText: { not: null } },
    include: { musicBed: true },
  });

  console.log(`\n=== SPONSOR ADS (${ads.length}) ===`);
  for (const ad of ads) {
    try {
      const response = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: "shimmer",
        input: ad.scriptText!,
        response_format: "pcm",
      });

      const rawPcm = Buffer.from(await response.arrayBuffer());
      const boostedPcm = amplifyPcm(rawPcm, VOICE_GAIN);

      let finalPcm = boostedPcm;
      if (ad.musicBed?.filePath) {
        finalPcm = mixVoiceWithMusicBed(boostedPcm, ad.musicBed.filePath, {
          voiceGain: 1.0,
          bedGain: BED_GAIN,
        });
      }

      const wavBuffer = pcmToWav(finalPcm);
      const safeName = ad.adTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const filename = `ad-${safeName}-${ad.id.slice(-6)}.wav`;
      const audioFilePath = saveAudioFile(wavBuffer, "commercials", filename);
      const dur = Math.round((finalPcm.length / 48000) * 10) / 10;

      await prisma.sponsorAd.update({
        where: { id: ad.id },
        data: { audioFilePath, durationSeconds: dur },
      });
      console.log(`  OK: ${ad.sponsorName} - ${dur}s ${ad.musicBed ? "(+bed)" : "(no bed)"}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.slice(0, 80) : String(err);
      console.log(`  FAIL: ${ad.sponsorName} ${msg}`);
    }
  }

  // --- IMAGING (sweepers, promos, station IDs) ---
  const voices = await prisma.stationImagingVoice.findMany({
    where: { stationId, isActive: true },
  });

  console.log("\n=== IMAGING AUDIO ===");
  const scriptTypes = ["station_id", "sweeper", "promo"];

  for (const voice of voices) {
    const metadata = voice.metadata as {
      scripts?: Record<string, Array<{ label: string; text: string; musicBed?: string }>>;
    } | null;
    if (!metadata?.scripts) continue;

    const openaiVoice = voiceMap[voice.voiceType] || "onyx";
    const voiceSlug = voice.displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    for (const scriptType of scriptTypes) {
      const scripts = metadata.scripts[scriptType];
      if (!scripts || scripts.length === 0) continue;

      for (const script of scripts) {
        try {
          const response = await openai.audio.speech.create({
            model: "tts-1-hd",
            voice: openaiVoice as "onyx" | "nova",
            input: script.text,
            response_format: "pcm",
          });

          const rawPcm = Buffer.from(await response.arrayBuffer());
          const boostedPcm = amplifyPcm(rawPcm, VOICE_GAIN);

          // Pick a random uploaded bed
          let finalPcm = boostedPcm;
          if (uploadedBeds.length > 0) {
            const bed = uploadedBeds[Math.floor(Math.random() * uploadedBeds.length)];
            finalPcm = mixVoiceWithMusicBed(boostedPcm, bed.filePath, {
              voiceGain: 1.0,
              bedGain: BED_GAIN,
            });
          }

          const wavBuffer = pcmToWav(finalPcm);
          const safeLabel = script.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          const filename = `${voiceSlug}-${scriptType}-${safeLabel}.wav`;
          saveAudioFile(wavBuffer, "imaging", filename);
          console.log(`  OK: ${voice.displayName} ${scriptType} ${script.label}`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message.slice(0, 80) : String(err);
          console.log(`  FAIL: ${voice.displayName} ${scriptType} ${script.label} ${msg}`);
        }
      }
    }
  }

  console.log("\nAll done!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
