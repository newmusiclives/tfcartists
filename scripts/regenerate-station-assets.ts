/**
 * Regenerate ALL pre-rendered station assets with Gemini TTS.
 *
 * Replaces the legacy ElevenLabs/OpenAI assets on the Hetzner server with
 * fresh Gemini-voiced audio for every DJ persona and asset type.
 *
 * Run:  GOOGLE_API_KEY=... npx tsx scripts/regenerate-station-assets.ts
 *
 * After generation, SCP the output to the server:
 *   scp -r /tmp/station-assets-gemini/* root@89.167.23.152:/mnt/audio_library/station_assets/truefans-radio-assets/
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const STATION_NAME = "North Country Radio";
const OUTPUT_DIR = "/tmp/station-assets-gemini";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  // Try loading from .env
  try {
    const envPath = path.join(__dirname, "..", ".env");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/^GOOGLE_API_KEY=(.+)$/m);
    if (match) {
      process.env.GOOGLE_API_KEY = match[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("ERROR: GOOGLE_API_KEY not set. Pass it as an env var or add to .env");
  process.exit(1);
}

// Rate-limit: Gemini TTS has a per-minute quota. We pace requests.
const DELAY_BETWEEN_REQUESTS_MS = 1500;

// ---------------------------------------------------------------------------
// DJ Personas & Voice Assignments
// ---------------------------------------------------------------------------

interface DjPersona {
  id: string;               // folder name on server
  name: string;              // DJ display name
  voice: string;             // Gemini voice name
  voiceDirection: string;    // TTS voice direction prompt
  showName: string;          // Show name
  timeSlot: string;          // e.g. "6am to 9am"
  tagline: string;
}

const DJ_PERSONAS: DjPersona[] = [
  {
    id: "hank_westwood",
    name: "Hank Westwood",
    voice: "Enceladus",
    voiceDirection: "Role: Country radio DJ named Hank Westwood. Voice: Gravelly warmth, like coffee and worn denim. Confident, grounded, blue-collar authenticity. Morning energy without being hyperactive.",
    showName: "Sunrise & Steel",
    timeSlot: "6am to 9am",
    tagline: "Pour the coffee. Fire up the engine. Let's roll.",
  },
  {
    id: "loretta_merrick",
    name: "Loretta Merrick",
    voice: "Kore",
    voiceDirection: "Role: Country radio DJ named Loretta Merrick. Voice: Warm and inviting with a subtle British-meets-Nashville flavor. Friendly, knowledgeable, genuine enthusiasm for music discovery.",
    showName: "The Transatlantic Sessions",
    timeSlot: "9am to noon",
    tagline: "Somewhere between the M6 and the Mississippi.",
  },
  {
    id: "doc_holloway",
    name: "Doc Holloway",
    voice: "Algenib",
    voiceDirection: "Role: Country radio DJ named Doc Holloway. Voice: Deep, warm baritone with encyclopedic knowledge. Smooth and authoritative but never stuffy. The wise friend who knows every album track.",
    showName: "The Deep Cuts",
    timeSlot: "noon to 3pm",
    tagline: "The songs you forgot you loved.",
  },
  {
    id: "cody_rampart",
    name: "Cody Rampart",
    voice: "Charon",
    voiceDirection: "Role: Country radio DJ named Cody Rampart. Voice: Raspy, road-worn, full of lived experience. Afternoon drive energy — upbeat but with outlaw country edge. Think dive-bar storyteller.",
    showName: "The Open Road",
    timeSlot: "3pm to 6pm",
    tagline: "The road's wide open. Let's ride.",
  },
  {
    id: "night_owl",
    name: "The Night Owl",
    voice: "Umbriel",
    voiceDirection: "Role: Late-night country radio DJ known as The Night Owl. Voice: Low, intimate, mellow. Perfect for quiet late-night listening. Gentle and unhurried.",
    showName: "The Night Owl",
    timeSlot: "overnight",
    tagline: "The quiet hours belong to us.",
  },
  {
    id: "station_male",
    name: "North Country Radio",
    voice: "Algieba",
    voiceDirection: "Role: Professional male station voice for North Country Radio. Voice: Confident, polished, authoritative but warm. Classic radio station imaging voice.",
    showName: "",
    timeSlot: "",
    tagline: "",
  },
  {
    id: "station_female",
    name: "North Country Radio",
    voice: "Autonoe",
    voiceDirection: "Role: Professional female station voice for North Country Radio. Voice: Bright, confident, polished. Modern radio station imaging voice with warmth and energy.",
    showName: "",
    timeSlot: "",
    tagline: "",
  },
];

// ---------------------------------------------------------------------------
// Script Templates — each asset type gets multiple unique scripts per DJ
// ---------------------------------------------------------------------------

type AssetType = "sweepers" | "toh" | "openers" | "teasers" | "features";

function generateScripts(dj: DjPersona, type: AssetType): string[] {
  const isStation = dj.id.startsWith("station_");
  const firstName = dj.name.split(" ")[0];

  switch (type) {
    case "toh":
      if (isStation) return [
        `You're listening to ${STATION_NAME}.`,
        `This is ${STATION_NAME}, your home for today's best country and Americana.`,
        `${STATION_NAME}. Real country. Real artists. Real music.`,
        `${STATION_NAME}, where the music runs deep.`,
        `You're tuned in to ${STATION_NAME}.`,
        `${STATION_NAME}. All day. Every day.`,
      ];
      return [
        `You're listening to ${STATION_NAME}. I'm ${dj.name}.`,
        `This is ${dj.name} on ${STATION_NAME}.`,
        `${STATION_NAME}. I'm ${dj.name}, glad you're here.`,
        `You're with ${firstName} on ${STATION_NAME}.`,
        `${dj.name}, ${STATION_NAME}. Let's keep it going.`,
        `${STATION_NAME}, I'm ${dj.name}. Stay right here.`,
      ];

    case "sweepers":
      if (isStation) return [
        `${STATION_NAME}.`,
        `${STATION_NAME}, today's best country.`,
        `More music, more country. ${STATION_NAME}.`,
        `${STATION_NAME}. Real artists. Real songs.`,
        `You're listening to ${STATION_NAME}.`,
        `${STATION_NAME}. Where the music matters.`,
      ];
      return [
        `${firstName} on ${STATION_NAME}.`,
        `${STATION_NAME} with ${dj.name}.`,
        `More music coming up, ${STATION_NAME}.`,
        `${firstName}, ${STATION_NAME}. Right back at it.`,
        `Stay with me on ${STATION_NAME}.`,
        `${STATION_NAME}. ${firstName} keeps it rolling.`,
      ];

    case "openers":
      if (isStation) return [
        `Welcome to ${STATION_NAME}. Today's best country and Americana, all day long.`,
        `This is ${STATION_NAME}. Pull up a chair and stay awhile.`,
        `You've found ${STATION_NAME}. Real country music, real artists, all day.`,
        `${STATION_NAME} is on the air. Let's get into some great music.`,
        `Welcome back to ${STATION_NAME}. The music starts right now.`,
        `This is ${STATION_NAME}, and we've got a great lineup ahead.`,
      ];
      return [
        `Hey, it's ${dj.name}. Welcome to ${dj.showName} on ${STATION_NAME}. ${dj.tagline}`,
        `Good to have you here. I'm ${dj.name}, this is ${dj.showName} on ${STATION_NAME}.`,
        `${dj.name} here on ${STATION_NAME}. ${dj.showName} starts right now. Let's go.`,
        `Welcome in. I'm ${firstName}, this is ${dj.showName}. We've got great music lined up for you on ${STATION_NAME}.`,
        `It's ${dj.showName} time on ${STATION_NAME}. I'm ${dj.name}. Glad you could join me.`,
        `Hey there, ${firstName} here. ${dj.showName} is on the air right now on ${STATION_NAME}. Settle in.`,
        `Welcome to ${dj.showName} on ${STATION_NAME}. I'm ${dj.name}. We've got a great hour ahead.`,
        `You're tuned in to ${dj.showName} with ${dj.name} on ${STATION_NAME}. Let's get started.`,
      ];

    case "teasers":
      if (isStation) return [
        `Still ahead on ${STATION_NAME}, more of the country you love.`,
        `Don't go anywhere. More great music coming up on ${STATION_NAME}.`,
        `Stay tuned to ${STATION_NAME}. The best is yet to come.`,
        `Coming up next on ${STATION_NAME}, we keep the hits rolling.`,
        `More music on the way. ${STATION_NAME}, stay right here.`,
        `You're not gonna want to miss what's next on ${STATION_NAME}.`,
      ];
      return [
        `Still ahead on ${dj.showName}, more great music coming your way.`,
        `Don't go anywhere. ${firstName}'s got more coming up on ${STATION_NAME}.`,
        `Stay with me. Got some great songs lined up next on ${STATION_NAME}.`,
        `Coming up, more music you're gonna love. ${dj.name} on ${STATION_NAME}.`,
        `Stick around. The best part of ${dj.showName} is still ahead.`,
        `More to come on ${dj.showName}. ${STATION_NAME}, I'm ${firstName}, stay tuned.`,
      ];

    case "features":
      if (isStation) return [];  // station voices don't have features
      if (dj.id === "night_owl") return [];  // night owl has no features on server
      return [
        `Time for a deep cut here on ${dj.showName}. This one's special.`,
        `${firstName}'s pick of the hour, right here on ${STATION_NAME}.`,
        `Here's one I've been wanting to play for you. ${dj.name} on ${STATION_NAME}.`,
        `Feature time on ${dj.showName}. Listen close to this one.`,
      ];
  }
}

// ---------------------------------------------------------------------------
// Gemini TTS Generation
// ---------------------------------------------------------------------------

async function generateGeminiTts(
  text: string,
  voice: string,
  voiceDirection: string,
): Promise<Buffer> {
  const prompt = `${voiceDirection}\n\nSay: "${text}"`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(API_KEY!)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
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
  if (!audioData) {
    throw new Error("Gemini returned no audio data");
  }

  return Buffer.from(audioData, "base64");
}

/** Convert raw PCM (24kHz, 16-bit, mono) to WAV */
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

