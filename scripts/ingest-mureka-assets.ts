/**
 * Ingest Mureka-generated imaging assets.
 *
 * Reads drop/mureka-imaging/manifest.json, trims each referenced mp3 with
 * ffmpeg, uploads the trimmed version to R2 (or local disk), scp's it to
 * the Hetzner streaming server so Liquidsoap picks it up on the next
 * category rotation, and writes a ProducedImaging DB row so the asset is
 * visible to the rotation logic.
 *
 * Usage:
 *   npx tsx scripts/ingest-mureka-assets.ts
 *   npx tsx scripts/ingest-mureka-assets.ts --dry-run
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { prisma } from "../src/lib/db";
import { uploadFile, isR2Configured } from "../src/lib/storage";

const DROP_DIR = path.join(process.cwd(), "drop", "mureka-imaging");
const PROCESSED_DIR = path.join(DROP_DIR, "processed");
const TMP_DIR = path.join(DROP_DIR, ".tmp");
const MANIFEST_PATH = path.join(DROP_DIR, "manifest.json");

const HETZNER_HOST = "root@89.167.23.152";
const HETZNER_BASE = "/mnt/audio_library/station_assets/truefans-radio-assets";

const VALID_FOLDERS = new Set([
  "station_male", "station_female",
  "hank_westwood", "loretta_merrick", "doc_holloway", "cody_rampart", "night_owl",
]);
const VALID_CATEGORIES = new Set(["openers", "sweepers", "toh", "teasers", "features"]);

// ProducedImaging.category uses the schema's enum-ish set. Map the
// Hetzner folder name to the closest DB category value.
const DB_CATEGORY_MAP: Record<string, string> = {
  openers: "station_id",
  sweepers: "sweeper",
  toh: "toh",
  teasers: "promo",
  features: "positioning",
};

interface ManifestEntry {
  file: string;
  folder: string;
  category: string;
  trimStartSec: number;
  trimDurationSec: number;
  name: string;
  prompt?: string;
}

function validate(entry: ManifestEntry, idx: number): string[] {
  const errs: string[] = [];
  if (!entry.file || !entry.file.endsWith(".mp3")) errs.push(`entry ${idx}: file must end in .mp3`);
  if (!VALID_FOLDERS.has(entry.folder)) errs.push(`entry ${idx}: folder "${entry.folder}" not in ${[...VALID_FOLDERS].join(", ")}`);
  if (!VALID_CATEGORIES.has(entry.category)) errs.push(`entry ${idx}: category "${entry.category}" not in ${[...VALID_CATEGORIES].join(", ")}`);
  if (!(entry.trimStartSec >= 0)) errs.push(`entry ${idx}: trimStartSec must be >= 0`);
  if (!(entry.trimDurationSec > 0 && entry.trimDurationSec <= 30)) errs.push(`entry ${idx}: trimDurationSec must be 0 < x <= 30`);
  if (!entry.name) errs.push(`entry ${idx}: name required`);
  const src = path.join(DROP_DIR, entry.file);
  if (!fs.existsSync(src)) errs.push(`entry ${idx}: file not found at ${src}`);
  return errs;
}

function trimWithFfmpeg(input: string, output: string, startSec: number, durationSec: number): void {
  // -ss before -i is faster but less accurate; after -i is sample-accurate.
  // We want accuracy for short hooks. Re-encode to a consistent bitrate.
  execSync(
    `ffmpeg -y -i "${input}" -ss ${startSec} -t ${durationSec} -acodec libmp3lame -b:a 192k -ac 2 -ar 44100 "${output}"`,
    { stdio: ["ignore", "ignore", "pipe"], timeout: 30_000 },
  );
}

function scpToHetzner(localPath: string, folder: string, category: string, filename: string): void {
  const remoteDir = `${HETZNER_BASE}/${folder}/${category}`;
  execSync(
    `ssh -o StrictHostKeyChecking=no ${HETZNER_HOST} "mkdir -p ${remoteDir}"`,
    { stdio: ["ignore", "ignore", "pipe"], timeout: 15_000 },
  );
  execSync(
    `scp -o StrictHostKeyChecking=no "${localPath}" ${HETZNER_HOST}:${remoteDir}/${filename}`,
    { stdio: ["ignore", "inherit", "inherit"], timeout: 60_000 },
  );
}

function probeDurationSec(filePath: string): number {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { timeout: 10_000 },
    ).toString().trim();
    return parseFloat(out) || 0;
  } catch {
    return 0;
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) console.log("[DRY RUN — no uploads, no DB writes, no scp]\n");

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`No manifest found at ${MANIFEST_PATH}`);
    console.error(`Copy manifest.example.json to manifest.json and edit it to match your dropped files.`);
    process.exit(1);
  }

  const manifest: ManifestEntry[] = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  if (!Array.isArray(manifest) || manifest.length === 0) {
    console.error("Manifest is empty or not an array");
    process.exit(1);
  }

  const allErrs: string[] = [];
  manifest.forEach((e, i) => allErrs.push(...validate(e, i)));
  if (allErrs.length > 0) {
    console.error("Manifest validation failed:");
    for (const e of allErrs) console.error(" -", e);
    process.exit(1);
  }

  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });

  const station = await prisma.station.findFirst({ select: { id: true, callSign: true } });
  if (!station) {
    console.error("No Station row in DB — cannot attach ProducedImaging rows");
    process.exit(1);
  }
  console.log(`Station: ${station.callSign ?? station.id}`);

  let processed = 0;
  const errors: string[] = [];

  for (const entry of manifest) {
    const src = path.join(DROP_DIR, entry.file);
    const stem = entry.file.replace(/\.mp3$/i, "");
    const trimmedName = `mureka_${stem}_t${Math.round(entry.trimStartSec * 10) / 10}-${entry.trimDurationSec}s.mp3`;
    const trimmedPath = path.join(TMP_DIR, trimmedName);

    try {
      console.log(`\n→ ${entry.file}`);
      console.log(`  name:     ${entry.name}`);
      console.log(`  target:   ${entry.folder}/${entry.category}/${trimmedName}`);
      console.log(`  trim:     ${entry.trimStartSec}s +${entry.trimDurationSec}s`);

      if (dryRun) {
        processed++;
        continue;
      }

      // 1. Trim
      trimWithFfmpeg(src, trimmedPath, entry.trimStartSec, entry.trimDurationSec);
      const actualDuration = probeDurationSec(trimmedPath);
      console.log(`  trimmed:  ${(fs.statSync(trimmedPath).size / 1024).toFixed(1)}KB, ${actualDuration.toFixed(2)}s`);

      // 2. Upload to R2 (or local fallback)
      const buf = fs.readFileSync(trimmedPath);
      let publicUrl: string;
      if (isR2Configured()) {
        publicUrl = await uploadFile(buf, "produced-imaging", trimmedName);
        console.log(`  r2:       ${publicUrl}`);
      } else {
        const localDir = path.join(process.cwd(), "public", "audio", "produced-imaging");
        fs.mkdirSync(localDir, { recursive: true });
        fs.writeFileSync(path.join(localDir, trimmedName), buf);
        publicUrl = `/audio/produced-imaging/${trimmedName}`;
        console.log(`  local:    ${publicUrl}`);
      }

      // 3. scp to Hetzner
      scpToHetzner(trimmedPath, entry.folder, entry.category, trimmedName);
      console.log(`  hetzner:  ${HETZNER_BASE}/${entry.folder}/${entry.category}/${trimmedName}`);

      // 4. Create DB row
      const dbCategory = DB_CATEGORY_MAP[entry.category] ?? "sweeper";
      await prisma.producedImaging.create({
        data: {
          stationId: station.id,
          name: entry.name,
          fileName: trimmedName,
          filePath: publicUrl,
          durationSeconds: actualDuration || entry.trimDurationSec,
          category: dbCategory,
          isActive: true,
          metadata: {
            source: "mureka",
            ingestedAt: new Date().toISOString(),
            hetznerFolder: entry.folder,
            hetznerCategory: entry.category,
            originalFile: entry.file,
            trimStartSec: entry.trimStartSec,
            trimDurationSec: entry.trimDurationSec,
            prompt: entry.prompt ?? null,
          },
        },
      });
      console.log(`  db:       ProducedImaging (category=${dbCategory})`);

      // 5. Archive the source
      const processedPath = path.join(PROCESSED_DIR, `${Date.now()}_${entry.file}`);
      fs.renameSync(src, processedPath);
      console.log(`  archived: drop/mureka-imaging/processed/${path.basename(processedPath)}`);

      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: ${msg}`);
      errors.push(`${entry.file}: ${msg}`);
    }
  }

  // Clear manifest so the next run doesn't reprocess stale entries (only if fully successful)
  if (!dryRun && processed === manifest.length && errors.length === 0) {
    fs.writeFileSync(MANIFEST_PATH, "[]\n");
    console.log(`\nManifest cleared (all ${processed} entries ingested)`);
  }

  // Clean up tmp dir
  try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch { /* ignore */ }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Processed: ${processed} / ${manifest.length}`);
  if (errors.length > 0) {
    console.log(`Errors:    ${errors.length}`);
    for (const e of errors) console.log(`  - ${e}`);
    process.exit(1);
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
