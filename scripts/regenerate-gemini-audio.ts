/**
 * Regenerate all imaging package audio and sponsor ad audio with Gemini.
 *
 * Background: until the StationImagingVoice rows had their legacy ElevenLabs
 * IDs replaced with valid Gemini voice names, every imaging Gemini call was
 * failing and silently falling back to OpenAI echo. Now that the voices are
 * fixed AND the OpenAI fallback has been removed, we need to regenerate all
 * existing imaging + sponsor audio so it actually uses Gemini.
 *
 * Safe to re-run — only regenerates rows whose audio is currently missing or
 * being explicitly reset.
 *
 * Run with: npx tsx scripts/regenerate-gemini-audio.ts
 */
import { prisma } from "../src/lib/db";
import { generatePackageAudio } from "../src/lib/radio/imaging-package-generator";
import { generateSponsorAdAudio } from "../src/lib/radio/sponsor-ad-tts";
import fs from "fs";
import path from "path";

const PUBLIC_AUDIO = path.join(process.cwd(), "public", "audio");

function unlinkIfExists(filePath: string | null) {
  if (!filePath) return;
  // filePath is stored like "/audio/imaging-packages/img-xxx.wav" — strip
  // leading slash and resolve under /public.
  if (filePath.startsWith("data:")) return;
  const rel = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  const abs = path.join(process.cwd(), "public", rel);
  if (abs.startsWith(PUBLIC_AUDIO) && fs.existsSync(abs)) {
    fs.unlinkSync(abs);
  }
}

async function regenerateImaging() {
  console.log("=== Imaging packages: reset + regenerate ===");
  const packages = await prisma.imagingPackage.findMany({
    select: { id: true, stationId: true, status: true },
  });

  for (const pkg of packages) {
    const elements = await prisma.imagingElement.findMany({
      where: { packageId: pkg.id },
      select: { id: true, audioFilePath: true },
    });
    console.log(`\nPackage ${pkg.id} — ${elements.length} elements`);

    // Delete old audio files and reset element state to script_ready so the
    // generator will pick them up.
    for (const el of elements) {
      unlinkIfExists(el.audioFilePath);
    }
    await prisma.imagingElement.updateMany({
      where: { packageId: pkg.id },
      data: { status: "script_ready", audioFilePath: null, audioDuration: null, error: null },
    });

    const result = await generatePackageAudio(pkg.id);
    console.log(`  generated=${result.generated} errors=${result.errors.length}`);
    for (const err of result.errors) console.log(`    ! ${err}`);
  }
}

async function regenerateSponsorAds() {
  console.log("\n=== Sponsor ads: reset + regenerate ===");
  const ads = await prisma.sponsorAd.findMany({
    where: { scriptText: { not: null } },
    select: { id: true, adTitle: true, audioFilePath: true },
  });

  for (const ad of ads) {
    unlinkIfExists(ad.audioFilePath);
    // Clear audio fields so generateSponsorAdAudio doesn't bail out on the
    // "audio already exists" guard.
    await prisma.sponsorAd.update({
      where: { id: ad.id },
      data: { audioFilePath: null, audioDataUri: null, durationSeconds: null },
    });

    try {
      await generateSponsorAdAudio(ad.id);
      console.log(`  OK   ${ad.adTitle}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL ${ad.adTitle}: ${msg}`);
    }
  }
}

async function main() {
  await regenerateImaging();
  await regenerateSponsorAds();
  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
