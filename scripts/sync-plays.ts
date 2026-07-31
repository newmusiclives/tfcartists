/**
 * CLI wrapper around the play sync.
 *
 * The logic lives in src/lib/plays/sync.ts so this and the scheduled cron route
 * cannot drift apart. Use this for backfills and for running the sync by hand;
 * routine operation is handled by /api/cron/sync-plays.
 *
 *   npx tsx scripts/sync-plays.ts                  # dry run, incremental
 *   npx tsx scripts/sync-plays.ts --commit
 *   npx tsx scripts/sync-plays.ts --commit --all   # full backfill
 */
import { PrismaClient } from "@prisma/client";
import { syncPlays } from "../src/lib/plays/sync";

const prisma = new PrismaClient();

async function main() {
  const commit = process.argv.includes("--commit");
  const all = process.argv.includes("--all");

  console.log(`\n  SYNC PLAYS -> PLATFORM ${commit ? "(COMMIT)" : "(DRY RUN)"}`);
  console.log("  " + "=".repeat(64));

  const r = await syncPlays({
    commit,
    all,
    onProgress: (n, total) =>
      process.stdout.write(`\r  fetched ${n} / ${total ?? "?"}   `),
  });
  process.stdout.write("\n");

  console.log(`  platform was : ${r.latestBefore?.toISOString() ?? "never"}`);
  console.log(`  mode         : ${all ? "full backfill" : r.latestBefore ? "incremental" : "initial"}`);
  console.log(`  fetched      : ${r.fetched}`);
  if (r.unusable) console.log(`  unusable     : ${r.unusable} (missing title or artist)`);
  console.log(`  already held : ${r.alreadyHeld}`);
  console.log(`  to insert    : ${r.toInsert}`);
  if (r.unmappedDjs) {
    console.log(`  NOTE: ${r.unmappedDjs} play(s) name a DJ with no platform record`);
  }
  if (commit) {
    console.log(`  inserted     : ${r.inserted}`);
    console.log(`  platform now : ${r.latestAfter?.toISOString() ?? "never"}`);
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
