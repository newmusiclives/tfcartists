/**
 * Sync station imaging scripts to imaging voice metadata.
 * Maps station.metadata.imagingScripts categories to voice.metadata.scripts types.
 * Run with: npx tsx scripts/sync-imaging-voices.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STATION_ID = "cmm3sum5b00lq7d120drjrew8";

interface ImagingScript {
  label: string;
  text: string;
  musicBed: string;
  audioFilePath?: string;
  hasMusicBed?: boolean;
  audioDuration?: number;
}

async function main() {
  // 1. Load station imaging scripts
  const station = await prisma.station.findUnique({
    where: { id: STATION_ID },
    select: { metadata: true, name: true },
  });
  if (!station) throw new Error("Station not found");

  const meta = station.metadata as Record<string, unknown>;
  const imagingScripts = (meta.imagingScripts || {}) as Record<string, ImagingScript[]>;

  console.log(`Station: ${station.name}`);
  console.log(`Imaging script categories: ${Object.keys(imagingScripts).join(", ")}`);

  // 2. Load imaging voices
  const voices = await prisma.stationImagingVoice.findMany({
    where: { stationId: STATION_ID, isActive: true },
  });

  console.log(`\nImaging voices: ${voices.length}`);

  // 3. Build voice scripts from station categories
  // Map station categories to voice script types:
  //   toh → station_id
  //   sweeper_general + sweeper_* → sweeper
  //   promo_general + promo_* → promo
  //   overnight → station_id (secondary set)

  const stationIds = [
    ...(imagingScripts.toh || []),
  ];

  const sweepers = [
    ...(imagingScripts.sweeper_general || []),
    ...(imagingScripts.sweeper_hank_westwood || []),
    ...(imagingScripts.sweeper_loretta_merrick || []),
    ...(imagingScripts.sweeper_doc_holloway || []),
    ...(imagingScripts.sweeper_cody_rampart || []),
  ];

  const promos = [
    ...(imagingScripts.promo_general || []),
    ...(imagingScripts.promo_hank_westwood || []),
    ...(imagingScripts.promo_loretta_merrick || []),
    ...(imagingScripts.promo_doc_holloway || []),
    ...(imagingScripts.promo_cody_rampart || []),
  ];

  const overnightScripts = imagingScripts.overnight || [];

  console.log(`\nScript totals:`);
  console.log(`  station_id: ${stationIds.length} (from toh)`);
  console.log(`  sweeper: ${sweepers.length} (general + 4 DJs)`);
  console.log(`  promo: ${promos.length} (general + 4 DJs)`);
  console.log(`  overnight: ${overnightScripts.length}`);

  // 4. Split scripts between the two voices (alternate for variety)
  for (const voice of voices) {
    const voiceMeta = (voice.metadata as Record<string, unknown>) || {};
    const isFirstVoice = voice.voiceType === "female"; // NCR Power Voice gets odd indices

    // Alternate scripts between voices
    const filterByIndex = (arr: ImagingScript[], isFirst: boolean) =>
      arr.filter((_, i) => (isFirst ? i % 2 === 0 : i % 2 === 1));

    // If only 2 voices, ensure all scripts get assigned
    const voiceStationIds = filterByIndex(stationIds, isFirstVoice);
    const voiceSweepers = filterByIndex(sweepers, isFirstVoice);
    const voicePromos = filterByIndex(promos, isFirstVoice);
    const voiceOvernight = filterByIndex(overnightScripts, isFirstVoice);

    // Merge overnight into station_id for overnight voice usage
    const allStationIds = [...voiceStationIds, ...voiceOvernight];

    const newScripts = {
      station_id: allStationIds.map(s => ({
        label: s.label,
        text: s.text,
        musicBed: s.musicBed,
      })),
      sweeper: voiceSweepers.map(s => ({
        label: s.label,
        text: s.text,
        musicBed: s.musicBed,
      })),
      promo: voicePromos.map(s => ({
        label: s.label,
        text: s.text,
        musicBed: s.musicBed,
      })),
      // Keep existing commercial scripts
      commercial: ((voiceMeta.scripts as Record<string, unknown[]>)?.commercial || []) as ImagingScript[],
    };

    console.log(`\n  ${voice.displayName} (${voice.voiceType}):`);
    console.log(`    station_id: ${newScripts.station_id.length}`);
    console.log(`    sweeper: ${newScripts.sweeper.length}`);
    console.log(`    promo: ${newScripts.promo.length}`);
    console.log(`    commercial: ${newScripts.commercial.length}`);

    await prisma.stationImagingVoice.update({
      where: { id: voice.id },
      data: {
        metadata: {
          ...voiceMeta,
          scripts: newScripts,
        },
      },
    });

    console.log(`    → Updated!`);
  }

  console.log("\nDone! Voice scripts synced from station imaging scripts.");
  console.log("Run generate-audio to create TTS audio for all scripts.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
