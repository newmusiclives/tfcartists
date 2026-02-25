#!/usr/bin/env npx tsx
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const artists = await prisma.artist.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      pipelineStage: true,
      discoverySource: true,
      createdAt: true,
    },
  });

  console.log(`Total artists in DB: ${artists.length}\n`);

  for (const a of artists) {
    console.log(`- "${a.name}" | Status: ${a.status} | Stage: ${a.pipelineStage} | Source: ${a.discoverySource || "manual"} | Email: ${a.email || "none"} | Created: ${a.createdAt.toISOString().slice(0, 10)}`);
  }
}

check()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
