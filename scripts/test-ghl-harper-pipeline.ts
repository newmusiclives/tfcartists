#!/usr/bin/env npx tsx
import "dotenv/config";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const API_KEY = process.env.GHL_API_KEY!;
const LOCATION_ID = process.env.GHL_LOCATION_ID!;
const PIPELINE_ID = process.env.GHL_HARPER_PIPELINE_ID!;

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
    console.error("Missing GHL_API_KEY, GHL_LOCATION_ID, or GHL_HARPER_PIPELINE_ID in .env");
    console.error("Run setup-ghl-harper-pipeline.ts first to get the pipeline ID.");
    process.exit(1);
  }

  const testEmail = `harper-test-${Date.now()}@example.com`;
  const businessName = "Test Business (Harper)";
  const contactName = "Test Contact";

  // 1. Upsert contact with Harper tags
  console.log("=== Step 1: Upsert contact with Harper - Discovery tags ===");
  const contactData = await ghlFetch("/contacts/upsert", {
    method: "POST",
    body: JSON.stringify({
      locationId: LOCATION_ID,
      email: testEmail,
      name: contactName,
      tags: ["NCR Harper", "Harper - Discovery"],
    }),
  });
  const contactId = contactData.contact.id;
  console.log(`Contact ID: ${contactId}`);
  console.log(`Tags: ${contactData.contact.tags?.join(", ")}`);

  // 2. Fetch pipeline stages
  console.log("\n=== Step 2: Fetch Harper pipeline stages ===");
  const pipeData = await ghlFetch(
    `/opportunities/pipelines?locationId=${LOCATION_ID}`
  );
  const pipeline = pipeData.pipelines?.find((p: any) => p.id === PIPELINE_ID);
  if (!pipeline) {
    throw new Error(`Pipeline ${PIPELINE_ID} not found`);
  }

  const stageMap: Record<string, string> = {};
  for (const s of pipeline.stages) {
    stageMap[s.name.toLowerCase()] = s.id;
    console.log(`  "${s.name}" → ${s.id}`);
  }

  // 3. Create opportunity at Discovery
  console.log("\n=== Step 3: Create opportunity at Discovery ===");
  const discoveryStageId = stageMap["discovery"];
  if (!discoveryStageId) {
    throw new Error('Stage "Discovery" not found in pipeline');
  }

  const oppData = await ghlFetch("/opportunities/upsert", {
    method: "POST",
    body: JSON.stringify({
      pipelineId: PIPELINE_ID,
      pipelineStageId: discoveryStageId,
      locationId: LOCATION_ID,
      contactId,
      name: `${businessName} - ${contactName}`,
      status: "open",
    }),
  });
  console.log(`Opportunity ID: ${oppData.opportunity?.id}`);
  console.log(`Stage: Discovery`);

  // 4. Move opportunity to Contacted
  console.log("\n=== Step 4: Move opportunity to Contacted ===");
  const contactedStageId = stageMap["contacted"];
  if (!contactedStageId) {
    throw new Error('Stage "Contacted" not found in pipeline');
  }

  await ghlFetch("/opportunities/upsert", {
    method: "POST",
    body: JSON.stringify({
      pipelineId: PIPELINE_ID,
      pipelineStageId: contactedStageId,
      locationId: LOCATION_ID,
      contactId,
      name: `${businessName} - ${contactName}`,
      status: "open",
    }),
  });
  console.log(`Opportunity moved to Contacted`);

  // 5. Move to Closed
  console.log("\n=== Step 5: Move opportunity to Closed ===");
  const closedStageId = stageMap["closed"];
  if (!closedStageId) {
    throw new Error('Stage "Closed" not found in pipeline');
  }

  await ghlFetch("/opportunities/upsert", {
    method: "POST",
    body: JSON.stringify({
      pipelineId: PIPELINE_ID,
      pipelineStageId: closedStageId,
      locationId: LOCATION_ID,
      contactId,
      name: `${businessName} - ${contactName}`,
      status: "open",
    }),
  });
  console.log(`Opportunity moved to Closed`);

  // 6. Update contact tags with Gold tier
  console.log("\n=== Step 6: Update contact tags with Gold tier ===");
  const updatedContact = await ghlFetch("/contacts/upsert", {
    method: "POST",
    body: JSON.stringify({
      locationId: LOCATION_ID,
      email: testEmail,
      name: contactName,
      tags: ["NCR Harper", "Harper - Closed", "Harper - Gold"],
    }),
  });
  console.log(`Updated tags: ${updatedContact.contact.tags?.join(", ")}`);

  console.log(
    `\nDone! Check GHL for "${contactName}" contact + opportunity in Closed column.`
  );
}

test()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
