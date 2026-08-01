/**
 * Import the public artist roster from a TrueFans LABEL export manifest.
 *
 * The bios, origins and portraits live in LABEL. Until now the platform only
 * knew an artist's NAME, denormalised onto each Song, so the public artists
 * page could show a name and a track count and nothing else.
 *
 * Keyed on sourceArtistId, not name: an artist can be renamed in LABEL (Ryan
 * Mitchell became Callum Dreher) and matching on the display name would create
 * a second row and silently orphan the first.
 *
 * Only clear artists are imported - the roster is public, and it is the
 * evidence of the catalogue policy, so an unreviewed artist must not appear.
 *
 *   npx tsx scripts/import-roster.ts /tmp/mf-new.json
 *   npx tsx scripts/import-roster.ts /tmp/mf-new.json --commit
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "indie rock" and "Indie Pop" both appear; present them consistently. */
function titleCase(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .split(/[\s/]+/)
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

async function main() {
  const file = process.argv[2];
  const commit = process.argv.includes("--commit");
  if (!file) {
    console.error("usage: import-roster.ts <manifest.json> [--commit]");
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(file, "utf8"));
  const artists = (manifest.artists ?? []).filter(
    (a: any) => a.clearanceStatus === "clear",
  );
  const skipped = (manifest.artists ?? []).length - artists.length;

  console.log(`\n  IMPORT ROSTER ${commit ? "(COMMIT)" : "(DRY RUN)"}`);
  console.log("  " + "=".repeat(64));
  console.log(`  artists in manifest : ${(manifest.artists ?? []).length}`);
  if (skipped) console.log(`  skipped (not clear) : ${skipped}`);
  console.log();

  let created = 0;
  let updated = 0;

  for (const a of artists) {
    const slug = slugify(a.name);
    const data = {
      name: a.name,
      slug,
      bio: a.bio ?? null,
      imageUrl: a.profileImageKey ?? null,
      genre: titleCase(a.genre),
      subGenre: titleCase(a.subGenre),
      artistType: a.artistType ?? null,
      originCity: a.originCity ?? null,
      originCountry: a.originCountry ?? null,
      rightsBasis: "owned_ai",
      sourceSystem: "truefans_label",
      sourceArtistId: a.sourceArtistId ?? null,
      isActive: true,
    };

    const existing = a.sourceArtistId
      ? await prisma.rosterArtist.findUnique({
          where: { sourceArtistId: a.sourceArtistId },
        })
      : await prisma.rosterArtist.findUnique({ where: { name: a.name } });

    if (existing) {
      updated++;
      if (commit) {
        await prisma.rosterArtist.update({ where: { id: existing.id }, data });
      }
    } else {
      created++;
      if (commit) await prisma.rosterArtist.create({ data });
    }

    const where = [a.originCity, a.originCountry].filter(Boolean).join(", ");
    console.log(
      `    ${existing ? "update" : "create"}  ${a.name.padEnd(22)} ${(data.genre ?? "-").padEnd(18)} ${where}`,
    );
  }

  console.log(`\n  created : ${created}`);
  console.log(`  updated : ${updated}`);

  if (commit) {
    // A roster entry with no playable music is a dead link on a public page.
    const roster = await prisma.rosterArtist.findMany({
      where: { isActive: true },
      select: { name: true },
    });
    const withMusic = await prisma.song.groupBy({
      by: ["artistName"],
      where: { retiredAt: null, isActive: true },
      _count: { _all: true },
    });
    const playing = new Set(withMusic.map((s) => s.artistName));
    const orphans = roster.filter((r) => !playing.has(r.name));
    console.log(`  roster entries      : ${roster.length}`);
    console.log(`  without any tracks  : ${orphans.length}`);
    for (const o of orphans) console.log(`      ${o.name}`);
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
