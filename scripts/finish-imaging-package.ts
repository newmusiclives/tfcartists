/**
 * Finish a partially-generated ImagingPackage from the command line where
 * there's no Netlify function timeout. Then deploy + clean up older
 * packages and orphan ProducedImaging rows.
 *
 * Steps:
 *   1. Wipe whatever elements/audio already exist on the newest package
 *      (the partial 75 of 158 from the timed-out generation).
 *   2. Run generatePackageScripts to create all 158 element rows + scripts.
 *   3. Run generatePackageAudio to render every element via Gemini.
 *   4. Deploy the new package — copy elements into ProducedImaging.
 *   5. Delete ProducedImaging rows pointing at older packages' audio files.
 *   6. Cascade-delete the older ImagingPackage(s) and their audio files.
 *
 * Run with: npx tsx scripts/finish-imaging-package.ts
 */
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/db";
import {
  generatePackageScripts,
  generatePackageAudio,
} from "../src/lib/radio/imaging-package-generator";

const PUBLIC_AUDIO = path.join(process.cwd(), "public", "audio");

const ELEMENT_TYPE_TO_PRODUCED_CATEGORY: Record<string, string> = {
  toh: "id",
  station_id: "id",
  sweeper: "sweeper",
  promo: "promo",
  show_intro: "other",
  show_outro: "other",
  handoff: "other",
  feature_bumper: "other",
};

function unlinkIfExists(filePath: string | null): boolean {
  if (!filePath || filePath.startsWith("data:")) return false;
  const rel = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  const abs = path.join(process.cwd(), "public", rel);
  if (!abs.startsWith(PUBLIC_AUDIO)) return false;
  if (!fs.existsSync(abs)) return false;
  fs.unlinkSync(abs);
  return true;
}

async function deployPackage(packageId: string): Promise<number> {
  const pkg = await prisma.imagingPackage.findUnique({
    where: { id: packageId },
    include: {
      elements: { where: { status: "audio_ready", audioFilePath: { not: null } } },
    },
  });
  if (!pkg) throw new Error(`Package ${packageId} not found`);

  let deployed = 0;
  for (const el of pkg.elements) {
    if (!el.audioFilePath) continue;
    const fileName = `${el.elementType}-${el.variationNum}${el.djName ? `-${el.djName}` : ""}.wav`;
    await prisma.producedImaging.create({
      data: {
        stationId: pkg.stationId,
        name: el.label || `${el.elementType} #${el.variationNum}`,
        fileName,
        filePath: el.audioFilePath,
        category: ELEMENT_TYPE_TO_PRODUCED_CATEGORY[el.elementType] || "sweeper",
        durationSeconds: el.audioDuration || 0,
        isActive: true,
      },
    });
    deployed++;
  }
  return deployed;
}

async function main() {
  const pkgs = await prisma.imagingPackage.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, totalElements: true, tier: true },
  });
  if (pkgs.length < 1) {
    console.log("No imaging packages.");
    return;
  }
  const newest = pkgs[0];
  const older = pkgs.slice(1);
  console.log(`Newest package: ${newest.id} (${newest.tier}, expects ${newest.totalElements} elements)`);
  console.log(`Older packages to purge after deploy: ${older.length}`);

  // 1. Wipe partial state on the newest package
  console.log("\n=== Step 1: wipe existing elements on new package ===");
  const existing = await prisma.imagingElement.findMany({
    where: { packageId: newest.id },
    select: { id: true, audioFilePath: true },
  });
  let wipedFiles = 0;
  for (const el of existing) {
    if (unlinkIfExists(el.audioFilePath)) wipedFiles++;
  }
  await prisma.imagingElement.deleteMany({ where: { packageId: newest.id } });
  console.log(`  removed ${existing.length} element rows, ${wipedFiles} files`);
  await prisma.imagingPackage.update({
    where: { id: newest.id },
    data: { status: "pending", generatedCount: 0, failedCount: 0 },
  });

  // 2. Generate scripts
  console.log("\n=== Step 2: generate scripts ===");
  const scripts = await generatePackageScripts(newest.id);
  console.log(`  scripts generated: ${scripts.generated}`);
  if (scripts.errors.length > 0) {
    console.log(`  errors:`);
    for (const e of scripts.errors) console.log(`    ! ${e}`);
  }

  // 3. Generate audio
  console.log("\n=== Step 3: generate audio (Gemini) ===");
  const audio = await generatePackageAudio(newest.id);
  console.log(`  audio generated: ${audio.generated}`);
  if (audio.errors.length > 0) {
    console.log(`  errors:`);
    for (const e of audio.errors) console.log(`    ! ${e}`);
  }

  // 4. Deploy new package
  console.log("\n=== Step 4: deploy new package ===");
  const deployed = await deployPackage(newest.id);
  console.log(`  ${deployed} ProducedImaging rows created`);
  await prisma.imagingPackage.update({
    where: { id: newest.id },
    data: { status: "complete", generatedCount: deployed },
  });

  if (older.length === 0) {
    console.log("\nNo older packages to purge. Done.");
    return;
  }

  // 5. Delete orphan ProducedImaging rows pointing at old packages
  console.log("\n=== Step 5: clean up orphan ProducedImaging rows ===");
  const oldElements = await prisma.imagingElement.findMany({
    where: { packageId: { in: older.map((o) => o.id) } },
    select: { id: true, audioFilePath: true },
  });
  const oldPaths = Array.from(
    new Set(oldElements.map((e) => e.audioFilePath).filter(Boolean) as string[]),
  );
  console.log(`  ${oldElements.length} old elements, ${oldPaths.length} unique audio paths`);
  let producedDeleted = 0;
  if (oldPaths.length > 0) {
    const result = await prisma.producedImaging.deleteMany({
      where: { filePath: { in: oldPaths } },
    });
    producedDeleted = result.count;
  }
  console.log(`  deleted ${producedDeleted} ProducedImaging rows`);

  // 6. Delete old packages + audio files
  console.log("\n=== Step 6: delete old packages ===");
  let filesRemoved = 0;
  for (const el of oldElements) {
    if (unlinkIfExists(el.audioFilePath)) filesRemoved++;
  }
  for (const old of older) {
    await prisma.imagingPackage.delete({ where: { id: old.id } });
    console.log(`  deleted package ${old.id}`);
  }
  console.log(`  removed ${filesRemoved} audio files`);

  console.log("\nAll done. New package built, deployed, and old purged.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
