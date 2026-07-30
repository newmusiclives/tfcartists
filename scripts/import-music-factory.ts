/**
 * Import a Music Factory export into a TrueFans RADIO station library.
 *
 * Consumes the manifest produced by LABEL's
 * `src/scripts/export-music-factory-to-radio.ts`.
 *
 * Safe to run repeatedly. Every track is matched against the existing library by
 * ISRC, then source id, then normalised artist+title; a match updates in place
 * rather than creating a second copy. Re-running the same export is therefore a
 * no-op, which is the property you want when someone uploads the same file twice.
 *
 * Dry run by default. Nothing is written until --commit.
 *
 *   npx tsx scripts/import-music-factory.ts --file /tmp/music-factory-radio-export.json
 *   npx tsx scripts/import-music-factory.ts --file export.json --station ncr --commit
 */

import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { buildDedupeKey, findDuplicate, type MatchReason } from "../src/lib/music-import/dedupe";

const prisma = new PrismaClient();

interface ManifestTrack {
  sourceTrackId: string;
  sourceArtistId: string;
  artistName: string;
  title: string;
  fileKey: string;
  duration: number | null;
  bpm: number | null;
  musicalKey: string | null;
  mood: string | null;
  energy: number | null;
  hasVocals: boolean | null;
  isrc: string | null;
  genre: string | null;
}

interface Manifest {
  manifestVersion: number;
  source: string;
  exportedAt: string;
  rights: { status: string; evidence: string };
  artists: { sourceArtistId: string; name: string; gender: string | null; leadVocal: string | null }[];
  tracks: ManifestTrack[];
}

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

/**
 * The radio rotation cares about vocal gender for balance targets. The Music
 * Factory records it on the artist (gender, leadVocal), so derive it rather
 * than leaving every imported track "unknown" and breaking the fairness maths.
 */
function deriveVocalGender(
  hasVocals: boolean | null,
  artistGender: string | null,
  leadVocal: string | null
): string {
  if (hasVocals === false) return "instrumental";
  const lead = (leadVocal ?? "").toLowerCase();
  if (lead === "male" || lead === "female") return lead;
  if (lead === "both") return "mixed";
  const g = (artistGender ?? "").toLowerCase();
  if (g === "male" || g === "female") return g;
  return "unknown";
}

/** Music Factory energy is 0-100; the radio Song model uses 0-1. */
function normaliseEnergy(energy: number | null): number | null {
  if (energy === null || energy === undefined) return null;
  return energy > 1 ? Math.min(energy / 100, 1) : energy;
}

