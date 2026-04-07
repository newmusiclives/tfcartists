import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get all DJs with voice config
  const djs = await prisma.dJ.findMany({
    select: {
      id: true,
      name: true,
      ttsVoice: true,
      ttsProvider: true,
      stationId: true,
    },
    orderBy: { name: "asc" },
  });

  console.log("=== DJ VOICES ===");
  console.log(JSON.stringify(djs, null, 2));

  // Get all station imaging voices
  const imaging = await prisma.stationImagingVoice.findMany({
    select: {
      id: true,
      displayName: true,
      elevenlabsVoiceId: true,
      stationId: true,
      metadata: true,
    },
    orderBy: { displayName: "asc" },
  });

  console.log("\n=== STATION IMAGING VOICES ===");
  console.log(JSON.stringify(imaging, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
