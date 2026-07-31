/**
 * Populate Song.artworkUrl from a TrueFans LABEL export manifest.
 *
 * The playout database is set separately (BETTERROBODJ/scripts/set_artwork_from_label.py).
 * Both stores need it: playout drives what listeners see on air, the platform
 * drives admin, the artists page and reports. Leaving one behind is exactly the
 * drift the reconciliation script exists to catch.
 *
 * Artwork is per-artist - Mureka produces artist portraits, not per-release
 * covers - so every track by an artist shares one image.
 *
 *   npx tsx scripts/set-artwork.ts /tmp/mf-all.json
 *   npx tsx scripts/set-artwork.ts /tmp/mf-all.json --commit
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();

async function main() {
  const file = process.argv[2];
  const commit = process.argv.includes("--commit");
  if (!file) {
    console.error("usage: set-artwork.ts <manifest.json> [--commit]");
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(file, "utf8"));
  const images = new Map<string, string>();
  for (const a of manifest.artists ?? []) {
    if (a.profileImageKey) images.set(a.name, a.profileImageKey);
  }

  console.log(`\n  ARTWORK -> PLATFORM ${commit ? "(COMMIT)" : "(DRY RUN)"}`);
  console.log("  " + "=".repeat(62));
  console.log(`  artists with an image: ${images.size}\n`);

  let touched = 0;
  for (const [name, url] of [...images].sort()) {
    // Match on artistName rather than an id: the platform and playout databases
    // have separate id spaces, and the import keyed on name too.
    const where = { artistName: { equals: name, mode: "insensitive" as const } };
    const n = await prisma.song.count({ where });
    if (commit && n > 0) {
      await prisma.song.updateMany({ where, data: { artworkUrl: url } });
    }
    touched += n;
    console.log(`    ${name.padEnd(28)} ${String(n).padStart(2)} track(s)`);
  }

  const missing = await prisma.song.count({
    where: { OR: [{ artworkUrl: null }, { artworkUrl: "" }], retiredAt: null },
  });

  console.log(`\n  tracks touched     : ${touched}`);
  console.log(`  active without art : ${missing}`);
  if (!commit) console.log("\n  Dry run - nothing written. Re-run with --commit.");
  console.log();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