async function main() {
  const file = arg("--file");
  const stationCode = arg("--station", "ncr")!;
  const commit = process.argv.includes("--commit");

  if (!file) {
    console.error("Usage: --file <manifest.json> [--station ncr] [--commit]");
    process.exit(1);
  }

  const manifest: Manifest = JSON.parse(readFileSync(file, "utf8"));

  if (manifest.manifestVersion !== 1) {
    console.error(`Unsupported manifest version: ${manifest.manifestVersion}`);
    process.exit(1);
  }

  const station = await prisma.station.findFirst({
    where: { stationCode },
    select: { id: true, name: true },
  });
  if (!station) {
    console.error(`No station with code "${stationCode}"`);
    process.exit(1);
  }

  const artistById = new Map(manifest.artists.map((a) => [a.sourceArtistId, a]));

  // Load once: the library is ~1-2k rows, and a query per track would be slow
  // and would miss duplicates created earlier in this same run.
  const existing = await prisma.song.findMany({
    where: { stationId: station.id },
    select: {
      id: true,
      isrc: true,
      sourceSystem: true,
      sourceTrackId: true,
      dedupeKey: true,
      title: true,
      artistName: true,
    },
  });

  const pool = [...existing];

  let created = 0;
  let updated = 0;
  const duplicates: { title: string; artist: string; reason: MatchReason; existingId: string }[] = [];
  const withinExport: { title: string; artist: string }[] = [];
  const seenInThisRun = new Set<string>();

  for (const t of manifest.tracks) {
    const dedupeKey = buildDedupeKey(t.artistName, t.title);

    // Catch repeats inside the export itself, before touching the database
    if (seenInThisRun.has(dedupeKey)) {
      withinExport.push({ title: t.title, artist: t.artistName });
      continue;
    }
    seenInThisRun.add(dedupeKey);

    const hit = findDuplicate(
      {
        isrc: t.isrc,
        sourceSystem: manifest.source,
        sourceTrackId: t.sourceTrackId,
        dedupeKey,
      },
      pool
    );

    const artist = artistById.get(t.sourceArtistId);
    const data = {
      stationId: station.id,
      title: t.title,
      artistName: t.artistName,
      genre: t.genre,
      duration: t.duration,
      bpm: t.bpm,
      musicalKey: t.musicalKey,
      energy: normaliseEnergy(t.energy),
      fileUrl: t.fileKey,
      vocalGender: deriveVocalGender(t.hasVocals, artist?.gender ?? null, artist?.leadVocal ?? null),
      // Owned AI music: cleared on import with the manifest as evidence, so the
      // rights gate can pass it without a human re-reviewing every track.
      rightsStatus: manifest.rights.status,
      rightsEvidence: manifest.rights.evidence,
      rightsClearedAt: new Date(),
      rightsClearedBy: "music-factory-import",
      sourceSystem: manifest.source,
      sourceTrackId: t.sourceTrackId,
      isrc: t.isrc,
      dedupeKey,
      importedAt: new Date(),
    };

    if (hit) {
      duplicates.push({
        title: t.title,
        artist: t.artistName,
        reason: hit.reason,
        existingId: hit.match.id,
      });
      if (commit) {
        await prisma.song.update({ where: { id: hit.match.id }, data });
      }
      updated++;
    } else {
      if (commit) {
        const row = await prisma.song.create({ data });
        pool.push({
          id: row.id,
          isrc: row.isrc,
          sourceSystem: row.sourceSystem,
          sourceTrackId: row.sourceTrackId,
          dedupeKey: row.dedupeKey,
          title: row.title,
          artistName: row.artistName,
        });
      } else {
        // Keep the in-memory pool accurate during a dry run too, otherwise the
        // same new track appearing twice would be reported as two creations.
        pool.push({
          id: `(pending-${created})`,
          isrc: t.isrc,
          sourceSystem: manifest.source,
          sourceTrackId: t.sourceTrackId,
          dedupeKey,
          title: t.title,
          artistName: t.artistName,
        });
      }
      created++;
    }
  }

  // --- Report ---------------------------------------------------------------
  console.log(`\n  MUSIC FACTORY IMPORT ${commit ? "(COMMITTED)" : "(DRY RUN)"}`);
  console.log("  " + "=".repeat(70));
  console.log(`  Source        : ${manifest.source}`);
  console.log(`  Exported      : ${manifest.exportedAt}`);
  console.log(`  Station       : ${station.name} (${stationCode})`);
  console.log(`  Library before: ${existing.length} songs\n`);

  console.log(`  New tracks        : ${created}`);
  console.log(`  Already present   : ${updated}${commit ? " (updated in place)" : ""}`);
  console.log(`  Repeats in export : ${withinExport.length}`);

  if (duplicates.length) {
    const byReason = new Map<string, number>();
    for (const d of duplicates) byReason.set(d.reason ?? "?", (byReason.get(d.reason ?? "?") ?? 0) + 1);
    console.log("\n  Matched existing tracks by:");
    for (const [reason, n] of byReason) {
      const label =
        reason === "isrc"
          ? "ISRC (exact)"
          : reason === "source_id"
            ? "source id (re-import)"
            : "artist + title (normalised)";
      console.log(`    ${String(n).padStart(5)}  ${label}`);
    }
    // Name matches are the fuzzy ones; show them so a false positive is visible
    const fuzzy = duplicates.filter((d) => d.reason === "artist_title").slice(0, 10);
    if (fuzzy.length) {
      console.log("\n  Matched on name (check these are genuinely the same recording):");
      for (const f of fuzzy) console.log(`    ${f.artist} - ${f.title}`);
    }
  }

  if (withinExport.length) {
    console.log("\n  The export itself contained repeats:");
    for (const w of withinExport.slice(0, 10)) console.log(`    ${w.artist} - ${w.title}`);
  }

  console.log(
    `\n  Library after : ${commit ? existing.length + created : `${existing.length + created} (projected)`}`
  );
  if (!commit) console.log("\n  Dry run - nothing written. Re-run with --commit to apply.");
  console.log();

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Import failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
