/**
 * Backfill sponsor ad scriptText from imaging voice commercial scripts.
 * Run: npx tsx scripts/backfill-ad-scripts.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Map ad audio filenames to their scripts (from imaging voice metadata)
const SCRIPTS: Record<string, string> = {
  // NCR Power Voice commercials
  "tfc-live-donation": "Going to a show tonight? Open True Fans CONNECT and send your favorite artist a live donation — right from your phone. They keep ninety-two percent. No middlemen. Just you and the music. Download True Fans CONNECT — because the best way to support an artist is directly.",
  "amp-for-artists": "If you're an independent artist trying to make it, you need the AMP. It's the newsletter, community, and toolkit built just for you. Get heard. Get supported. Get the AMP at NewMusicLives dot com.",
  "lightwork-digital-search": "Your customers are searching for you right now. Are they finding you? Lightwork Digital makes sure they do — with local SEO, Google Ads, and websites that actually work. Visit LightworkDigital dot com.",
  "fox-bones-scott-sarah": "Scott and Sarah are Fox and Bones — equal parts folk, pop, Americana, and soul. Their album Long Time Coming is streaming everywhere. Find them at FoxAndBones dot com.",
  "amp-community": "New Music Lives — where independent artists find their voice. Get the AMP Newsletter, join the community, and discover new music every week at NewMusicLives dot com.",
  "fox-bones-good-vibes": "If you love Americana with heart and a smile, you'll love Fox and Bones. Album of the year vibes. Streaming now everywhere you listen.",

  // The Voice of NCR commercials
  "tfc-direct-support": "Support the artists you love — live and in person. True Fans CONNECT is the free app that lets you send donations directly to the musicians on stage. Ninety-two percent goes straight to the artist. Download True Fans CONNECT today.",
  "amp-newsletter": "The AMP Newsletter — your weekly backstage pass to independent music. Artist spotlights, industry tips, and community events delivered to your inbox. Subscribe free at NewMusicLives dot com.",
  "lightwork-digital-big-reach": "Small business, big reach. Lightwork Digital builds the websites, runs the ads, and handles the SEO so you can focus on what you do best. Get started at LightworkDigital dot com.",
  "fox-bones-pnw-award": "Fox and Bones — the Portland folk duo you need in your life. Their album Long Time Coming earned PNW Best Album honors. Hear them on North Country Radio and everywhere you stream.",
  "tfc-no-middlemen": "Artists keep ninety-two percent of every fan donation on True Fans CONNECT. No middlemen. No platform fees eating into their earnings. Just fans supporting artists directly. Download True Fans CONNECT.",
  "lightwork-digital-discovery-call": "Need more customers finding you online? Lightwork Digital does local SEO, Google Ads, and web design that drives results. Book a free discovery call at LightworkDigital dot com.",

  // Auto-generated local business ads
  "ad-auto-insurance-savings": "Looking for auto insurance that actually saves you money? Our local agents find you the best rates from top carriers. Call today for a free quote and start saving on your premium.",
  "ad-bike-trail-week": "This week only — bike trail week at the local outfitter! Twenty percent off all trail bikes, helmets, and gear. Hit the trails this weekend. Visit us downtown or shop online.",
  "ad-bike-trial-week": "Try before you buy! Bike trial week means free test rides on our newest models. Come see what's new at the bike shop this weekend.",
  "ad-craft-spirits-tasting": "Join us Saturday for a craft spirits tasting at the distillery. Sample small-batch bourbon, rye, and seasonal cocktails. Twenty-one and over. Reservations recommended.",
  "ad-fresh-arrangements-weekly": "Fresh flower arrangements delivered weekly to your door. Locally grown, beautifully arranged, and always seasonal. Subscribe today and brighten every room in your home.",
  "ad-fresh-daily-pastries": "Start your morning with a fresh pastry from the bakery. Croissants, danishes, and our famous cinnamon rolls — baked fresh daily. Open at six AM, right on Main Street.",
  "ad-morning-coffee-special": "This week's morning coffee special — a large house blend for just two dollars before nine AM. Locally roasted, always fresh. Stop by on your way to work.",
  "ad-new-seasonal-ipa": "Introducing our new seasonal IPA — brewed with local hops and a citrus twist. Available on tap and in cans at the brewery. Grab a six-pack for the weekend.",
  "ad-spring-hiking-sale": "Spring hiking sale! Up to thirty percent off boots, packs, and trail gear. Get ready for the trails with the best local outdoor shop. Sale ends Sunday.",
  "ad-support-independent-artists": "Support independent artists on North Country Radio. When you listen, share, and connect through True Fans, you're helping real musicians make a living doing what they love.",
};

async function main() {
  const station = await prisma.station.findFirst({ where: { isActive: true } });
  if (!station) { console.error("No station"); process.exit(1); }

  const ads = await prisma.sponsorAd.findMany({
    where: { stationId: station.id, scriptText: null },
  });

  console.log(`Ads without scripts: ${ads.length}`);
  let updated = 0;

  for (const ad of ads) {
    if (!ad.audioFilePath) continue;

    // Extract base name from audio path
    const fileName = ad.audioFilePath.split("/").pop() || "";
    const baseName = fileName.replace(/\.(wav|mp3)$/, "").replace(/-[a-z0-9]{6}$/, "");

    const script = SCRIPTS[baseName];
    if (script) {
      await prisma.sponsorAd.update({
        where: { id: ad.id },
        data: { scriptText: script },
      });
      console.log(`  UPDATED: ${ad.adTitle}`);
      updated++;
    } else {
      console.log(`  NO MATCH: ${ad.adTitle} (${baseName})`);
    }
  }

  console.log(`\nDone: ${updated} updated`);
  await prisma.$disconnect();
}

main().catch(console.error);
