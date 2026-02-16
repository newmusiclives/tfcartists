import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DJ_VOICES: Record<string, string> = {
  "Hank Westwood": "onyx",
  "Loretta Merrick": "shimmer",
  "Marcus 'Doc' Holloway": "echo",
  "Cody Rampart": "ash",
  "Jo McAllister": "coral",
  "Paul Saunders": "sage",
  "Ezra Stone": "fable",
  "Levi Bridges": "alloy",
  "Sam Turnbull": "ballad",
  "Ruby Finch": "nova",
  "Mark Faulkner": "echo",
  "Iris Langley": "shimmer",
};

async function main() {
  console.log("Seeding TTS voices for DJs...");

  for (const [name, voice] of Object.entries(DJ_VOICES)) {
    const dj = await prisma.dJ.findFirst({ where: { name } });
    if (dj) {
      await prisma.dJ.update({
        where: { id: dj.id },
        data: { ttsVoice: voice },
      });
      console.log(`  ${name} → ${voice}`);
    } else {
      console.log(`  ${name} — not found, skipping`);
    }
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
