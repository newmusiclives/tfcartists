/**
 * Batch-generate a complete sung imaging pack via the Mureka API.
 *
 * ONLY works if you are on the Mureka API tier (MUREKA_API_KEY set).
 * If you are on the $10 web-only subscription, this script will throw
 * on the first call — use the drop-folder workflow instead.
 *
 * Output: each generated song is downloaded, placed in drop/mureka-imaging/
 * with a pre-populated manifest.json so you can fine-tune the trim points
 * and then run scripts/ingest-mureka-assets.ts to ship them.
 *
 * Usage:
 *   npx tsx scripts/generate-mureka-imaging.ts
 */
import fs from "fs";
import path from "path";
import {
  generateInstrumental,
  generateSong,
  waitForJob,
  downloadSongMp3,
  isMurekaConfigured,
} from "../src/lib/mureka/client";

const DROP_DIR = path.join(process.cwd(), "drop", "mureka-imaging");
const MANIFEST_PATH = path.join(DROP_DIR, "manifest.json");

interface ImagingJob {
  slug: string;
  type: "song" | "instrumental";
  lyrics?: string;
  prompt: string;
  folder: string;
  category: string;
  trimStartSec: number;
  trimDurationSec: number;
  name: string;
}

// Tweak this list to change what gets generated. Lyrics + prompts are
// starting points — feel free to edit before running.
const IMAGING_PACK: ImagingJob[] = [
  {
    slug: "sung_logo_ncr_female_01",
    type: "song",
    lyrics: "North Country Radio — the heart of Americana",
    prompt: "short sung country radio station ID, female voice, upbeat",
    folder: "station_female",
    category: "openers",
    trimStartSec: 10,
    trimDurationSec: 5,
    name: "NCR Sung Logo — female upbeat",
  },
  {
    slug: "sung_logo_ncr_male_01",
    type: "song",
    lyrics: "North Country Radio — where the music lives",
    prompt: "short sung country radio station ID, male warm baritone",
    folder: "station_male",
    category: "openers",
    trimStartSec: 10,
    trimDurationSec: 5,
    name: "NCR Sung Logo — male warm",
  },
  {
    slug: "sung_sweeper_today_yesterday_01",
    type: "song",
    lyrics: "The best of today and yesterday",
    prompt: "sung acoustic country sweeper, male voice, punchy",
    folder: "station_male",
    category: "sweepers",
    trimStartSec: 8,
    trimDurationSec: 4,
    name: "NCR Sung Sweeper — today and yesterday",
  },
  {
    slug: "sung_toh_ncr_01",
    type: "song",
    lyrics: "It's the top of the hour on North Country Radio",
    prompt: "sung country radio top of the hour, female, confident",
    folder: "station_female",
    category: "toh",
    trimStartSec: 12,
    trimDurationSec: 7,
    name: "NCR Sung TOH",
  },
  {
    slug: "sung_jingle_morning_drive_01",
    type: "song",
    lyrics: "Morning Drive with Hank Westwood",
    prompt: "sung Americana morning drive show jingle, warm male voice",
    folder: "hank_westwood",
    category: "openers",
    trimStartSec: 10,
    trimDurationSec: 6,
    name: "Morning Drive Jingle — Hank Westwood",
  },
];

async function main() {
  if (!isMurekaConfigured()) {
    console.error(
      "MUREKA_API_KEY not set. This script only works on the Mureka API tier.\n" +
      "If you are on the $10 web subscription, generate songs in the browser\n" +
      "instead and drop them into drop/mureka-imaging/ with a manifest.json.",
    );
    process.exit(1);
  }

  fs.mkdirSync(DROP_DIR, { recursive: true });

  const manifest: Array<{
    file: string;
    folder: string;
    category: string;
    trimStartSec: number;
    trimDurationSec: number;
    name: string;
    prompt: string;
  }> = [];

  for (const job of IMAGING_PACK) {
    console.log(`\n→ ${job.slug} (${job.type})`);
    try {
      // 1. Kick off generation
      const initial = job.type === "song"
        ? await generateSong({ lyrics: job.lyrics!, prompt: job.prompt, title: job.name })
        : await generateInstrumental({ prompt: job.prompt, title: job.name });

      // 2. Either the response is synchronous (songs already present) or
      //    we need to poll. Both are supported by Mureka.
      const songs = initial.songs && initial.songs.length > 0
        ? initial.songs
        : await waitForJob(initial.jobid);

      // 3. Download the first take
      const first = songs[0];
      const filename = `${job.slug}.mp3`;
      const filePath = path.join(DROP_DIR, filename);
      const buffer = await downloadSongMp3(first);
      fs.writeFileSync(filePath, buffer);
      console.log(`  saved ${filename} (${(buffer.length / 1024).toFixed(0)}KB, ${(first.duration_milliseconds / 1000).toFixed(1)}s)`);

      manifest.push({
        file: filename,
        folder: job.folder,
        category: job.category,
        trimStartSec: job.trimStartSec,
        trimDurationSec: job.trimDurationSec,
        name: job.name,
        prompt: job.prompt,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: ${msg}`);
    }
  }

  // Write manifest so ingest-mureka-assets.ts can pick it up
  const existingManifest = fs.existsSync(MANIFEST_PATH)
    ? (JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8")) as unknown[])
    : [];
  const merged = [...(Array.isArray(existingManifest) ? existingManifest : []), ...manifest];
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(merged, null, 2) + "\n");

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Generated: ${manifest.length} / ${IMAGING_PACK.length}`);
  console.log(`Manifest written: ${MANIFEST_PATH}`);
  console.log(`\nNext step: review the trim windows, then run:`);
  console.log(`  npx tsx scripts/ingest-mureka-assets.ts`);
}

main().catch((err) => { console.error(err); process.exit(1); });
