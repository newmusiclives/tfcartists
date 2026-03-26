import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const STATION_ID = "cmm3sum5b00lq7d120drjrew8";
const RAILWAY_API = "https://tfc-radio-backend-production.up.railway.app/api";

async function main() {
  // Sample from each DB
  const netlify = await prisma.song.findMany({
    where: { stationId: STATION_ID },
    select: { title: true, artistName: true },
    take: 10,
  });

  const res = await fetch(`${RAILWAY_API}/music/library?page=1&limit=10`);
  const data = await res.json();
  const railway = data.songs;

  console.log("=== Netlify samples ===");
  for (const s of netlify) {
    console.log(`  "${s.artistName}" - "${s.title}"`);
  }

  console.log("\n=== Railway samples ===");
  for (const s of railway) {
    console.log(`  "${s.artist}" - "${s.title}"`);
  }

  // Try to find ANY overlap
  const netlifyAll = await prisma.song.findMany({
    where: { stationId: STATION_ID },
    select: { title: true, artistName: true },
  });

  const netlifyKeys = new Set(
    netlifyAll.map(s => `${s.title.toLowerCase().trim()}|||${s.artistName.toLowerCase().trim()}`)
  );

  const resAll = await fetch(`${RAILWAY_API}/music/library?page=1&limit=200`);
  const dataAll = await resAll.json();

  let found = 0;
  for (const s of dataAll.songs) {
    const key = `${s.title.toLowerCase().trim()}|||${s.artist.toLowerCase().trim()}`;
    if (netlifyKeys.has(key)) found++;
  }
  console.log(`\nMatches in first 200 Railway songs: ${found}`);

  // Check if Railway artist names differ from Netlify
  const railwayArtists = new Set(dataAll.songs.map((s: { artist: string }) => s.artist.toLowerCase().trim()));
  const netlifyArtists = new Set(netlifyAll.map(s => s.artistName.toLowerCase().trim()));

  let artistOverlap = 0;
  for (const a of railwayArtists) {
    if (netlifyArtists.has(a)) artistOverlap++;
  }
  console.log(`Artist overlap (first 200 Railway): ${artistOverlap} of ${railwayArtists.size}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
