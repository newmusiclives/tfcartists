#!/usr/bin/env npx tsx
import "dotenv/config";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const API_KEY = process.env.GHL_API_KEY!;
const LOCATION_ID = process.env.GHL_LOCATION_ID!;

const EXPECTED_STAGES = ["pending", "in review", "judged", "placed", "not placed"];

async function setup() {
  if (!API_KEY || !LOCATION_ID) {
    console.error("Missing GHL_API_KEY or GHL_LOCATION_ID in .env");
    process.exit(1);
  }

  console.log("=== Fetching GHL Pipelines ===");
  const res = await fetch(
    `${GHL_BASE_URL}/opportunities/pipelines?locationId=${LOCATION_ID}`,
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    console.error(`Failed to fetch pipelines: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const pipelines = data.pipelines || [];

  console.log(`Found ${pipelines.length} pipeline(s):`);
  for (const p of pipelines) {
    console.log(`  - "${p.name}" (${p.id}) — ${p.stages?.length || 0} stages`);
  }

  // Find pipeline with "cassidy" in the name (case-insensitive)
  const cassidyPipeline = pipelines.find((p: any) =>
    p.name.toLowerCase().includes("cassidy")
  );

  if (!cassidyPipeline) {
    console.error(
      '\nNo pipeline with "cassidy" in the name found. Create one in GHL first:'
    );
    console.error('  Pipeline name: "NCR Cassidy"');
    console.error("  Stages: Pending → In Review → Judged → Placed → Not Placed");
    process.exit(1);
  }

  console.log(`\n=== Found Cassidy Pipeline ===`);
  console.log(`Name: ${cassidyPipeline.name}`);
  console.log(`ID:   ${cassidyPipeline.id}`);

  // Verify expected stages
  const stageNames = (cassidyPipeline.stages || []).map((s: any) =>
    s.name.toLowerCase()
  );
  console.log(`\nStages found:`);
  for (const s of cassidyPipeline.stages || []) {
    const expected = EXPECTED_STAGES.includes(s.name.toLowerCase());
    console.log(`  ${expected ? "✓" : "✗"} "${s.name}" (${s.id})`);
  }

  const missing = EXPECTED_STAGES.filter((e) => !stageNames.includes(e));
  if (missing.length > 0) {
    console.warn(`\nWarning: Missing expected stages: ${missing.join(", ")}`);
    console.warn("Add these stages in the GHL pipeline editor.");
  } else {
    console.log("\nAll expected stages present!");
  }

  console.log(`\n=== Add to .env ===`);
  console.log(`GHL_CASSIDY_PIPELINE_ID=${cassidyPipeline.id}`);
}

setup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
