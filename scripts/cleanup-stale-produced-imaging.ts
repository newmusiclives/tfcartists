/**
 * Delete the 224 March-2026 ProducedImaging rows stored as inline data URIs.
 *
 * Background: ProducedImaging is the table the playout endpoint randomly
 * picks from to fill imaging/sweeper/promo slots. Until April 2026 the
 * deploy path inlined audio as base64 data URIs, and that audio was
 * generated during the OpenAI/ElevenLabs era (mixed providers, mixed
 * voices). With the freshly-deployed Gemini package now in the table,
 * the random picker mixes old-voice audio with new-voice audio per slot.
 *
 * This script removes only the old data URI rows. The new disk-file rows
 * (158 of them, all Gemini) are left untouched.
 *
 * Run with: npx tsx scripts/cleanup-stale-produced-imaging.ts
 */
import { prisma } from "../src/lib/db";

async function main() {
  const candidates = await prisma.producedImaging.findMany({
    where: { filePath: { startsWith: "data:" } },
    select: { id: true, category: true, name: true },
  });
  console.log(`Found ${candidates.length} stale data-URI ProducedImaging rows`);
  const byCat: Record<string, number> = {};
  for (const c of candidates) byCat[c.category] = (byCat[c.category] || 0) + 1;
  console.log("By category:", byCat);

  const result = await prisma.producedImaging.deleteMany({
    where: { filePath: { startsWith: "data:" } },
  });
  console.log(`\nDeleted ${result.count} rows`);

  // Remaining state
  const remaining = await prisma.producedImaging.count();
  const remainingByCat = await prisma.producedImaging.groupBy({
    by: ["category"], _count: true,
  });
  console.log(`\nRemaining ProducedImaging: ${remaining}`);
  console.log("By category:", remainingByCat);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
