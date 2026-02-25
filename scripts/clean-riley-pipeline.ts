#!/usr/bin/env npx tsx
import "dotenv/config";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const API_KEY = process.env.GHL_API_KEY!;
const LOCATION_ID = process.env.GHL_LOCATION_ID!;
const PIPELINE_ID = process.env.GHL_RILEY_PIPELINE_ID!;

async function clean() {
  // 1. Fetch all opportunities in Riley pipeline
  console.log("=== Fetching Riley pipeline opportunities ===");
  const oppRes = await fetch(
    `${GHL_BASE_URL}/opportunities/search?location_id=${LOCATION_ID}&pipeline_id=${PIPELINE_ID}&limit=100`,
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
    }
  );
  const oppData = await oppRes.json();
  const opps = oppData.opportunities || [];

  console.log(`Found ${opps.length} opportunities to delete\n`);

  // 2. Delete each opportunity
  let deleted = 0;
  let failed = 0;
  for (const opp of opps) {
    const name = opp.name || opp.id;
    const res = await fetch(`${GHL_BASE_URL}/opportunities/${opp.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      console.log(`  Deleted: "${name}"`);
      deleted++;
    } else {
      const body = await res.text();
      console.error(`  Failed to delete "${name}": ${res.status} ${body}`);
      failed++;
    }
  }

  console.log(`\nDone. Deleted: ${deleted}, Failed: ${failed}`);
}

clean()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
