/**
 * Watch the most recent ImagingPackage. Once all of its ImagingElement
 * rows are audio_ready (or failed):
 *
 *  1. Auto-deploy the new package — create ProducedImaging rows for every
 *     audio_ready element so playout starts pulling from the new audio.
 *  2. Find every ProducedImaging row that points at an old package's audio
 *     file (those would 404 once we remove the files) and delete them.
 *  3. Cascade-delete the older ImagingPackage(s) and remove their audio
 *     files from disk.
 *
 * Run with: npx tsx scripts/watch-new-imaging-package.ts
 */
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/db";

const PUBLIC_AUDIO = path.join(process.cwd(), "public", "audio");
const POLL_MS = 15_000;

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
    select: { id: true, createdAt: true },
  });
  if (pkgs.length < 2) {
    console.log("Fewer than 2 imaging packages — nothing to do.");
    return;
  }
  const newest = pkgs[0];
  const older = pkgs.slice(1);
  console.log(`Watching new package ${newest.id}`);
  console.log(`Will replace ${older.length} older package(s):`);
  for (const o of older) console.log(`  - ${o.id} (${o.createdAt.toISOString()})`);

  // 1. Wait for new package to finish
  while (true) {
    const counts = await prisma.imagingElement.groupBy({
      by: ["status"],
      where: { packageId: newest.id },
      _count: true,
    });
    const statusMap: Record<string, number> = {};
    let total = 0;
    for (const c of counts) {
      statusMap[c.status] = c._count;
      total += c._count;
    }
    const ready = (statusMap["audio_ready"] || 0) + (statusMap["failed"] || 0);
    const pending = total - ready;
    console.log(`[${new Date().toISOString()}] ${ready}/${total} ready (audio_ready=${statusMap["audio_ready"] || 0}, failed=${statusMap["failed"] || 0}, pending=${pending})`);
    if (pending === 0 && total > 0) break;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  // 2. Deploy the new package
  console.log("\nDeploying new package...");
  const deployedCount = await deployPackage(newest.id);
  console.log(`  ${deployedCount} ProducedImaging rows created`);

  // 3. Mark new package as complete
  await prisma.imagingPackage.update({
    where: { id: newest.id },
    data: { status: "complete", generatedCount: deployedCount },
  });

  // 4. Find every ProducedImaging row that points at an old package's audio
  const oldElements = await prisma.imagingElement.findMany({
    where: { packageId: { in: older.map((o) => o.id) } },
    select: { id: true, audioFilePath: true },
  });
  const oldPaths = new Set(oldElements.map((e) => e.audioFilePath).filter(Boolean) as string[]);
  console.log(`\nOld packages: ${oldElements.length} elements, ${oldPaths.size} unique audio paths`);

  // Delete ProducedImaging rows pointing at old paths
  let producedDeleted = 0;
  if (oldPaths.size > 0) {
    const result = await prisma.producedImaging.deleteMany({
      where: { filePath: { in: Array.from(oldPaths) } },
    });
    producedDeleted = result.count;
  }
  console.log(`  ProducedImaging rows deleted: ${producedDeleted}`);

  // 5. Delete old audio files + old packages (cascade deletes elements)
  let filesRemoved = 0;
  for (const el of oldElements) {
    if (unlinkIfExists(el.audioFilePath)) filesRemoved++;
  }
  for (const old of older) {
    await prisma.imagingPackage.delete({ where: { id: old.id } });
    console.log(`  deleted package ${old.id}`);
  }
  console.log(`  audio files removed: ${filesRemoved}`);

  console.log("\nDone. New package deployed, old packages purged.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
