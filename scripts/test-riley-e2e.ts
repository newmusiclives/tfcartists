/**
 * Riley End-to-End Pipeline Test
 *
 * Tests the full flow:
 *   1. Create artist (discovery)
 *   2. Riley AI generates outreach message
 *   3. Simulate artist response → Riley AI replies
 *   4. Submit track to Cassidy
 *   5. All 6 judges score the submission
 *   6. Cassidy assigns tier → Song created in rotation
 *   7. Verify Song exists in library with category E
 *
 * Usage: npx tsx scripts/test-riley-e2e.ts
 *        npx tsx scripts/test-riley-e2e.ts --skip-ai   (skip AI calls, use canned messages)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const skipAI = process.argv.includes("--skip-ai");

const DIVIDER = "─".repeat(60);

function step(n: number, label: string) {
  console.log(`\n${DIVIDER}`);
  console.log(`  STEP ${n}: ${label}`);
  console.log(DIVIDER);
}

async function main() {
  console.log("\n🎸 Riley End-to-End Pipeline Test");
  console.log(`   AI mode: ${skipAI ? "SKIPPED (canned messages)" : "LIVE (OpenAI)"}\n`);

  // ──────────────────────────────────────────────────────────
  // STEP 1: Create artist
  // ──────────────────────────────────────────────────────────
  step(1, "Create artist (Riley discovers someone)");

  const testEmail = `jake.rivers.test.${Date.now()}@example.com`;
  const artist = await prisma.artist.create({
    data: {
      name: "Jake Rivers",
      email: testEmail,
      genre: "Americana",
      bio: "Singer-songwriter from Austin, TX. Writes about back roads and broken hearts.",
      discoverySource: "instagram",
      sourceHandle: "@jakerivers",
      status: "DISCOVERED",
      pipelineStage: "discovery",
    },
  });
  console.log(`  Created artist: ${artist.name} (${artist.id})`);
  console.log(`  Status: ${artist.status} | Stage: ${artist.pipelineStage}`);

  // ──────────────────────────────────────────────────────────
  // STEP 2: Riley sends outreach
  // ──────────────────────────────────────────────────────────
  step(2, "Riley sends initial outreach");

  let outreachMessage: string;

  if (skipAI) {
    outreachMessage =
      "Hey Jake! I'm Riley from TrueFans RADIO. We spotlight indie Americana artists with free airplay — your stuff on Instagram caught my ear. Would love to chat about getting your music on the air. No strings attached.";
  } else {
    // Use the actual RileyAgent
    const { riley } = await import("../src/lib/ai/riley-agent");
    outreachMessage = await riley.generateResponse({
      artistId: artist.id,
      artistName: artist.name,
      genre: artist.genre || undefined,
      conversationHistory: [],
      intent: "initial_outreach",
    });
  }

  // Create conversation + message in DB (mirroring what RileyAgent.sendMessage does)
  const conversation = await prisma.conversation.create({
    data: {
      artistId: artist.id,
      channel: "email",
      isActive: true,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "riley",
      content: outreachMessage,
      intent: "initial_outreach",
      aiProvider: skipAI ? "test" : "openai",
    },
  });

  await prisma.artist.update({
    where: { id: artist.id },
    data: {
      status: "CONTACTED",
      pipelineStage: "contacted",
      lastContactedAt: new Date(),
      conversationCount: 1,
    },
  });

  await prisma.rileyActivity.create({
    data: {
      action: "sent_message",
      artistId: artist.id,
      details: { intent: "initial_outreach", channel: "email" },
      aiProvider: skipAI ? "test" : "openai",
    },
  });

  console.log(`  Riley says: "${outreachMessage}"`);
  console.log(`  Artist status → CONTACTED`);

  // ──────────────────────────────────────────────────────────
  // STEP 3: Artist responds → Riley replies
  // ──────────────────────────────────────────────────────────
  step(3, "Artist responds, Riley replies");

  const artistMessage = "Hey Riley! That sounds awesome, I've been looking for more exposure. I have a show coming up in Austin next month at The Continental Club.";

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "artist",
      content: artistMessage,
    },
  });

  console.log(`  Jake says: "${artistMessage}"`);

  let rileyReply: string;

  if (skipAI) {
    rileyReply =
      "That's great to hear, Jake! The Continental Club is a legendary spot. Let's get one of your tracks on the air before your show — it'll give your fans something to buzz about. Can you send me your best recording?";
  } else {
    const { riley } = await import("../src/lib/ai/riley-agent");
    rileyReply = await riley.generateResponse({
      artistId: artist.id,
      artistName: artist.name,
      genre: artist.genre || undefined,
      nextShowDate: "next month",
      venue: "The Continental Club",
      conversationHistory: [
        { role: "riley", content: outreachMessage },
        { role: "artist", content: artistMessage },
      ],
      intent: "qualify_live_shows",
    });
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "riley",
      content: rileyReply,
      intent: "qualify_live_shows",
      aiProvider: skipAI ? "test" : "openai",
    },
  });

  await prisma.artist.update({
    where: { id: artist.id },
    data: {
      status: "ENGAGED",
      pipelineStage: "engaged",
      conversationCount: 2,
      nextShowVenue: "The Continental Club",
      nextShowCity: "Austin",
    },
  });

  console.log(`  Riley says: "${rileyReply}"`);
  console.log(`  Artist status → ENGAGED`);

  // ──────────────────────────────────────────────────────────
  // STEP 4: Submit track to Cassidy
  // ──────────────────────────────────────────────────────────
  step(4, "Submit track to Cassidy for review");

  const submission = await prisma.submission.create({
    data: {
      artistId: artist.id,
      artistName: artist.name,
      artistEmail: testEmail,
      trackTitle: "Dust & Diesel",
      trackFileUrl: "https://cdn.example.com/jake-rivers/dust-and-diesel.mp3",
      trackDuration: 214,
      genre: "Americana",
      discoverySource: "instagram",
      discoveredBy: "Riley Carpenter",
      status: "PENDING",
      rileyContext: {
        pipelineStage: "engaged",
        conversationCount: 2,
        hasUpcomingShow: true,
        venue: "The Continental Club, Austin",
      },
    },
  });

  console.log(`  Submission: "${submission.trackTitle}" (${submission.id})`);
  console.log(`  Status: PENDING`);

  // ──────────────────────────────────────────────────────────
  // STEP 5: All 6 judges review
  // ──────────────────────────────────────────────────────────
  step(5, "Judge panel reviews the submission");

  const judges = await prisma.judge.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  if (judges.length === 0) {
    console.error("  ERROR: No judges found! Run: npx tsx scripts/seed-judges.ts");
    process.exit(1);
  }

  console.log(`  Found ${judges.length} active judges`);

  // Move to IN_REVIEW
  await prisma.submission.update({
    where: { id: submission.id },
    data: { status: "IN_REVIEW", judgingStartedAt: new Date() },
  });

  // Each judge scores
  const judgeScores = [
    { overall: 82, production: 78, commercial: 80, artistic: 85, performance: 83, cultural: 79, growthPotential: 88, tier: "SILVER" as const, strengths: "Authentic storytelling, warm vocal tone", growthAreas: "Mix could use more low-end warmth" },
    { overall: 79, production: 75, commercial: 82, artistic: 80, performance: 81, cultural: 77, growthPotential: 85, tier: "SILVER" as const, strengths: "Strong hooks, radio-friendly structure", growthAreas: "Could develop more dynamic range" },
    { overall: 84, production: 80, commercial: 78, artistic: 88, performance: 86, cultural: 83, growthPotential: 82, tier: "SILVER" as const, strengths: "Excellent vocal delivery, emotionally resonant", growthAreas: "Arrangement could be tighter in the bridge" },
    { overall: 81, production: 76, commercial: 79, artistic: 84, performance: 80, cultural: 85, growthPotential: 80, tier: "SILVER" as const, strengths: "Genre authenticity, strong lyrical depth", growthAreas: "Production could be warmer for radio" },
    { overall: 80, production: 77, commercial: 83, artistic: 78, performance: 79, cultural: 76, growthPotential: 90, tier: "SILVER" as const, strengths: "High growth potential, engaged fanbase", growthAreas: "Social presence could be stronger" },
    { overall: 83, production: 79, commercial: 81, artistic: 86, performance: 84, cultural: 82, growthPotential: 86, tier: "SILVER" as const, strengths: "Complete package, ready for rotation", growthAreas: "Minor EQ adjustments needed for broadcast" },
  ];

  for (let i = 0; i < judges.length; i++) {
    const judge = judges[i];
    const scores = judgeScores[i % judgeScores.length];

    await prisma.submissionReview.create({
      data: {
        submissionId: submission.id,
        judgeId: judge.id,
        overallScore: scores.overall,
        productionQuality: scores.production,
        commercialViability: scores.commercial,
        artisticMerit: scores.artistic,
        performanceQuality: scores.performance,
        culturalSignificance: scores.cultural,
        growthPotential: scores.growthPotential,
        strengths: scores.strengths,
        growthAreas: scores.growthAreas,
        tierRecommendation: scores.tier,
      },
    });

    console.log(`  ${judge.name} (${judge.role}): ${scores.overall}/100 → recommends ${scores.tier}`);
  }

  // Mark as JUDGED
  await prisma.submission.update({
    where: { id: submission.id },
    data: { status: "JUDGED", judgingCompletedAt: new Date(), tierAwarded: "SILVER" },
  });

  console.log(`  All ${judges.length} judges scored → status: JUDGED`);

  // ──────────────────────────────────────────────────────────
  // STEP 6: Cassidy assigns tier → Song created
  // ──────────────────────────────────────────────────────────
  step(6, "Cassidy assigns tier (Song enters rotation)");

  // Create tier placement
  const tierPlacement = await prisma.tierPlacement.create({
    data: {
      submissionId: submission.id,
      artistId: artist.id,
      artistName: artist.name,
      newTier: "SILVER",
      decidedBy: "Cassidy Monroe",
      reason: "Strong panel consensus at Silver. Authentic Americana voice with high growth potential.",
      judgeScores: {
        judges: judges.map((j, i) => ({
          judgeName: j.name,
          overallScore: judgeScores[i % judgeScores.length].overall,
          tierRecommendation: "SILVER",
        })),
      },
    },
  });

  // Update submission to PLACED
  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: "PLACED",
      awardedAt: new Date(),
      rotationSpinsWeekly: 12,
      decisionRationale: "Strong panel consensus at Silver. Authentic Americana voice with high growth potential.",
    },
  });

  // Create Song (the critical bridge we just built)
  const station = await prisma.station.findFirst();
  let song: { id: string } | null = null;

  if (station) {
    song = await prisma.song.create({
      data: {
        stationId: station.id,
        title: submission.trackTitle,
        artistName: artist.name,
        fileUrl: submission.trackFileUrl,
        duration: submission.trackDuration,
        genre: submission.genre,
        rotationCategory: "E",
        tempoCategory: "medium",
        vocalGender: "unknown",
        isActive: true,
      },
    });
    console.log(`  Tier: SILVER (12 spins/week)`);
    console.log(`  TierPlacement: ${tierPlacement.id}`);
    console.log(`  Song created: ${song.id}`);
    console.log(`  Rotation category: E (Indie)`);
  } else {
    console.log(`  WARNING: No station found — Song NOT created`);
    console.log(`  TierPlacement created but track won't play on air`);
  }

  // Log Cassidy activity
  await prisma.cassidyActivity.create({
    data: {
      action: "assigned_tier",
      submissionId: submission.id,
      artistId: artist.id,
      details: { tier: "SILVER", spinsWeekly: 12, testRun: true },
    },
  });

  // ──────────────────────────────────────────────────────────
  // STEP 7: Verify
  // ──────────────────────────────────────────────────────────
  step(7, "Verify end-to-end results");

  // Check artist final state
  const finalArtist = await prisma.artist.findUnique({ where: { id: artist.id } });
  console.log(`  Artist: ${finalArtist!.name}`);
  console.log(`    Status: ${finalArtist!.status}`);
  console.log(`    Pipeline: ${finalArtist!.pipelineStage}`);
  console.log(`    Conversations: ${finalArtist!.conversationCount}`);

  // Check messages
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });
  console.log(`    Messages: ${messages.length} (${messages.filter(m => m.role === "riley").length} from Riley, ${messages.filter(m => m.role === "artist").length} from artist)`);

  // Check submission
  const finalSub = await prisma.submission.findUnique({ where: { id: submission.id } });
  console.log(`  Submission: "${finalSub!.trackTitle}"`);
  console.log(`    Status: ${finalSub!.status}`);
  console.log(`    Tier: ${finalSub!.tierAwarded}`);
  console.log(`    Spins/week: ${finalSub!.rotationSpinsWeekly}`);

  // Check reviews
  const reviews = await prisma.submissionReview.count({ where: { submissionId: submission.id } });
  console.log(`    Reviews: ${reviews}/${judges.length} judges`);

  // Check Song in library
  if (song) {
    const librarySong = await prisma.song.findUnique({ where: { id: song.id } });
    console.log(`  Song in library: "${librarySong!.title}" by ${librarySong!.artistName}`);
    console.log(`    Category: ${librarySong!.rotationCategory} (E = Indie)`);
    console.log(`    Active: ${librarySong!.isActive}`);
    console.log(`    File: ${librarySong!.fileUrl}`);
  }

  // Count all E category songs
  const eSongs = await prisma.song.count({
    where: { rotationCategory: "E", isActive: true },
  });
  console.log(`  Total E-category songs in rotation: ${eSongs}`);

  // Riley activity count
  const rileyActivities = await prisma.rileyActivity.count({
    where: { artistId: artist.id },
  });
  console.log(`  Riley activities logged: ${rileyActivities}`);

  console.log(`\n${DIVIDER}`);
  console.log("  END-TO-END TEST COMPLETE");
  console.log(DIVIDER);
  console.log(`\n  Test artist ID: ${artist.id}`);
  console.log(`  Test email: ${testEmail}`);
  console.log(`  To clean up: DELETE FROM "Artist" WHERE id = '${artist.id}';\n`);
}

main()
  .catch((e) => {
    console.error("\nTest failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
