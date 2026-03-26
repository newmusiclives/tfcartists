/**
 * Delete existing handoff transitions and regenerate them
 * using the new conversational approach.
 *
 * Usage: npx tsx scripts/regenerate-handoffs.ts
 */

import { prisma } from "../src/lib/db";

const STATION_ID = "cmm3sum5b00lq7d120drjrew8";
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

async function main() {
  console.log("Deleting existing handoff transitions...");

  const deleted = await prisma.showTransition.deleteMany({
    where: {
      stationId: STATION_ID,
      transitionType: "handoff",
    },
  });

  console.log(`Deleted ${deleted.count} handoff transitions.`);

  console.log("\nRegenerating handoffs via seed-weekday API...");
  console.log("(This requires the dev server or production to be running)\n");

  try {
    const res = await fetch(`${BASE_URL}/api/show-transitions/seed-weekday`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId: STATION_ID }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Result:", JSON.stringify(data, null, 2));
    } else {
      const err = await res.text();
      console.error(`API returned ${res.status}: ${err}`);
      console.log("\nHandoffs deleted. To regenerate, run the seed from the admin UI");
      console.log("or call POST /api/show-transitions/seed-weekday with stationId.");
    }
  } catch (e) {
    console.error("Could not reach API:", e);
    console.log("\nHandoffs deleted successfully.");
    console.log("To regenerate, call POST /api/show-transitions/seed-weekday");
    console.log(`with body: { "stationId": "${STATION_ID}" }`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
