/**
 * Update imaging voice metadata with audio file paths.
 * Run with: npx tsx scripts/update-imaging-paths.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const voices = await prisma.stationImagingVoice.findMany({
    where: { stationId: "cmls8oc3c00ku7d3fgc19wrvl", isActive: true },
  });

  for (const voice of voices) {
    const meta = voice.metadata as {
      scripts?: Record<string, Array<{ label: string; text: string; musicBed?: string; audioFilePath?: string }>>;
    } | null;
    if (!meta?.scripts) continue;

    const voiceSlug = voice.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    for (const [scriptType, scripts] of Object.entries(meta.scripts)) {
      for (const script of scripts) {
        const safeLabel = script.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        script.audioFilePath = `/audio/imaging/${voiceSlug}-${scriptType}-${safeLabel}.wav`;
      }
    }

    await prisma.stationImagingVoice.update({
      where: { id: voice.id },
      data: { metadata: meta },
    });

    console.log(`Updated: ${voice.displayName}`);
    for (const [scriptType, scripts] of Object.entries(meta.scripts)) {
      for (const script of scripts) {
        console.log(`  ${scriptType}/${script.label}: ${script.audioFilePath}`);
      }
    }
  }

  console.log("\nDone!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
