#!/usr/bin/env npx tsx
import "dotenv/config";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const API_KEY = process.env.GHL_API_KEY!;
const LOCATION_ID = process.env.GHL_LOCATION_ID!;
const PIPELINE_ID = process.env.GHL_RILEY_PIPELINE_ID!;

async function test() {
  // 1. Upsert contact
  console.log("=== Upserting contact ===");
  const contactRes = await fetch(`${GHL_BASE_URL}/contacts/upsert`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      locationId: LOCATION_ID,
      email: "jake.rivers.test.1771877049855@example.com",
      name: "Jake Rivers",
      tags: ["NCR Riley", "Riley - Engaged"],
    }),
  });

  console.log("Contact status:", contactRes.status);
  const contactBody = await contactRes.json();

  if (contactRes.status >= 400) {
    console.log("Error:", JSON.stringify(contactBody));
    return;
  }

  const contactId = contactBody.contact.id;
  console.log("Contact ID:", contactId);
  console.log("Tags:", contactBody.contact.tags);

  // 2. Fetch pipeline stages
  console.log("\n=== Fetching pipeline stages ===");
  const pipeRes = await fetch(
    `${GHL_BASE_URL}/opportunities/pipelines?locationId=${LOCATION_ID}`,
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
    }
  );

  const pipeBody = await pipeRes.json();
  const pipeline = pipeBody.pipelines?.find((p: any) => p.id === PIPELINE_ID);
  const engagedStage = pipeline?.stages?.find(
    (s: any) => s.name.toLowerCase() === "engaged"
  );
  console.log("Engaged stage ID:", engagedStage?.id);

  // 3. Upsert opportunity
  console.log("\n=== Upserting opportunity ===");
  const oppRes = await fetch(`${GHL_BASE_URL}/opportunities/upsert`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pipelineId: PIPELINE_ID,
      pipelineStageId: engagedStage.id,
      locationId: LOCATION_ID,
      contactId,
      name: "Jake Rivers - Riley Pipeline",
      status: "open",
    }),
  });

  console.log("Opportunity status:", oppRes.status);
  const oppBody = await oppRes.json();
  console.log("Opportunity:", JSON.stringify(oppBody, null, 2));

  console.log(
    "\nDone! Check GHL for Jake Rivers contact + opportunity in Engaged column."
  );
}

test()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
