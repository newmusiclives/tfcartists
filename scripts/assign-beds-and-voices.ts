/**
 * Assign music beds and alternate male/female voices to all sponsor ads.
 * Run: npx tsx scripts/assign-beds-and-voices.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const station = await prisma.station.findFirst({ where: { isActive: true } });
  if (!station) { console.error("No station"); process.exit(1); }

  const beds = await prisma.musicBed.findMany({
    where: { stationId: station.id, isActive: true },
    orderBy: { name: "asc" },
  });

  if (beds.length === 0) {
    console.error("No music beds found");
    process.exit(1);
  }

  console.log(`Music beds available: ${beds.map(b => b.name).join(", ")}`);

  // Get all ads sorted by title for consistent ordering
  const ads = await prisma.sponsorAd.findMany({
    where: { stationId: station.id },
    orderBy: { adTitle: "asc" },
  });

  console.log(`Total ads: ${ads.length}`);

  // Remove duplicates - keep the one with a script or the newer one
  const seen = new Map<string, typeof ads[0]>();
  for (const ad of ads) {
    const key = ad.adTitle;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, ad);
    } else {
      // Keep the one with a script, or the newer one
      if (ad.scriptText && !existing.scriptText) {
        // Delete the old one, keep the new
        await prisma.sponsorAd.delete({ where: { id: existing.id } });
        console.log(`  DEDUP: deleted older "${key}" (no script)`);
        seen.set(key, ad);
      } else {
        // Delete this duplicate
        await prisma.sponsorAd.delete({ where: { id: ad.id } });
        console.log(`  DEDUP: deleted duplicate "${key}"`);
      }
    }
  }

  const uniqueAds = Array.from(seen.values());
  console.log(`\nUnique ads after dedup: ${uniqueAds.length}`);

  // Assign music beds (rotate through them) and alternate voice
  const voices = ["male", "female"];
  let updated = 0;

  for (let i = 0; i < uniqueAds.length; i++) {
    const ad = uniqueAds[i];
    const bed = beds[i % beds.length];
    const voice = voices[i % 2];

    const metadata = { ...(ad.metadata as Record<string, unknown> || {}), voiceType: voice };

    await prisma.sponsorAd.update({
      where: { id: ad.id },
      data: {
        musicBedId: bed.id,
        metadata,
      },
    });

    console.log(`  ${ad.adTitle.padEnd(40)} bed=${bed.name.padEnd(25)} voice=${voice}`);
    updated++;
  }

  console.log(`\nDone: ${updated} ads updated with beds and voice assignments`);
  await prisma.$disconnect();
}

main().catch(console.error);
