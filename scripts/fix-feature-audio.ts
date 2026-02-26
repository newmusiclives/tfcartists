import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

/**
 * Fix feature audio 404s:
 * 1. Clear audioFilePath for records pointing to files that don't exist on disk
 * 2. Decode data: URIs into real .wav files on disk
 *
 * After running, the daily cron will regenerate audio for features with null paths.
 */

async function main() {
  const featuresDir = join(process.cwd(), "public", "audio", "features");
  if (!existsSync(featuresDir)) {
    mkdirSync(featuresDir, { recursive: true });
  }

  const features = await prisma.featureContent.findMany({
    where: { audioFilePath: { not: null } },
    select: { id: true, audioFilePath: true, title: true },
  });

  let cleared = 0;
  let decoded = 0;
  let ok = 0;

  for (const f of features) {
    const path = f.audioFilePath!;

    // Handle data: URIs — decode to real files
    if (path.startsWith("data:")) {
      const match = path.match(/^data:audio\/wav;base64,(.+)$/);
      if (match) {
        const buffer = Buffer.from(match[1], "base64");
        const filename = `fc-${f.id}.wav`;
        const filePath = `/audio/features/${filename}`;
        const fullPath = join(featuresDir, filename);

        writeFileSync(fullPath, buffer);
        await prisma.featureContent.update({
          where: { id: f.id },
          data: { audioFilePath: filePath },
        });
        console.log(`DECODE: ${f.title || f.id} → ${filePath} (${buffer.length} bytes)`);
        decoded++;
      } else {
        // Unrecognized data URI — clear it
        await prisma.featureContent.update({
          where: { id: f.id },
          data: { audioFilePath: null },
        });
        console.log(`CLEAR (bad data URI): ${f.title || f.id}`);
        cleared++;
      }
      continue;
    }

    // Check if the file exists on disk
    const fullPath = join(process.cwd(), "public", path);
    if (existsSync(fullPath)) {
      ok++;
    } else {
      // File missing — clear the path so cron will regenerate
      await prisma.featureContent.update({
        where: { id: f.id },
        data: { audioFilePath: null, audioDuration: null },
      });
      console.log(`CLEAR (missing): ${f.title || f.id} → ${path}`);
      cleared++;
    }
  }

  console.log(`\nDone:`);
  console.log(`  OK (on disk): ${ok}`);
  console.log(`  Decoded data URIs: ${decoded}`);
  console.log(`  Cleared stale paths: ${cleared}`);
  console.log(`\nThe daily cron will regenerate audio for ${cleared} features.`);

  await prisma.$disconnect();
}

main().catch(console.error);
