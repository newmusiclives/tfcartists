#!/usr/bin/env npx tsx
import "dotenv/config";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const API_KEY = process.env.GHL_API_KEY!;
const LOCATION_ID = process.env.GHL_LOCATION_ID!;
const PIPELINE_ID = process.env.GHL_CASSIDY_PIPELINE_ID!;

async function ghlFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${GHL_BASE_URL}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`GHL ${path} failed (${res.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function test() {
  if (!API_KEY || !LOCATION_ID || !PIPELINE_ID) {
    console.error("Missing GHL_API_KEY, GHL_LOCATION_ID, or GHL_CASSIDY_PIPELINE_ID in .env");
    console.error("Run setup-ghl-cassidy-pipeline.ts first to get the pipeline ID.");
    process.exit(1);
  }

  const testEmail = `cassidy-test-${Date.now()}@example.com`;
  const artistName = "Test Artist (Cassidy)";
  const trackTitle = "Test Track";

  // 1. Upsert contact with Cassidy tags
  console.log("=== Step 1: Upsert contact with Cassidy - Pending tags ===");
  const contactData = await ghlFetch("/contacts/upsert", {
    method: "POST",
    body: JSON.stringify({
      locationId: LOCATION_ID,
      email: testEmail,
      name: artistName,
      tags: ["NCR Cassidy", "Cassidy - Pending"],
    }),
  });
  const contactId = contactData.contact.id;
  console.log(`Contact ID: ${contactId}`);
  console.log(`Tags: ${contactData.contact.tags?.join(", ")}`);

  // 2. Fetch pipeline stages
  console.log("\n=== Step 2: Fetch Cassidy pipeline stages ===");
  const pipeData = await ghlFetch(
    `/opportunities/pipelines?locationId=${LOCATION_ID}`
  );
  const pipeline = pipeData.pipelines?.find((p: any) => p.id === PIPELINE_ID);
  if (!pipeline) {
    throw new Error(`Pipeline ${PIPELINE_ID} not found`);
  }

  const stageMap: Record<string, string> = {};
  for (const s of pipeline.stages) {
    stageMap[s.name.toLowerCase().replace(/ /g, "_")] = s.id;
    console.log(`  "${s.name}" → ${s.id}`);
  }

  // 3. Create opportunity at In Review
  console.log("\n=== Step 3: Create opportunity at In Review ===");
  const inReviewStageId = stageMap["in_review"];
  if (!inReviewStageId) {
    throw new Error('Stage "In Review" not found in pipeline');
  }

  const oppData = await ghlFetch("/opportunities/upsert", {
    method: "POST",
    body: JSON.stringify({
      pipelineId: PIPELINE_ID,
      pipelineStageId: inReviewStageId,
      locationId: LOCATION_ID,
      contactId,
      name: `${artistName} - ${trackTitle}`,
      status: "open",
    }),
  });
  console.log(`Opportunity ID: ${oppData.opportunity?.id}`);
  console.log(`Stage: In Review`);

  // 4. Move opportunity to Placed
  console.log("\n=== Step 4: Move opportunity to Placed ===");
  const placedStageId = stageMap["placed"];
  if (!placedStageId) {
    throw new Error('Stage "Placed" not found in pipeline');
  }

  const movedData = await ghlFetch("/opportunities/upsert", {
    method: "POST",
    body: JSON.stringify({
      pipelineId: PIPELINE_ID,
      pipelineStageId: placedStageId,
      locationId: LOCATION_ID,
      contactId,
      name: `${artistName} - ${trackTitle}`,
      status: "open",
    }),
  });
  console.log(`Opportunity moved to Placed`);

  // 5. Update contact tags with tier
  console.log("\n=== Step 5: Update contact tags with Gold tier ===");
  const updatedContact = await ghlFetch("/contacts/upsert", {
    method: "POST",
    body: JSON.stringify({
      locationId: LOCATION_ID,
      email: testEmail,
      name: artistName,
      tags: ["NCR Cassidy", "Cassidy - Placed", "Cassidy - Placed - Gold"],
    }),
  });
  console.log(`Updated tags: ${updatedContact.contact.tags?.join(", ")}`);

  console.log(
    `\nDone! Check GHL for "${artistName}" contact + opportunity in Placed column.`
  );
}

test()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
