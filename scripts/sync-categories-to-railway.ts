/**
 * Assign proper rotation categories to all 1200 Railway songs.
 * Uses the same A/B artist recognition + BPM-based B/C/D for the rest.
 * Category E is reserved for indie submissions (empty for now).
 *
 * Run with: npx tsx scripts/sync-categories-to-railway.ts
 */

const RAILWAY_API = "https://tfc-radio-backend-production.up.railway.app/api";

interface RailwaySong {
  id: string;
  title: string;
  artist: string;
  rotation_category: string;
  bpm: number | null;
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

function assignCategory(artist: string, _bpm: number | null): string {
  const lower = artist.toLowerCase().trim();
  const mainArtist = lower.split(/\s+f\.\s+|\s+feat\.?\s+|\s+ft\.?\s+|\s+&\s+|\s+and\s+/)[0].trim();

  if (A_ARTISTS.has(lower) || A_ARTISTS.has(mainArtist)) return "A";
  if (B_ARTISTS.has(lower) || B_ARTISTS.has(mainArtist)) return "B";

  // Remaining: distribute across B/C/D using name hash (no E — reserved for indie)
  // Railway has no BPM data, so use consistent hash for even distribution
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = ((hash << 5) - hash + lower.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash) % 100;

  // B: 0-24 (25%), C: 25-64 (40%), D: 65-99 (35%)
  if (bucket < 25) return "B";
  if (bucket < 65) return "C";
  return "D";
}

async function fetchAllSongs(): Promise<RailwaySong[]> {
  const all: RailwaySong[] = [];
  let page = 1;
  const limit = 100;
  while (true) {
    const res = await fetch(`${RAILWAY_API}/music/library?page=${page}&limit=${limit}`);
    const data = await res.json();
    const songs = data.songs || [];
    all.push(...songs);
    if (songs.length < limit || all.length >= data.total) break;
    page++;
  }
  return all;
}

async function main() {
  console.log("=== Assign Rotation Categories on Railway ===\n");

  const songs = await fetchAllSongs();
  console.log(`Fetched ${songs.length} songs from Railway`);

  // Current distribution
  const currentDist: Record<string, number> = {};
  for (const s of songs) {
    currentDist[s.rotation_category] = (currentDist[s.rotation_category] || 0) + 1;
  }
  console.log("\nCurrent categories:", currentDist);

  // Assign new categories
  const updates: Array<{ song_id: string; rotation_category: string }> = [];
  const newDist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

  for (const song of songs) {
    const newCat = assignCategory(song.artist, song.bpm);
    newDist[newCat]++;
    if (song.rotation_category !== newCat) {
      updates.push({ song_id: song.id, rotation_category: newCat });
    }
  }

  console.log("New categories:", newDist);
  console.log(`Songs needing update: ${updates.length}`);

  if (updates.length === 0) {
    console.log("Nothing to update!");
    return;
  }

  // Send in batches of 100
  const batchSize = 100;
  let totalUpdated = 0;
  let totalErrors = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    const res = await fetch(`${RAILWAY_API}/music/songs/bulk-categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: batch }),
    });

    if (res.ok) {
      const result = await res.json();
      totalUpdated += result.updated;
      totalErrors += result.errors;
    } else {
      console.log(`  Batch ${Math.floor(i / batchSize) + 1} failed: ${res.status} ${await res.text()}`);
      totalErrors += batch.length;
    }

    console.log(`  Progress: ${Math.min(i + batchSize, updates.length)}/${updates.length}`);
  }

  console.log(`\n=== Done ===`);
  console.log(`Updated: ${totalUpdated}`);
  console.log(`Errors: ${totalErrors}`);

  // Verify
  console.log("\nVerifying...");
  const verify = await fetchAllSongs();
  const verifyDist: Record<string, number> = {};
  for (const s of verify) {
    verifyDist[s.rotation_category] = (verifyDist[s.rotation_category] || 0) + 1;
  }
  console.log("Final categories:", verifyDist);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
