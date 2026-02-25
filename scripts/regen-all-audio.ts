/**
 * Regenerate ALL station audio with improved settings:
 * - Imaging (sweepers, promos, TOH, commercials) with music beds + energetic voices
 * - Sponsor ads with louder voice + audible music beds
 *
 * Calls the API routes which have the updated audio settings.
 * Requires dev server running: npm run dev
 *
 * Run: npx tsx scripts/regen-all-audio.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // 1. Get station ID
  const station = await prisma.station.findFirst();
  if (!station) {
    console.error("No station found");
    return;
  }
  console.log(`Station: ${station.name} (${station.id})`);
  console.log(`API base: ${baseUrl}`);

  // 2. Regenerate ALL imaging audio (sweepers, promos, station_id, commercial)
  console.log("\n=== REGENERATING IMAGING AUDIO ===");
  console.log("  Voices: echo (male), shimmer (female) — punchy radio imaging");
  console.log("  Voice gain: 4.5x | Bed gain: 0.55 | Tight fades");

  const imagingResponse = await fetch(`${baseUrl}/api/station-imaging/generate-audio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stationId: station.id,
      types: ["station_id", "sweeper", "promo", "commercial"],
    }),
  });

  if (imagingResponse.ok) {
    const data = await imagingResponse.json();
    console.log(`\nResult: ${data.message}`);
    for (const r of data.results || []) {
      const status = r.success ? "OK" : "FAIL";
      const bed = r.hasMusicBed ? " +bed" : "";
      const err = r.error ? ` ERROR: ${r.error}` : "";
      console.log(`  [${status}] ${r.voiceName} | ${r.type} | ${r.label}${bed}${err}`);
    }
  } else {
    const text = await imagingResponse.text();
    console.error(`Imaging generation failed: ${imagingResponse.status} ${text}`);
  }

  // 3. Regenerate ALL sponsor ad audio
  console.log("\n=== REGENERATING SPONSOR AD AUDIO ===");
  console.log("  Voice gain: 3.5x | Bed gain: 0.7");

  const ads = await prisma.sponsorAd.findMany({
    where: { isActive: true, scriptText: { not: null } },
    include: { musicBed: true },
  });
  console.log(`  Found ${ads.length} ads to regenerate\n`);

  for (const ad of ads) {
    try {
      const adResponse = await fetch(`${baseUrl}/api/sponsor-ads/${ad.id}/generate-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (adResponse.ok) {
        const adData = await adResponse.json();
        const bed = ad.musicBed ? ` +bed[${ad.musicBed.name}]` : "";
        console.log(`  [OK] ${ad.adTitle} (${adData.ad?.durationSeconds}s)${bed}`);
      } else {
        console.error(`  [FAIL] ${ad.adTitle}: HTTP ${adResponse.status}`);
      }
    } catch (err) {
      console.error(`  [ERROR] ${ad.adTitle}: ${err}`);
    }
  }

  // 4. Verify results
  console.log("\n=== VERIFICATION ===");
  const voices = await prisma.stationImagingVoice.findMany({ where: { isActive: true } });
  for (const v of voices) {
    const meta = v.metadata as any;
    const scripts = meta?.scripts || {};
    for (const type of Object.keys(scripts)) {
      const list = scripts[type] || [];
      const withAudio = list.filter((s: any) => s.audioFilePath).length;
      const withBed = list.filter((s: any) => s.hasMusicBed).length;
      const withDur = list.filter((s: any) => s.audioDuration).length;
      console.log(`  ${v.displayName} [${v.voiceType}] | ${type}: ${list.length} scripts, ${withAudio} audio, ${withBed} bed, ${withDur} duration`);
    }
  }

  const updatedAds = await prisma.sponsorAd.findMany({
    where: { isActive: true },
    select: { adTitle: true, audioFilePath: true, durationSeconds: true },
  });
  for (const ad of updatedAds) {
    console.log(`  Ad: ${ad.adTitle} (${ad.durationSeconds}s)`);
  }

  await prisma.$disconnect();
  console.log("\nDone! Commit the regenerated audio files and deploy.");
}

main().catch(console.error);