/** Amplify 16-bit PCM by a gain factor with hard clipping */
function amplifyPcm(pcm: Buffer, gain: number): Buffer {
  const out = Buffer.alloc(pcm.length);
  for (let i = 0; i < pcm.length; i += 2) {
    const sample = pcm.readInt16LE(i);
    const boosted = Math.max(-32768, Math.min(32767, Math.round(sample * gain)));
    out.writeInt16LE(boosted, i);
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Station Asset Regeneration with Gemini TTS ===\n");

  // Ensure output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }

  const assetTypes: AssetType[] = ["toh", "sweepers", "openers", "teasers", "features"];
  let totalGenerated = 0;
  let totalErrors = 0;

  for (const dj of DJ_PERSONAS) {
    console.log(`\n--- ${dj.name} (${dj.id}) — voice: ${dj.voice} ---`);

    for (const assetType of assetTypes) {
      const scripts = generateScripts(dj, assetType);
      if (scripts.length === 0) {
        console.log(`  ${assetType}: (none)`);
        continue;
      }

      const outDir = path.join(OUTPUT_DIR, dj.id, assetType);
      fs.mkdirSync(outDir, { recursive: true });

      for (let i = 0; i < scripts.length; i++) {
        const num = String(i + 1).padStart(2, "0");
        const filename = `${dj.id}_${assetType}_${num}`;
        const script = scripts[i];

        try {
          // Generate TTS
          const pcm = await generateGeminiTts(script, dj.voice, dj.voiceDirection);

          // Boost volume (4x for punchy imaging, matching imaging-package-generator)
          const boosted = amplifyPcm(pcm, 4.0);
          const wav = pcmToWav(boosted);

          // Write WAV temp file
          const wavPath = path.join(outDir, `${filename}.wav`);
          fs.writeFileSync(wavPath, wav);

          // Convert to MP3 at 192kbps
          const mp3Path = path.join(outDir, `${filename}.mp3`);
          execSync(
            `ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -b:a 192k -ar 44100 "${mp3Path}" 2>/dev/null`,
          );

          // Remove WAV
          fs.unlinkSync(wavPath);

          const duration = (pcm.length / 48000).toFixed(2);
          console.log(`  ✓ ${filename}.mp3 (${duration}s) — "${script.slice(0, 60)}..."`);
          totalGenerated++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  ✗ ${filename}: ${msg}`);
          totalErrors++;
        }

        // Rate-limit
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
      }
    }
  }

  console.log(`\n=== Done: ${totalGenerated} generated, ${totalErrors} errors ===`);
  console.log(`\nOutput: ${OUTPUT_DIR}`);
  console.log(`\nTo deploy to server:`);
  console.log(`  scp -r ${OUTPUT_DIR}/* root@89.167.23.152:/mnt/audio_library/station_assets/truefans-radio-assets/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
