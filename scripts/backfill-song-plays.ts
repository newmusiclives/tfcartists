/**
 * Backfill Song.playCount + Song.lastPlayedAt from every locked HourPlaylist
 * in the database. The playlist builder uses these fields for freshScore
 * (rotation spread) but they were never updated because Liquidsoap writes
 * TrackPlayback rows with null trackId.
 *
 * This is a one-shot historical backfill. The patched playlist builder
 * updates these fields on every new playlist so we shouldn't need to
 * re-run this.
 *
 * Run with: npx tsx scripts/backfill-song-plays.ts
 */
import { prisma } from "../src/lib/db";

async function main() {
  const playlists = await prisma.hourPlaylist.findMany({
    where: { status: { in: ["locked", "aired", "draft"] } },
    select: { airDate: true, hourOfDay: true, slots: true },
  });
  console.log(`Scanning ${playlists.length} locked playlists`);

  // songId → { count, latestPlayedAt }
  const stats = new Map<string, { count: number; latestPlayedAt: Date }>();

  for (const p of playlists) {
    if (!p.slots) continue;
    const slots: Array<{ songId?: string }> = JSON.parse(
      typeof p.slots === "string" ? p.slots : JSON.stringify(p.slots),
    );
    const playedAt = new Date(p.airDate);
    playedAt.setUTCHours(p.hourOfDay, 0, 0, 0);

    for (const slot of slots) {
      if (!slot.songId) continue;
      const cur = stats.get(slot.songId);
      if (!cur) {
        stats.set(slot.songId, { count: 1, latestPlayedAt: playedAt });
      } else {
        cur.count++;
        if (playedAt > cur.latestPlayedAt) cur.latestPlayedAt = playedAt;
      }
    }
  }

  console.log(`Aggregated ${stats.size} unique songs`);

  let updated = 0;
  for (const [songId, s] of stats) {
    try {
      await prisma.song.update({
        where: { id: songId },
        data: { playCount: s.count, lastPlayedAt: s.latestPlayedAt },
      });
      updated++;
    } catch {
      // Song no longer exists — skip
    }
  }
  console.log(`Updated ${updated} song rows`);

  // Verify Brickman
  const brickman = await prisma.song.findFirst({
    where: { artistName: { contains: "Brickman" } },
    select: { title: true, playCount: true, lastPlayedAt: true },
  });
  console.log("\nBrickman after backfill:", brickman);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
