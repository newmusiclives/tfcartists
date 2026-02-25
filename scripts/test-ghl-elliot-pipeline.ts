#!/usr/bin/env npx tsx
import "dotenv/config";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const API_KEY = process.env.GHL_API_KEY!;
const LOCATION_ID = process.env.GHL_LOCATION_ID!;
const PIPELINE_ID = process.env.GHL_ELLIOT_PIPELINE_ID!;

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
    console.error("Missing GHL_API_KEY, GHL_LOCATION_ID, or GHL_ELLIOT_PIPELINE_ID in .env");
    console.error("Run setup-ghl-elliot-pipeline.ts first to get the pipeline ID.");
    process.exit(1);
  }

  const testEmail = `elliot-test-${Date.now()}@example.com`;
  const listenerName = "Test Listener (Elliot)";

  // 1. Upsert contact with Elliot tags
  console.log("=== Step 1: Upsert contact with Elliot - New tags ===");
  const contactData = await ghlFetch("/contacts/upsert", {
    method: "POST",
    body: JSON.stringify({
      locationId: LOCATION_ID,
      email: testEmail,
      name: listenerName,
      tags: ["NCR Elliot", "Elliot - New"],
    }),
  });
  const contactId = contactData.contact.id;
  console.log(`Contact ID: ${contactId}`);
  console.log(`Tags: ${contactData.contact.tags?.join(", ")}`);

  // 2. Fetch pipeline stages
  console.log("\n=== Step 2: Fetch Elliot pipeline stages ===");
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

  // 3. Create opportunity at New
  console.log("\n=== Step 3: Create opportunity at New ===");
  const newStageId = stageMap["new"];
  if (!newStageId) {
    throw new Error('Stage "New" not found in pipeline');
  }

  const oppData = await ghlFetch("/opportunities/upsert", {
    method: "POST",
    body: JSON.stringify({
      pipelineId: PIPELINE_ID,
      pipelineStageId: newStageId,
      locationId: LOCATION_ID,
      contactId,
      name: listenerName,
      status: "open",
    }),
  });
  console.log(`Opportunity ID: ${oppData.opportunity?.id}`);
  console.log(`Stage: New`);

  // 4. Move opportunity to Engaged
  console.log("\n=== Step 4: Move opportunity to Engaged ===");
  const engagedStageId = stageMap["engaged"];
  if (!engagedStageId) {
    throw new Error('Stage "Engaged" not found in pipeline');
  }

  await ghlFetch("/opportunities/upsert", {
    method: "POST",
    body: JSON.stringify({
      pipelineId: PIPELINE_ID,
      pipelineStageId: engagedStageId,
      locationId: LOCATION_ID,
      contactId,
      name: listenerName,
      status: "open",
    }),
  });
  console.log(`Opportunity moved to Engaged`);

  // 5. Move to Active
  console.log("\n=== Step 5: Move opportunity to Active ===");
  const activeStageId = stageMap["active"];
  if (!activeStageId) {
    throw new Error('Stage "Active" not found in pipeline');
  }

  await ghlFetch("/opportunities/upsert", {
    method: "POST",
    body: JSON.stringify({
      pipelineId: PIPELINE_ID,
      pipelineStageId: activeStageId,
      locationId: LOCATION_ID,
      contactId,
      name: listenerName,
      status: "open",
    }),
  });
  console.log(`Opportunity moved to Active`);

  // 6. Update contact tags with Super Fan tier
  console.log("\n=== Step 6: Update contact tags with Super Fan tier ===");
  const updatedContact = await ghlFetch("/contacts/upsert", {
    method: "POST",
    body: JSON.stringify({
      locationId: LOCATION_ID,
      email: testEmail,
      name: listenerName,
      tags: ["NCR Elliot", "Elliot - Active", "Elliot - Super Fan"],
    }),
  });
  console.log(`Updated tags: ${updatedContact.contact.tags?.join(", ")}`);

  console.log(
    `\nDone! Check GHL for "${listenerName}" contact + opportunity in Active column.`
  );
}

test()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
