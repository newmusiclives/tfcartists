/**
 * Re-seed sponsor ad database records from existing audio files.
 * Run: npx tsx scripts/reseed-sponsor-ads.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const COMMERCIALS_DIR = path.join(process.cwd(), "public", "audio", "commercials");

const AD_METADATA: Record<string, { sponsorName: string; adTitle: string }> = {
  "amp-community": { sponsorName: "AMP", adTitle: "AMP Community" },
  "amp-for-artists": { sponsorName: "AMP", adTitle: "AMP For Artists" },
  "amp-newsletter": { sponsorName: "AMP", adTitle: "AMP Newsletter" },
  "fox-bones-good-vibes": { sponsorName: "Fox Bones", adTitle: "Fox Bones Good Vibes" },
  "fox-bones-pnw-award": { sponsorName: "Fox Bones", adTitle: "Fox Bones PNW Award" },
  "fox-bones-scott-sarah": { sponsorName: "Fox Bones", adTitle: "Fox Bones Scott & Sarah" },
  "lightwork-digital-big-reach": { sponsorName: "Lightwork Digital", adTitle: "Big Reach Campaign" },
  "lightwork-digital-discovery-call": { sponsorName: "Lightwork Digital", adTitle: "Discovery Call" },
  "lightwork-digital-search": { sponsorName: "Lightwork Digital", adTitle: "Search Marketing" },
  "tfc-direct-support": { sponsorName: "TrueFans Connect", adTitle: "Direct Support" },
  "tfc-live-donation": { sponsorName: "TrueFans Connect", adTitle: "Live Donation" },
  "tfc-no-middlemen": { sponsorName: "TrueFans Connect", adTitle: "No Middlemen" },
  "ad-auto-insurance-savings": { sponsorName: "Local Business", adTitle: "Auto Insurance Savings" },
  "ad-bike-trail-week": { sponsorName: "Local Business", adTitle: "Bike Trail Week" },
  "ad-bike-trial-week": { sponsorName: "Local Business", adTitle: "Bike Trial Week" },
  "ad-craft-spirits-tasting": { sponsorName: "Local Business", adTitle: "Craft Spirits Tasting" },
  "ad-fresh-arrangements-weekly": { sponsorName: "Local Business", adTitle: "Fresh Arrangements Weekly" },
  "ad-fresh-daily-pastries": { sponsorName: "Local Business", adTitle: "Fresh Daily Pastries" },
  "ad-morning-coffee-special": { sponsorName: "Local Business", adTitle: "Morning Coffee Special" },
  "ad-new-seasonal-ipa": { sponsorName: "Local Business", adTitle: "New Seasonal IPA" },
  "ad-spring-hiking-sale": { sponsorName: "Local Business", adTitle: "Spring Hiking Sale" },
  "ad-support-independent-artists": { sponsorName: "TrueFans Connect", adTitle: "Support Independent Artists" },
};

async function main() {
  const station = await prisma.station.findFirst({ where: { isActive: true } });
  if (!station) { console.error("No station"); process.exit(1); }
  console.log(`Station: ${station.name} (${station.id})`);

  const existing = await prisma.sponsorAd.findMany({ where: { stationId: station.id } });
  console.log(`Existing DB records: ${existing.length}`);

  const files = fs.readdirSync(COMMERCIALS_DIR).filter(f => f.endsWith(".wav") || f.endsWith(".mp3"));
  console.log(`Audio files found: ${files.length}`);

  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = `/audio/commercials/${file}`;

    const existingRecord = existing.find(e => e.audioFilePath === filePath);
    if (existingRecord) {
      console.log(`  SKIP: ${file}`);
      skipped++;
      continue;
    }

    // Strip extension and random suffixes like -3vnqgn
    const baseName = file.replace(/\.(wav|mp3)$/, "").replace(/-[a-z0-9]{6}$/, "");
    const meta = AD_METADATA[baseName];

    const sponsorName = meta?.sponsorName || "Station Promo";
    const adTitle = meta?.adTitle || baseName.replace(/^ad-/, "").split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    await prisma.sponsorAd.create({
      data: {
        stationId: station.id,
        sponsorName,
        adTitle,
        audioFilePath: filePath,
        durationSeconds: 20,
        isActive: true,
      },
    });
    console.log(`  CREATED: ${adTitle} (${sponsorName})`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
  await prisma.$disconnect();
}

main().catch(console.error);
