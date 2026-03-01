/**
 * Sync 1200 songs from Railway backend to Netlify Prisma DB.
 *
 * Fetches all songs from Railway API, assigns proper rotation categories,
 * and upserts into the Netlify StationSong table.
 *
 * Rotation category assignment logic:
 *   A (Power/Hits) — ~15% — well-known artists (Miranda Lambert, Tim McGraw, etc.)
 *   B (Heavy)      — ~18% — strong tracks, recognizable names
 *   C (Medium)     — ~30% — solid album cuts, mid-tier artists
 *   D (Light/Deep) — ~17% — deep cuts, lesser-known
 *   E (Discovery)  — ~20% — indie/new artists, discovery focus
 *
 * Run with: npx tsx scripts/sync-railway-songs.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STATION_ID = "cmm3sum5b00lq7d120drjrew8";
const RAILWAY_API = "https://tfc-radio-backend-production.up.railway.app/api";

interface RailwaySong {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  plays: number;
  rotation_category: string;
  vocal_gender: string;
  bpm: number | null;
  intro_end_ms: number | null;
  vocal_start_ms: number | null;
  outro_start_ms: number | null;
  song_end_ms: number | null;
  tempo_category: string;
}

// Major/well-known country/americana artists → A rotation (power hits)
const A_ARTISTS = new Set([
  "miranda lambert", "tim mcgraw", "carrie underwood", "blake shelton",
  "keith urban", "luke bryan", "jason aldean", "kenny chesney",
  "george strait", "alan jackson", "brad paisley", "dierks bentley",
  "eric church", "zac brown band", "chris stapleton", "luke combs",
  "thomas rhett", "dan + shay", "kacey musgraves", "maren morris",
  "florida georgia line", "old dominion", "brothers osborne",
  "rascal flatts", "lady antebellum", "little big town", "the band perry",
  "scotty mccreery", "brett eldredge", "sam hunt", "cole swindell",
  "dustin lynch", "chris young", "lee brice", "darius rucker",
  "toby keith", "garth brooks", "reba mcentire", "shania twain",
  "dolly parton", "willie nelson", "waylon jennings", "johnny cash",
  "merle haggard", "hank williams", "patsy cline", "loretta lynn",
  "tammy wynette", "conway twitty", "charley pride", "glen campbell",
  "john denver", "roger miller", "kris kristofferson",
  "vince gill", "travis tritt", "brooks & dunn", "alabama",
  "lonestar", "montgomery gentry", "trace adkins", "josh turner",
  "randy travis", "clint black", "dwight yoakam", "diamond rio",
  "sugarland", "lady a",
  "tyler childers", "sturgill simpson", "colter wall", "jason isbell",
  "brandi carlile", "emmylou harris", "lucinda williams",
]);

// Strong mid-tier / rising artists → B rotation
const B_ARTISTS = new Set([
  "walker hayes", "jordan davis", "parker mccollum", "riley green",
  "morgan wallen", "lainey wilson", "gabby barrett", "carly pearce",
  "ashley mcbryde", "midland", "turnpike troubadours", "whiskey myers",
  "cody johnson", "zach bryan", "hardy", "jelly roll",
  "jackson dean", "niko moon", "travis denning", "mitchell tenpenny",
  "matt stell", "russell dickerson", "brett young", "michael ray",
  "randy houser", "kip moore", "chase rice", "tyler farr",
  "granger smith", "jon pardi", "dustin lynch", "a thousand horses",
  "hayes carll", "robert earl keen", "ray wylie hubbard",
  "steve earle", "townes van zandt", "guy clark", "john prine",
  "amos lee", "ryan bingham", "charley crockett",
  "lionel richie", "kix brooks", "dan & shay",
  "chuck wicks", "josh thompson", "easton corbin",
  "hunter hayes", "jana kramer", "cassadee pope",
  "maddie & tae", "danielle bradbery",
]);

function assignCategory(artistName: string, _plays: number): string {
  const lower = artistName.toLowerCase().trim();

  // Check featured artists: "Artist f. OtherArtist" or "Artist feat. Other"
  const mainArtist = lower.split(/\s+f\.\s+|\s+feat\.?\s+|\s+ft\.?\s+|\s+&\s+|\s+and\s+/)[0].trim();

  if (A_ARTISTS.has(lower) || A_ARTISTS.has(mainArtist)) return "A";
  if (B_ARTISTS.has(lower) || B_ARTISTS.has(mainArtist)) return "B";

  // For remaining artists, distribute C/D/E based on name hash for consistency
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = ((hash << 5) - hash + lower.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash) % 100;

  // C: 0-44 (45%), D: 45-69 (25%), E: 70-99 (30%)
  if (bucket < 45) return "C";
  if (bucket < 70) return "D";
  return "E";
}

async function fetchAllSongs(): Promise<RailwaySong[]> {
  const allSongs: RailwaySong[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const res = await fetch(`${RAILWAY_API}/music/library?page=${page}&limit=${limit}`);
    const data = await res.json();
    const songs = data.songs || [];
    allSongs.push(...songs);

    if (songs.length < limit || allSongs.length >= data.total) break;
    page++;
  }

  return allSongs;
}

async function main() {
  console.log("=== Syncing Railway songs to Netlify DB ===\n");

  // 1. Fetch all songs from Railway
  console.log("Fetching songs from Railway...");
  const railwaySongs = await fetchAllSongs();
  console.log(`Fetched ${railwaySongs.length} songs from Railway\n`);

  // 2. Count existing songs in Netlify DB
  const existingCount = await prisma.song.count({
    where: { stationId: STATION_ID },
  });
  console.log(`Existing songs in Netlify DB: ${existingCount}\n`);

  // 3. Assign categories and prepare data
  const categoryCount: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  // 4. Get existing songs to avoid duplicates (match on title + artistName)
  const existing = await prisma.song.findMany({
    where: { stationId: STATION_ID },
    select: { title: true, artistName: true },
  });
  const existingKeys = new Set(
    existing.map((s) => `${s.title.toLowerCase()}|||${s.artistName.toLowerCase()}`)
  );

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches of 50
  const batchSize = 50;
  for (let i = 0; i < railwaySongs.length; i += batchSize) {
    const batch = railwaySongs.slice(i, i + batchSize);
    const creates = [];

    for (const song of batch) {
      const key = `${song.title.toLowerCase()}|||${song.artist.toLowerCase()}`;
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }

      const category = assignCategory(song.artist, song.plays);
      categoryCount[category]++;

      creates.push({
        stationId: STATION_ID,
        title: song.title,
        artistName: song.artist,
        album: song.album || null,
        duration: song.duration || 180,
        genre: song.genre || "Americana",
        bpm: song.bpm || null,
        rotationCategory: category,
        vocalGender: song.vocal_gender || null,
        tempoCategory: song.tempo_category || null,
        introEnd: song.intro_end_ms || null,
        outroStart: song.outro_start_ms || null,
        isActive: true,
        playCount: song.plays || 0,
      });

      existingKeys.add(key);
    }

    if (creates.length > 0) {
      try {
        const result = await prisma.song.createMany({
          data: creates,
          skipDuplicates: true,
        });
        imported += result.count;
      } catch (e) {
        // If batch fails, try one by one
        for (const song of creates) {
          try {
            await prisma.song.create({ data: song });
            imported++;
          } catch {
            errors++;
          }
        }
      }
    }

    if ((i + batchSize) % 200 === 0 || i + batchSize >= railwaySongs.length) {
      console.log(
        `  Progress: ${Math.min(i + batchSize, railwaySongs.length)}/${railwaySongs.length} processed (${imported} imported, ${skipped} skipped, ${errors} errors)`
      );
    }
  }

  // 5. Summary
  console.log("\n=== Results ===");
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`\nCategory distribution of new imports:`);
  for (const [cat, count] of Object.entries(categoryCount).sort()) {
    const pct = railwaySongs.length > 0 ? ((count / (imported + skipped)) * 100).toFixed(1) : "0";
    console.log(`  ${cat}: ${count} songs (${pct}%)`);
  }

  // 6. Final verification
  const finalCount = await prisma.song.count({
    where: { stationId: STATION_ID },
  });
  console.log(`\nTotal songs in Netlify DB: ${finalCount}`);

  // Category breakdown of full library
  const cats = await prisma.$queryRaw<Array<{ rotationCategory: string; _count: bigint }>>`
    SELECT "rotationCategory", COUNT(*) as _count
    FROM "Song"
    WHERE "stationId" = ${STATION_ID}
    GROUP BY "rotationCategory"
    ORDER BY "rotationCategory"
  `;
  console.log("\nFull library breakdown:");
  for (const row of cats) {
    console.log(`  ${row.rotationCategory}: ${row._count} songs`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
