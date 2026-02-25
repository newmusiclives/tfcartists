import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const newScript =
    "TrueFans CONNECT — where ninety-two percent of every donation goes straight to the artist. No middlemen, no platform fees eating into their earnings. Discover incredible independent music, support the artists you love directly, and know that your money is actually making a difference. Join TrueFans CONNECT today and help keep independent music alive.";

  const ad = await prisma.sponsorAd.update({
    where: { id: "cmls8oqw801u47d3fxwam23t7" },
    data: { scriptText: newScript },
  });

  console.log("Updated script:", ad.scriptText);

  // Regenerate audio via API
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/sponsor-ads/${ad.id}/generate-audio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (res.ok) {
    const data = await res.json();
    console.log(`Audio regenerated: ${data.ad?.audioFilePath} (${data.ad?.durationSeconds}s)`);
  } else {
    console.error(`Audio generation failed: ${res.status}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
