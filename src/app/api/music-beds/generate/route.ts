import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { pcmToWav, saveAudioFile } from "@/lib/radio/voice-track-tts";

export const dynamic = "force-dynamic";

const SAMPLE_RATE = 24000;
const DURATION_SECONDS = 30;

interface BedConfig {
  name: string;
  category: string;
  /** Base frequency in Hz */
  baseFreq: number;
  /** Harmonic intervals as frequency ratios */
  harmonics: { ratio: number; amp: number }[];
  /** Tremolo rate in Hz */
  tremoloRate: number;
  /** Tremolo depth (0-1) */
  tremoloDepth: number;
  /** Overall amplitude (0-1) */
  amplitude: number;
  /** Noise level (0-1) */
  noiseLevel: number;
}

const BED_CONFIGS: BedConfig[] = [
  {
    name: "Soft Ambient Pad",
    category: "soft",
    baseFreq: 130.81, // C3
    harmonics: [
      { ratio: 1.5, amp: 0.4 },   // G3
      { ratio: 2.0, amp: 0.25 },  // C4
      { ratio: 2.52, amp: 0.15 }, // E4
      { ratio: 3.0, amp: 0.1 },   // G4
    ],
    tremoloRate: 0.15,
    tremoloDepth: 0.3,
    amplitude: 0.25,
    noiseLevel: 0.02,
  },
  {
    name: "Upbeat Bright Pad",
    category: "upbeat",
    baseFreq: 164.81, // E3
    harmonics: [
      { ratio: 1.5, amp: 0.5 },   // B3
      { ratio: 2.0, amp: 0.35 },  // E4
      { ratio: 2.5, amp: 0.2 },   // G#4
      { ratio: 3.0, amp: 0.15 },  // B4
      { ratio: 4.0, amp: 0.08 },  // E5 (brightness)
    ],
    tremoloRate: 0.25,
    tremoloDepth: 0.2,
    amplitude: 0.28,
    noiseLevel: 0.03,
  },
  {
    name: "Country Warmth Pad",
    category: "country",
    baseFreq: 146.83, // D3
    harmonics: [
      { ratio: 1.498, amp: 0.45 }, // A3 (fifth)
      { ratio: 2.0, amp: 0.3 },    // D4
      { ratio: 2.52, amp: 0.2 },   // F#4 (major third)
      { ratio: 3.0, amp: 0.12 },   // A4
    ],
    tremoloRate: 0.18,
    tremoloDepth: 0.25,
    amplitude: 0.26,
    noiseLevel: 0.025,
  },
  {
    name: "General Background Pad",
    category: "general",
    baseFreq: 138.59, // C#3
    harmonics: [
      { ratio: 1.5, amp: 0.4 },
      { ratio: 2.0, amp: 0.3 },
      { ratio: 3.0, amp: 0.15 },
      { ratio: 4.0, amp: 0.06 },
    ],
    tremoloRate: 0.12,
    tremoloDepth: 0.35,
    amplitude: 0.24,
    noiseLevel: 0.02,
  },
  {
    name: "Corporate Clean Pad",
    category: "corporate",
    baseFreq: 174.61, // F3
    harmonics: [
      { ratio: 1.5, amp: 0.35 },
      { ratio: 2.0, amp: 0.25 },
      { ratio: 3.0, amp: 0.1 },
    ],
    tremoloRate: 0.1,
    tremoloDepth: 0.15,
    amplitude: 0.22,
    noiseLevel: 0.015,
  },
];

function generatePadPcm(config: BedConfig): Buffer {
  const totalSamples = SAMPLE_RATE * DURATION_SECONDS;
  const pcm = Buffer.alloc(totalSamples * 2); // 16-bit = 2 bytes per sample
  const fadeInSamples = SAMPLE_RATE * 2;  // 2 second fade in
  const fadeOutSamples = SAMPLE_RATE * 3; // 3 second fade out

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Base sine wave
    let sample = Math.sin(2 * Math.PI * config.baseFreq * t);

    // Add harmonics
    for (const h of config.harmonics) {
      sample += h.amp * Math.sin(2 * Math.PI * config.baseFreq * h.ratio * t);
    }

    // Tremolo (amplitude modulation)
    const tremolo = 1 - config.tremoloDepth * (0.5 + 0.5 * Math.sin(2 * Math.PI * config.tremoloRate * t));
    sample *= tremolo;

    // Filtered noise (simple low-pass via averaging)
    const noise = (Math.random() * 2 - 1) * config.noiseLevel;
    sample += noise;

    // Scale by amplitude
    sample *= config.amplitude;

    // Fade in
    if (i < fadeInSamples) {
      sample *= i / fadeInSamples;
    }
    // Fade out
    if (i > totalSamples - fadeOutSamples) {
      sample *= (totalSamples - i) / fadeOutSamples;
    }

    // Clamp and write 16-bit sample
    const int16 = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    pcm.writeInt16LE(int16, i * 2);
  }

  return pcm;
}

/**
 * POST /api/music-beds/generate — Generate procedural music bed WAV files
 * for all standard categories (soft, upbeat, country, general, corporate).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationId } = body;

    if (!stationId) {
      return NextResponse.json({ error: "stationId is required" }, { status: 400 });
    }

    const results: Array<{ name: string; category: string; filePath: string }> = [];
    const skipped: string[] = [];

    for (const config of BED_CONFIGS) {
      // Check if a music bed for this category already has a valid file
      const existing = await prisma.musicBed.findFirst({
        where: { stationId, category: config.category, isActive: true },
      });

      // Skip if we already have one with a real file (> 1KB suggests valid audio)
      if (existing?.filePath && !existing.filePath.startsWith("data:")) {
        skipped.push(`${config.name} (${config.category})`);
        continue;
      }

      // Generate the PCM audio
      const pcm = generatePadPcm(config);
      const wav = pcmToWav(pcm);

      const safeName = config.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const fileName = `${safeName}-${Date.now()}.wav`;
      const filePath = saveAudioFile(wav, "music-beds", fileName);

      const durationSeconds = DURATION_SECONDS;

      if (existing) {
        // Update existing record with new file
        await prisma.musicBed.update({
          where: { id: existing.id },
          data: { fileName, filePath, durationSeconds, name: config.name },
        });
      } else {
        await prisma.musicBed.create({
          data: {
            stationId,
            name: config.name,
            fileName,
            filePath,
            durationSeconds,
            category: config.category,
            isActive: true,
          },
        });
      }

      results.push({ name: config.name, category: config.category, filePath });
    }

    return NextResponse.json({
      message: `Generated ${results.length} music beds, skipped ${skipped.length} existing`,
      generated: results,
      skipped,
    });
  } catch (error) {
    return handleApiError(error, "/api/music-beds/generate");
  }
}
