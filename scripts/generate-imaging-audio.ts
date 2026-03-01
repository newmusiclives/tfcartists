/**
 * Generate TTS audio for all imaging voice scripts locally.
 * Bypasses Netlify function timeout by running directly.
 *
 * Run with: npx tsx scripts/generate-imaging-audio.ts
 */

import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const STATION_ID = "cmm3sum5b00lq7d120drjrew8";

// Voice gain for imaging — boost voice so it punches through
const VOICE_GAIN = 4.5;

// Imaging voices — punchy delivery
const IMAGING_VOICE_MAP: Record<string, "echo" | "shimmer"> = {
  male: "echo",
  female: "shimmer",
};

interface ImagingScript {
  label: string;
  text: string;
  musicBed: string;
  audioFilePath?: string;
  hasMusicBed?: boolean;
  audioDuration?: number;
}

function amplifyPcm(pcm: Buffer, gain: number): Buffer {
  const result = Buffer.alloc(pcm.length);
  for (let i = 0; i < pcm.length; i += 2) {
    let sample = pcm.readInt16LE(i);
    sample = Math.max(-32768, Math.min(32767, Math.round(sample * gain)));
    result.writeInt16LE(sample, i);
  }
  return result;
}

function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28);
  header.writeUInt16LE(channels * (bitDepth / 8), 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

async function main() {
  // Try DB first (SystemConfig), then env var
  let apiKey: string | undefined;
  try {
    const config = await prisma.systemConfig.findUnique({ where: { key: "OPENAI_API_KEY" } });
    if (config?.value) apiKey = config.value;
  } catch { /* fall through */ }
  if (!apiKey) apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const openai = new OpenAI({ apiKey });

  // Load imaging voices
  const voices = await prisma.stationImagingVoice.findMany({
    where: { stationId: STATION_ID, isActive: true },
  });

  if (voices.length === 0) {
    console.log("No imaging voices found");
    return;
  }

  console.log(`Found ${voices.length} imaging voices`);

  // Ensure output directory exists
  const audioDir = path.join(process.cwd(), "public", "audio", "imaging");
  fs.mkdirSync(audioDir, { recursive: true });

  const scriptTypes = ["station_id", "sweeper", "promo"];
  let totalGenerated = 0;
  let totalFailed = 0;

  for (const voice of voices) {
    const metadata = voice.metadata as Record<string, unknown> | null;
    const scripts = (metadata?.scripts || {}) as Record<string, ImagingScript[]>;
    const openaiVoice = IMAGING_VOICE_MAP[voice.voiceType] || "echo";
    const voiceSlug = voice.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    console.log(`\n=== ${voice.displayName} (${voice.voiceType}) → voice: ${openaiVoice} ===`);

    for (const scriptType of scriptTypes) {
      const typeScripts = scripts[scriptType] || [];
      if (typeScripts.length === 0) continue;

      console.log(`  ${scriptType}: ${typeScripts.length} scripts`);

      for (let i = 0; i < typeScripts.length; i++) {
        const script = typeScripts[i];
        const labelSlug = script.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const fileName = `${voiceSlug}-${scriptType}-${labelSlug}.wav`;
        const filePath = path.join(audioDir, fileName);
        const publicPath = `/audio/imaging/${fileName}`;

        process.stdout.write(`    [${i + 1}/${typeScripts.length}] ${script.label}... `);

        try {
          const response = await openai.audio.speech.create({
            model: "tts-1-hd",
            voice: openaiVoice,
            input: script.text,
            response_format: "pcm",
          });

          const rawPcm = Buffer.from(await response.arrayBuffer());
          const boostedPcm = amplifyPcm(rawPcm, VOICE_GAIN);
          const wav = pcmToWav(boostedPcm);

          fs.writeFileSync(filePath, wav);

          // Calculate duration: PCM at 24000Hz, 16-bit mono
          const durationSec = rawPcm.length / (24000 * 2);

          // Update script metadata
          script.audioFilePath = publicPath;
          script.hasMusicBed = false;
          script.audioDuration = Math.round(durationSec * 10) / 10;

          totalGenerated++;
          console.log(`${durationSec.toFixed(1)}s → ${fileName}`);
        } catch (e) {
          totalFailed++;
          console.log(`FAILED: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    // Save updated scripts back to DB
    await prisma.stationImagingVoice.update({
      where: { id: voice.id },
      data: {
        metadata: {
          ...(metadata || {}),
          scripts,
        },
      },
    });
    console.log(`  → Saved metadata for ${voice.displayName}`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Generated: ${totalGenerated}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Audio files in: ${audioDir}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
