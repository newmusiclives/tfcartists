#!/usr/bin/env npx tsx
/**
 * GHL Pipeline Setup Verification Script
 *
 * Fetches pipelines from GoHighLevel and verifies the "NCR Riley" pipeline
 * has the expected stages. Outputs the env var to set.
 *
 * Usage:
 *   npx tsx scripts/setup-ghl-pipeline.ts
 *
 * Prerequisites:
 *   - GHL_API_KEY and GHL_LOCATION_ID must be set in .env
 *   - Create the "NCR Riley" pipeline in GHL UI with stages:
 *     Discovery, Contacted, Engaged, Qualified, Onboarding, Activated
 */

import "dotenv/config";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

const EXPECTED_STAGES = [
  "discovery",
  "contacted",
  "engaged",
  "qualified",
  "onboarding",
  "activated",
];

async function main() {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.error("ERROR: GHL_API_KEY and GHL_LOCATION_ID must be set in .env");
    process.exit(1);
  }

  console.log("Fetching GHL pipelines...\n");

  const res = await fetch(
    `${GHL_BASE_URL}/opportunities/pipelines?locationId=${GHL_LOCATION_ID}`,
    {
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`Failed to fetch pipelines (${res.status}): ${body}`);
    process.exit(1);
  }

  const data = await res.json();
  const pipelines = data.pipelines || [];

  if (pipelines.length === 0) {
    console.log("No pipelines found in your GHL sub-account.\n");
    printSetupInstructions();
    process.exit(0);
  }

  console.log(`Found ${pipelines.length} pipeline(s):\n`);

  for (const pipeline of pipelines) {
    const stages = pipeline.stages || [];
    const isRiley = pipeline.name.toLowerCase().includes("riley");

    console.log(`  ${isRiley ? ">>>" : "   "} ${pipeline.name} (id: ${pipeline.id})`);
    for (const stage of stages) {
      console.log(`       - ${stage.name} (id: ${stage.id})`);
    }
    console.log();

    if (isRiley) {
      // Verify stages match expected
      const stageNames = stages.map((s: any) => s.name.toLowerCase());
      const missing = EXPECTED_STAGES.filter((e) => !stageNames.includes(e));
      const extra = stageNames.filter((s: string) => !EXPECTED_STAGES.includes(s));

      if (missing.length > 0) {
        console.log(`  WARNING: Missing stages: ${missing.join(", ")}`);
      }
      if (extra.length > 0) {
        console.log(`  NOTE: Extra stages: ${extra.join(", ")}`);
      }
      if (missing.length === 0) {
        console.log("  All expected stages found!\n");
      }

      console.log("  Add this to your .env:\n");
      console.log(`  GHL_RILEY_PIPELINE_ID=${pipeline.id}\n`);
    }
  }

  // Check if no Riley pipeline was found
  const rileyPipeline = pipelines.find((p: any) =>
    p.name.toLowerCase().includes("riley")
  );

  if (!rileyPipeline) {
    console.log('No pipeline with "Riley" in the name was found.\n');
    printSetupInstructions();

    // If there's an existing pipeline the user might want to use
    if (pipelines.length > 0) {
      console.log("Or, if you want to use an existing pipeline, set:\n");
      console.log(`  GHL_RILEY_PIPELINE_ID=<pipeline-id-from-above>\n`);
      console.log(
        "Make sure the pipeline has stages named: " +
          EXPECTED_STAGES.join(", ") +
          "\n"
      );
    }
  }
}

function printSetupInstructions() {
  console.log("=== Setup Instructions ===\n");
  console.log('1. In GHL, go to Opportunities > Pipelines > Create Pipeline');
  console.log('2. Name it "NCR Riley"');
  console.log("3. Add these stages in order:");
  for (let i = 0; i < EXPECTED_STAGES.length; i++) {
    const name = EXPECTED_STAGES[i];
    console.log(
      `   ${i + 1}. ${name.charAt(0).toUpperCase() + name.slice(1)}`
    );
  }
  console.log("\n4. Save the pipeline");
  console.log("5. Run this script again to get the pipeline ID");
  console.log("6. Add GHL_RILEY_PIPELINE_ID=<id> to your .env\n");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
