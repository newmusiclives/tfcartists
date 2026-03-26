import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const STATION_ID = "cmm3sum5b00lq7d120drjrew8";

async function main() {
  const songs = await prisma.song.findMany({
    where: { stationId: STATION_ID },
    select: { id: true, title: true, artistName: true },
  });

  const radioEdit = songs.filter(s => /\(Radio Edit\)/i.test(s.title));
  const otherParens = songs.filter(s => /\([^)]+\)/.test(s.title) && !(/\(Radio Edit\)/i.test(s.title)));
  const featInTitle = songs.filter(s => /\b(feat\.?|ft\.?|featuring)\b/i.test(s.title));
  const featInArtist = songs.filter(s => /\b(feat\.?|ft\.?|featuring)\b/i.test(s.artistName));

  console.log("=== Title Cleanup Analysis ===");
  console.log("Total songs:", songs.length);
  console.log("Titles with (Radio Edit):", radioEdit.length);
  console.log("Titles with other parenthetical:", otherParens.length);
  console.log("Titles with feat/ft:", featInTitle.length);
  console.log("Artists with feat/ft:", featInArtist.length);

  console.log("\n--- Sample (Radio Edit) ---");
  radioEdit.slice(0, 10).forEach(s => console.log("  ", JSON.stringify({ t: s.title, a: s.artistName })));

  console.log("\n--- Sample other parens in title ---");
  otherParens.slice(0, 20).forEach(s => console.log("  ", JSON.stringify({ t: s.title, a: s.artistName })));

  console.log("\n--- Sample feat in title ---");
  featInTitle.slice(0, 10).forEach(s => console.log("  ", JSON.stringify({ t: s.title, a: s.artistName })));

  console.log("\n--- Sample feat in artist ---");
  featInArtist.slice(0, 10).forEach(s => console.log("  ", JSON.stringify({ t: s.title, a: s.artistName })));

  // Check if any titles already have "Artist - Title" format
  const dashFormat = songs.filter(s => /\s-\s/.test(s.title));
  console.log("\nTitles already containing ' - ':", dashFormat.length);
  dashFormat.slice(0, 5).forEach(s => console.log("  ", JSON.stringify({ t: s.title, a: s.artistName })));

  // Check for other common suffixes
  const liveVersion = songs.filter(s => /\(Live\)/i.test(s.title));
  const acousticVersion = songs.filter(s => /\(Acoustic\)/i.test(s.title));
  const remix = songs.filter(s => /\(.*Remix\)/i.test(s.title));
  const version = songs.filter(s => /\(.*Version\)/i.test(s.title));
  const deluxe = songs.filter(s => /\(Deluxe\)/i.test(s.title));

  console.log("\nOther common suffixes:");
  console.log("  (Live):", liveVersion.length);
  console.log("  (Acoustic):", acousticVersion.length);
  console.log("  (*Remix):", remix.length);
  console.log("  (*Version):", version.length);
  console.log("  (Deluxe):", deluxe.length);

  // Show how the now_playing display currently looks (Artist - Title is what we want)
  console.log("\n--- Current display format samples ---");
  songs.slice(0, 10).forEach(s => {
    console.log(`  Current: "${s.artistName}" / "${s.title}"`);
    // Clean version
    let cleanTitle = s.title
      .replace(/\s*\(Radio Edit\)/gi, "")
      .replace(/\s*\(Single Version\)/gi, "")
      .trim();
    console.log(`  Clean:   "${s.artistName} - ${cleanTitle}"`);
  });
}

main()
  .catch(e => { console.error("Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
