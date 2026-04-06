/**
 * Generate audio for any show transitions that don't have audio yet.
 * Uses the same Gemini REST helper as the production code.
 *
 * Run: npx tsx scripts/generate-missing-transition-audio.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

/** Convert raw PCM (24kHz, 16-bit, mono) to a WAV buffer */
function pcmToWav(pcm: Buffer): Buffer {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcm.length;
  const headerSize = 44;
  const header = Buffer.alloc(headerSize);
  header.write("RIFF", 0);
  header.writeUInt32LE(dataSize + headerSize - 8, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

async function generateGeminiAudio(text: string, voice: string, voiceDirection: string | null): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not set");

  const prompt = voiceDirection
    ? `${voiceDirection}\n\nSay: "${text}"`
    : `Say: "${text}"`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || "Leda" },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`Gemini API ${response.status}: ${errBody.slice(0, 300)}`);
  }

  const data = await response.json();
  const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) throw new Error("Gemini returned no audio data");

  const pcmBuffer = Buffer.from(audioData, "base64");
  return pcmToWav(pcmBuffer);
}

async function main() {
  const transitions = await prisma.showTransition.findMany({
    where: {
      isActive: true,
      OR: [{ audioFilePath: null }, { audioFilePath: "" }],
      scriptText: { not: null },
    },
  });

  console.log(`Found ${transitions.length} transitions without audio`);

  if (transitions.length === 0) {
    await prisma.$disconnect();
    return;
  }

  // Try to upload to R2 if configured, otherwise save locally
  let useR2 = false;
  let uploadFile: ((buf: Buffer, dir: string, name: string) => Promise<string>) | null = null;
  try {
    const storage = await import("../src/lib/storage");
    if (storage.isR2Configured()) {
      useR2 = true;
      uploadFile = storage.uploadFile;
      console.log("Using R2 for storage");
    }
  } catch {
    // R2 module not available
  }

  if (!useR2) {
    console.log("R2 not configured, saving to public/audio/transitions/");
    const dir = path.join(process.cwd(), "public", "audio", "transitions");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  let success = 0;
  let failed = 0;

  for (const t of transitions) {
    try {
      // Determine which DJ's voice to use
      let voiceDjId: string | null = null;
      if (t.handoffPart === 1 && t.fromDjId) voiceDjId = t.fromDjId;
      else if (t.handoffPart === 2 && t.toDjId) voiceDjId = t.toDjId;
      else if (t.fromDjId) voiceDjId = t.fromDjId;
      else if (t.toDjId) voiceDjId = t.toDjId;

      if (!voiceDjId) {
        console.log(`  SKIP: ${t.name} — no DJ associated`);
        failed++;
        continue;
      }

      const dj = await prisma.dJ.findUnique({
        where: { id: voiceDjId },
        select: { name: true, ttsVoice: true, voiceDescription: true },
      });

      if (!dj?.ttsVoice) {
        console.log(`  SKIP: ${t.name} — DJ has no ttsVoice set`);
        failed++;
        continue;
      }

      console.log(`  Generating: ${t.name} (voice: ${dj.ttsVoice}, DJ: ${dj.name})`);
      const wavBuffer = await generateGeminiAudio(
        t.scriptText!,
        dj.ttsVoice,
        dj.voiceDescription,
      );

      // Save to file or R2
      const safeName = t.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const filename = `${safeName}.wav`;

      let audioFilePath: string;
      if (useR2 && uploadFile) {
        audioFilePath = await uploadFile(wavBuffer, "transitions", filename);
      } else {
        const filepath = path.join(process.cwd(), "public", "audio", "transitions", filename);
        fs.writeFileSync(filepath, wavBuffer);
        audioFilePath = `/audio/transitions/${filename}`;
      }

      await prisma.showTransition.update({
        where: { id: t.id },
        data: { audioFilePath },
      });

      console.log(`    ✓ Saved: ${audioFilePath}`);
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  FAILED: ${t.name} — ${msg}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} generated, ${failed} failed`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
