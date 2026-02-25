import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UPDATES: Record<string, string> = {
  "TFC - Direct Support":
    "Support the artists you love — live and in person. True Fans CONNECT is the free app that lets you discover shows near you and put money directly in artists' hands. Ninety-two percent of every donation goes straight to the musician. No middlemen, no platform fees. Find your next favorite artist at truefansconnect dot com.",
  "TFC - No Middlemen":
    "Artists keep ninety-two percent of every fan donation on True Fans CONNECT. No middlemen. No algorithms. No platform fees eating into their earnings. Just real fans supporting real music. Download the app free at truefansconnect dot com.",
  "TFC - Live Donation":
    "Going to a show tonight? Open True Fans CONNECT and send your favorite artist a donation right from your seat. Ninety-two percent goes directly to them. It's the easiest way to say that song changed my night. truefansconnect dot com.",
};

async function main() {
  const voices = await prisma.stationImagingVoice.findMany({ where: { isActive: true } });

  let updated = 0;
  for (const voice of voices) {
    const meta = voice.metadata as any;
    const commercials = meta?.scripts?.commercial;
    if (!commercials) continue;

    for (const script of commercials) {
      if (UPDATES[script.label]) {
        console.log(`${voice.displayName} | ${script.label}`);
        console.log(`  OLD: ${script.text.substring(0, 80)}...`);
        script.text = UPDATES[script.label];
        console.log(`  NEW: ${script.text.substring(0, 80)}...`);
        console.log();
        updated++;
      }
    }

    await prisma.stationImagingVoice.update({
      where: { id: voice.id },
      data: { metadata: JSON.parse(JSON.stringify(meta)) },
    });
  }

  console.log(`Updated ${updated} scripts in DB`);

  // Regenerate imaging audio for commercials
  const station = await prisma.station.findFirst();
  if (!station) { console.error("No station"); return; }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  console.log("\nRegenerating commercial imaging audio...");

  const res = await fetch(`${baseUrl}/api/station-imaging/generate-audio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stationId: station.id, types: ["commercial"] }),
  });

  if (res.ok) {
    const data = await res.json();
    console.log(data.message);
    for (const r of data.results || []) {
      if (r.label.includes("TFC") || r.label.includes("Live Donation")) {
        console.log(`  [${r.success ? "OK" : "FAIL"}] ${r.voiceName} | ${r.label}${r.hasMusicBed ? " +bed" : ""}`);
      }
    }
  } else {
    console.error(`Failed: ${res.status}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
