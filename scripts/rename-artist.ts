/**
 * Rename an artist in the platform database.
 *
 * The playout side (name, filenames, ID3 tags, symlinks, rotation) is handled
 * by BETTERROBODJ/scripts/rename_artist.py. This is the other half: the
 * platform stores the name denormalised on Song.artistName, which is what
 * admin, reports and the public artists page read. Renaming one side only
 * leaves the two databases disagreeing about who made a track.
 *
 *   npx tsx scripts/rename-artist.ts "Old Name" "New Name"
 *   npx tsx scripts/rename-artist.ts "Old Name" "New Name" --commit
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [oldName, newName] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const commit = process.argv.includes("--commit");
  if (!oldName || !newName) {
    console.error('usage: rename-artist.ts "Old Name" "New Name" [--commit]');
    process.exit(1);
  }

  const where = { artistName: { equals: oldName, mode: "insensitive" as const } };
  const n = await prisma.song.count({ where });
  const clash = await prisma.song.count({
    where: { artistName: { equals: newName, mode: "insensitive" as const } },
  });

  console.log(`\n  RENAME ARTIST ${commit ? "(COMMIT)" : "(DRY RUN)"}`);
  console.log("  " + "=".repeat(62));
  console.log(`  "${oldName}"  ->  "${newName}"`);
  console.log(`  tracks to update : ${n}`);
  if (clash > 0) {
    console.log(`  NOTE: ${clash} track(s) already use the new name - they are left alone.`);
  }

  if (n === 0) {
    console.log("\n  Nothing to do.\n");
    return;
  }

  if (commit) {
    const r = await prisma.song.updateMany({ where, data: { artistName: newName } });
    console.log(`  updated          : ${r.count}`);
  } else {
    console.log("\n  Dry run - nothing written. Re-run with --commit.");
  }
  console.log();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
