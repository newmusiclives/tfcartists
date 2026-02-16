import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DJ_VOICES: Record<string, { voice: string; provider: string }> = {
  "Hank Westwood": { voice: "onyx", provider: "openai" },
  "Loretta Merrick": { voice: "Leda", provider: "gemini" },
  "Marcus 'Doc' Holloway": { voice: "echo", provider: "openai" },
  "Cody Rampart": { voice: "ash", provider: "openai" },
  "Jo McAllister": { voice: "coral", provider: "openai" },
  "Paul Saunders": { voice: "sage", provider: "openai" },
  "Ezra Stone": { voice: "fable", provider: "openai" },
  "Levi Bridges": { voice: "alloy", provider: "openai" },
  "Sam Turnbull": { voice: "ballad", provider: "openai" },
  "Ruby Finch": { voice: "nova", provider: "openai" },
  "Mark Faulkner": { voice: "echo", provider: "openai" },
  "Iris Langley": { voice: "shimmer", provider: "openai" },
};

async function main() {
  console.log("Seeding TTS voices for DJs...");

  for (const [name, config] of Object.entries(DJ_VOICES)) {
    const dj = await prisma.dJ.findFirst({ where: { name } });
    if (dj) {
      await prisma.dJ.update({
        where: { id: dj.id },
        data: { ttsVoice: config.voice, ttsProvider: config.provider },
      });
      console.log(`  ${name} → ${config.provider}/${config.voice}`);
    } else {
      console.log(`  ${name} — not found, skipping`);
    }
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
