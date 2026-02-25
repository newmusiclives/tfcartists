#!/usr/bin/env npx tsx
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const API_KEY = process.env.GHL_API_KEY!;
const LOCATION_ID = process.env.GHL_LOCATION_ID!;
const RILEY_PIPELINE_ID = process.env.GHL_RILEY_PIPELINE_ID!;
const CASSIDY_PIPELINE_ID = process.env.GHL_CASSIDY_PIPELINE_ID!;

const prisma = new PrismaClient();

async function cleanGHLPipeline(pipelineId: string, name: string) {
  console.log(`\n=== Cleaning GHL ${name} Pipeline ===`);
  const oppRes = await fetch(
    `${GHL_BASE_URL}/opportunities/search?location_id=${LOCATION_ID}&pipeline_id=${pipelineId}&limit=100`,
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

  console.log(`Found ${opps.length} opportunities`);

  let deleted = 0;
  for (const opp of opps) {
    const res = await fetch(`${GHL_BASE_URL}/opportunities/${opp.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      console.log(`  Deleted: "${opp.name}"`);
      deleted++;
    } else {
      console.error(`  Failed: "${opp.name}" (${res.status})`);
    }
  }
  console.log(`${name} pipeline: ${deleted} deleted`);
}

async function deleteMany(label: string, fn: () => Promise<{ count: number }>) {
  const result = await fn();
  if (result.count > 0) console.log(`  ${label}: ${result.count}`);
  return result.count;
}

async function cleanDatabase() {
  let total = 0;

  // === RILEY TEAM ===
  console.log("\n=== Cleaning Riley Team ===");
  total += await deleteMany("Donations", () => prisma.donation.deleteMany({}));
  total += await deleteMany("Referrals", () => prisma.referral.deleteMany({}));
  total += await deleteMany("Shows", () => prisma.show.deleteMany({}));
  total += await deleteMany("Messages", () => prisma.message.deleteMany({}));
  total += await deleteMany("Conversations", () => prisma.conversation.deleteMany({}));
  total += await deleteMany("Riley communications", () => prisma.rileyCommunication.deleteMany({}));
  total += await deleteMany("Riley activities", () => prisma.rileyActivity.deleteMany({}));
  total += await deleteMany("Riley campaigns", () => prisma.rileyCampaign.deleteMany({}));
  total += await deleteMany("Track submissions", () => prisma.trackSubmission.deleteMany({}));
  total += await deleteMany("Airplay payments", () => prisma.airplayPayment.deleteMany({}));
  total += await deleteMany("Radio earnings", () => prisma.radioEarnings.deleteMany({}));
  total += await deleteMany("Artists", () => prisma.artist.deleteMany({}));

  // === CASSIDY TEAM ===
  console.log("\n=== Cleaning Cassidy Team ===");
  total += await deleteMany("Cassidy activities", () => prisma.cassidyActivity.deleteMany({}));
  total += await deleteMany("Tier placements", () => prisma.tierPlacement.deleteMany({}));
  total += await deleteMany("Progression requests", () => prisma.progressionRequest.deleteMany({}));
  total += await deleteMany("Panel meetings", () => prisma.panelMeeting.deleteMany({}));
  total += await deleteMany("Rotation slots", () => prisma.rotationSlot.deleteMany({}));
  total += await deleteMany("Submission reviews", () => prisma.submissionReview.deleteMany({}));
  total += await deleteMany("Submissions", () => prisma.submission.deleteMany({}));
  total += await deleteMany("Scout commissions", () => prisma.scoutCommission.deleteMany({}));
  total += await deleteMany("Artist discoveries", () => prisma.artistDiscovery.deleteMany({}));
  total += await deleteMany("Listener referrals", () => prisma.listenerReferral.deleteMany({}));
  total += await deleteMany("Airplay prepurchases", () => prisma.airplayPrepurchase.deleteMany({}));
  total += await deleteMany("Scouts", () => prisma.scout.deleteMany({}));

  // === HARPER TEAM ===
  console.log("\n=== Cleaning Harper Team ===");
  total += await deleteMany("Harper activities", () => prisma.harperActivity.deleteMany({}));
  total += await deleteMany("Sponsor messages", () => prisma.sponsorMessage.deleteMany({}));
  total += await deleteMany("Sponsor conversations", () => prisma.sponsorConversation.deleteMany({}));
  total += await deleteMany("Sponsor calls", () => prisma.sponsorCall.deleteMany({}));
  total += await deleteMany("Sponsor commissions", () => prisma.sponsorCommission.deleteMany({}));
  total += await deleteMany("Sponsor referral chains", () => prisma.sponsorReferralChain.deleteMany({}));
  total += await deleteMany("Sponsor bulk purchases", () => prisma.sponsorBulkPurchase.deleteMany({}));
  total += await deleteMany("Sponsor artist development", () => prisma.sponsorArtistDevelopment.deleteMany({}));
  total += await deleteMany("Sponsor listener referrals", () => prisma.sponsorListenerReferral.deleteMany({}));
  total += await deleteMany("Sponsor growth partners", () => prisma.sponsorGrowthPartner.deleteMany({}));
  total += await deleteMany("Sponsorships", () => prisma.sponsorship.deleteMany({}));
  total += await deleteMany("Sponsors", () => prisma.sponsor.deleteMany({}));

  // === ELLIOT TEAM ===
  console.log("\n=== Cleaning Elliot Team ===");
  total += await deleteMany("Elliot activities", () => prisma.elliotActivity.deleteMany({}));
  total += await deleteMany("Campaign responses", () => prisma.campaignResponse.deleteMany({}));
  total += await deleteMany("Growth campaigns", () => prisma.growthCampaign.deleteMany({}));
  total += await deleteMany("Listener engagements", () => prisma.listenerEngagement.deleteMany({}));
  total += await deleteMany("Viral content", () => prisma.viralContent.deleteMany({}));
  total += await deleteMany("Listener playback", () => prisma.listenerPlayback.deleteMany({}));
  total += await deleteMany("Listening sessions", () => prisma.listeningSession.deleteMany({}));
  total += await deleteMany("Listeners", () => prisma.listener.deleteMany({}));

  // === ADMIN / SHARED ===
  console.log("\n=== Cleaning Admin / Shared ===");
  total += await deleteMany("Radio revenue pools", () => prisma.radioRevenuePool.deleteMany({}));
  total += await deleteMany("Embed events", () => prisma.embedEvent.deleteMany({}));
  total += await deleteMany("XP transactions", () => prisma.xPTransaction.deleteMany({}));
  total += await deleteMany("Badges", () => prisma.badge.deleteMany({}));
  total += await deleteMany("Track playback", () => prisma.trackPlayback.deleteMany({}));

  console.log(`\nTotal records deleted: ${total}`);
}

async function main() {
  // Clean GHL pipelines
  if (RILEY_PIPELINE_ID) {
    await cleanGHLPipeline(RILEY_PIPELINE_ID, "Riley");
  }
  if (CASSIDY_PIPELINE_ID) {
    await cleanGHLPipeline(CASSIDY_PIPELINE_ID, "Cassidy");
  }

  // Clean all database test data
  await cleanDatabase();

  console.log("\nAll test data cleaned across all teams!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
