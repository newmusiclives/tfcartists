/**
 * Seed script to populate the database with realistic activation data.
 * Run with: npx tsx scripts/seed-activation-data.ts
 *
 * Seeds:
 * - 30 artists across all pipeline stages
 * - 15 submissions in various states
 * - 10 tier placements
 * - Activity records for all teams
 * - 5 listeners + sessions
 * - 5 sponsors in various pipeline stages
 *
 * Idempotent: checks for existing records before creating.
 */

import { PrismaClient, AirplayTier, SubmissionStatus, RotationTier, ArtistStatus, SponsorStatus, ListenerStatus, ListenerTier } from "@prisma/client";

const prisma = new PrismaClient();

const ARTIST_NAMES = [
  "Dusty Hollow",
  "The Sawmill Sisters",
  "Buck Larson",
  "Meadow Creek",
  "Carolina Pine",
  "Iron Ridge",
  "Maggie Dunes",
  "The Porchlight Band",
  "Otis Gravel",
  "Wildflower Union",
  "Hank Timber",
  "Rose Valley",
  "The Cattail Drifters",
  "Birch Hollow",
  "Sage & Stone",
  "Copper Creek Revival",
  "Lucille Fern",
  "The Flatbed Five",
  "Ember Sparks",
  "Clover Ridge",
  "Jasper Wynn",
  "The Sweetgrass Band",
  "Cedar Falls",
  "Bonnie Redfield",
  "The Hickory Saints",
  "Mossy Oak",
  "Delta Rain",
  "The Barnwood Boys",
  "Ivy Hollow",
  "Sagebrush Serenade",
];

const SONG_TITLES = [
  "Dusty Road Home",
  "Mountain Morning",
  "Whiskey Sunset",
  "Riverside Blues",
  "Old Porch Swing",
  "Timber Creek",
  "Lonesome Valley",
  "Wildfire Heart",
  "Steel Guitar Dreams",
  "Harvest Moon Rising",
  "Broken Fence Line",
  "Country Thunder",
  "Midnight Train",
  "Honky Tonk Angel",
  "Back Roads",
];

async function main() {
  console.log("Starting activation data seed...\n");

  // Check for existing artists to avoid duplicates
  const existingArtistCount = await prisma.artist.count();
  console.log(`Found ${existingArtistCount} existing artists`);

  // Find or use default station
  let station = await prisma.station.findFirst({ where: { isActive: true } });
  if (!station) {
    console.log("No active station found. Skipping station-specific seeds.");
  } else {
    console.log(`Using station: ${station.name} (${station.callSign})`);
  }

  // Seed artists across pipeline stages
  const artistStatuses: ArtistStatus[] = [
    // 8 DISCOVERED
    ...Array<ArtistStatus>(8).fill("DISCOVERED"),
    // 5 CONTACTED
    ...Array<ArtistStatus>(5).fill("CONTACTED"),
    // 4 ENGAGED
    ...Array<ArtistStatus>(4).fill("ENGAGED"),
    // 3 QUALIFIED
    ...Array<ArtistStatus>(3).fill("QUALIFIED"),
    // 3 ONBOARDING
    ...Array<ArtistStatus>(3).fill("ONBOARDING"),
    // 4 ACTIVATED
    ...Array<ArtistStatus>(4).fill("ACTIVATED"),
    // 2 ACTIVE
    ...Array<ArtistStatus>(2).fill("ACTIVE"),
    // 1 DORMANT
    ...Array<ArtistStatus>(1).fill("DORMANT"),
  ];

  const tiers: AirplayTier[] = ["FREE", "FREE", "FREE", "TIER_5", "TIER_5", "TIER_20", "TIER_50", "TIER_120"];

  const createdArtists: Array<{ id: string; name: string; status: string }> = [];

  for (let i = 0; i < ARTIST_NAMES.length; i++) {
    const name = ARTIST_NAMES[i];
    const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`;

    const existing = await prisma.artist.findFirst({ where: { email } });
    if (existing) {
      createdArtists.push({ id: existing.id, name: existing.name, status: existing.status });
      continue;
    }

    const status = artistStatuses[i] || "DISCOVERED";
    const isActive = ["ACTIVATED", "ACTIVE"].includes(status);
    const tier = isActive ? tiers[Math.floor(Math.random() * tiers.length)] : "FREE";

    const artist = await prisma.artist.create({
      data: {
        name,
        email,
        status,
        airplayTier: tier,
        genre: "Americana",
        discoverySource: ["instagram", "facebook", "tiktok", "referral", "website"][Math.floor(Math.random() * 5)],
        followerCount: Math.floor(Math.random() * 50000) + 500,
        engagementRate: Math.random() * 5 + 1,
        lastContactedAt: ["CONTACTED", "ENGAGED", "QUALIFIED", "ONBOARDING", "ACTIVATED", "ACTIVE"].includes(status) ? new Date(Date.now() - Math.random() * 30 * 86400000) : null,
        airplayActivatedAt: ["ACTIVATED", "ACTIVE"].includes(status) ? new Date(Date.now() - Math.random() * 14 * 86400000) : null,
      },
    });
    createdArtists.push({ id: artist.id, name: artist.name, status: artist.status });
  }

  console.log(`Seeded ${createdArtists.length} artists`);

  // Seed submissions (for SIGNED_UP, ACTIVATED, ACTIVE artists)
  const submittableArtists = createdArtists.filter((a) =>
    ["ONBOARDING", "ACTIVATED", "ACTIVE", "QUALIFIED"].includes(a.status)
  );

  const submissionStatuses: SubmissionStatus[] = [
    "PENDING", "PENDING", "PENDING", "PENDING", "PENDING",
    "IN_REVIEW", "IN_REVIEW", "IN_REVIEW",
    "PLACED", "PLACED", "PLACED", "PLACED",
    "JUDGED", "JUDGED",
    "NOT_PLACED",
  ];

  let submissionsCreated = 0;
  const placedSubmissions: Array<{ id: string; artistId: string }> = [];

  for (let i = 0; i < Math.min(submittableArtists.length, 15); i++) {
    const artist = submittableArtists[i];
    const existingSub = await prisma.submission.findFirst({
      where: { artistId: artist.id },
    });
    if (existingSub) {
      if (existingSub.status === "PLACED") {
        placedSubmissions.push({ id: existingSub.id, artistId: existingSub.artistId });
      }
      continue;
    }

    const status = submissionStatuses[i] || "PENDING";
    const sub = await prisma.submission.create({
      data: {
        artistId: artist.id,
        artistName: artist.name,
        trackTitle: SONG_TITLES[i % SONG_TITLES.length],
        trackFileUrl: `https://example.com/songs/${artist.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.mp3`,
        genre: "Americana",
        status,
        judgingStartedAt: ["PLACED", "JUDGED", "NOT_PLACED", "IN_REVIEW"].includes(status)
          ? new Date(Date.now() - Math.random() * 7 * 86400000)
          : null,
        judgingCompletedAt: ["PLACED", "JUDGED", "NOT_PLACED"].includes(status)
          ? new Date(Date.now() - Math.random() * 3 * 86400000)
          : null,
        tierAwarded: status === "PLACED" ? (["GOLD", "SILVER", "BRONZE"] as RotationTier[])[Math.floor(Math.random() * 3)] : null,
      },
    });

    if (status === "PLACED") {
      placedSubmissions.push({ id: sub.id, artistId: sub.artistId });
    }
    submissionsCreated++;
  }

  console.log(`Seeded ${submissionsCreated} submissions`);

  // Seed tier placements for PLACED submissions
  let placementsCreated = 0;
  for (const sub of placedSubmissions) {
    const existing = await prisma.tierPlacement.findFirst({
      where: { submissionId: sub.id },
    });
    if (existing) continue;

    const placementTier: RotationTier = (["GOLD", "SILVER", "BRONZE"] as RotationTier[])[Math.floor(Math.random() * 3)];
    // Look up artist name for the placement
    const placementArtist = createdArtists.find((a) => a.id === sub.artistId);
    await prisma.tierPlacement.create({
      data: {
        submissionId: sub.id,
        artistId: sub.artistId,
        artistName: placementArtist?.name || "Unknown",
        newTier: placementTier,
        decidedBy: "Cassidy Monroe",
        reason: "Initial placement from submission review",
      },
    });
    placementsCreated++;
  }

  console.log(`Seeded ${placementsCreated} tier placements`);

  // Seed listeners
  const listenerData = [
    { name: "Sarah Johnson", email: "sarah@example.com", discoverySource: "social_media" },
    { name: "Mike Chen", email: "mike@example.com", discoverySource: "friend_referral" },
    { name: "Emily Davis", email: "emily@example.com", discoverySource: "artist_referral" },
    { name: "Jake Wilson", email: "jake@example.com", discoverySource: "search" },
    { name: "Maria Garcia", email: "maria@example.com", discoverySource: "organic" },
  ];

  let listenersCreated = 0;
  const listenerIds: string[] = [];

  for (const ld of listenerData) {
    const existing = await prisma.listener.findFirst({ where: { email: ld.email } });
    if (existing) {
      listenerIds.push(existing.id);
      continue;
    }

    const listener = await prisma.listener.create({
      data: {
        name: ld.name,
        email: ld.email,
        discoverySource: ld.discoverySource,
        status: "ACTIVE" as ListenerStatus,
        tier: "REGULAR" as ListenerTier,
        totalSessions: Math.floor(Math.random() * 20) + 1,
        totalListeningHours: Math.random() * 50 + 1,
        lastListenedAt: new Date(Date.now() - Math.random() * 7 * 86400000),
      },
    });
    listenerIds.push(listener.id);
    listenersCreated++;
  }

  console.log(`Seeded ${listenersCreated} listeners`);

  // Seed listening sessions
  let sessionsCreated = 0;
  for (const listenerId of listenerIds) {
    const existingSessions = await prisma.listeningSession.count({
      where: { listenerId },
    });
    if (existingSessions > 0) continue;

    for (let j = 0; j < 3; j++) {
      const startTime = new Date(Date.now() - Math.random() * 7 * 86400000);
      const duration = Math.floor(Math.random() * 120) + 10; // 10-130 minutes
      await prisma.listeningSession.create({
        data: {
          listenerId,
          startTime,
          endTime: new Date(startTime.getTime() + duration * 60000),
          duration,
          timeSlot: ["morning", "midday", "evening", "late_night"][Math.floor(Math.random() * 4)],
          device: "web",
        },
      });
      sessionsCreated++;
    }
  }

  console.log(`Seeded ${sessionsCreated} listening sessions`);

  // Seed sponsors
  const sponsorData: Array<{ businessName: string; email: string; businessType: string; status: SponsorStatus; tier: string | null }> = [
    { businessName: "Mountain Music Venue", email: "info@mountainmusic.example.com", businessType: "music_venue", status: "ACTIVE", tier: "gold" },
    { businessName: "Riverside Brewing Co", email: "sponsors@riversidebrew.example.com", businessType: "restaurant_bar", status: "ACTIVE", tier: "silver" },
    { businessName: "Harmony Guitar Shop", email: "hello@harmonyguitar.example.com", businessType: "music_shop", status: "CLOSED", tier: "bronze" },
    { businessName: "Pine Valley Crafts", email: "contact@pinevalley.example.com", businessType: "craft_maker", status: "INTERESTED", tier: null },
    { businessName: "Oakwood Legal", email: "partner@oakwoodlegal.example.com", businessType: "professional_services", status: "DISCOVERED", tier: null },
  ];

  let sponsorsCreated = 0;
  for (const sd of sponsorData) {
    const existing = await prisma.sponsor.findFirst({ where: { email: sd.email } });
    if (existing) continue;

    const sponsor = await prisma.sponsor.create({
      data: {
        businessName: sd.businessName,
        email: sd.email,
        businessType: sd.businessType,
        status: sd.status,
        pipelineStage: (["ACTIVE", "CLOSED"] as SponsorStatus[]).includes(sd.status) ? "closed" : sd.status === "INTERESTED" ? "interested" : "discovery",
        discoverySource: "seed_data",
        sponsorshipTier: sd.tier,
      },
    });

    // Create sponsorship records for active sponsors
    if (sd.status === "ACTIVE" && sd.tier) {
      const amounts: Record<string, number> = { bronze: 500, silver: 1500, gold: 3000, platinum: 6000 };
      await prisma.sponsorship.create({
        data: {
          sponsorId: sponsor.id,
          tier: sd.tier,
          monthlyAmount: amounts[sd.tier] || 500,
          status: "active",
          startDate: new Date(Date.now() - 30 * 86400000),
        },
      });
    }

    sponsorsCreated++;
  }

  console.log(`Seeded ${sponsorsCreated} sponsors`);

  // Seed team activity
  let activitiesCreated = 0;

  // Riley activities
  for (let i = 0; i < 5; i++) {
    await prisma.rileyActivity.create({
      data: {
        action: ["discovered_artist", "sent_outreach", "artist_signed_up", "artist_activated", "tier_upgrade"][i],
        artistId: createdArtists[i]?.id || null,
        details: { artistName: createdArtists[i]?.name, automated: i < 2 },
        successful: true,
      },
    });
    activitiesCreated++;
  }

  // Harper activities
  for (let i = 0; i < 3; i++) {
    await prisma.harperActivity.create({
      data: {
        action: ["sponsor_discovered", "pitch_sent", "sponsor_closed"][i],
        details: { sponsorName: sponsorData[i]?.businessName, tier: sponsorData[i]?.tier },
        successful: true,
      },
    });
    activitiesCreated++;
  }

  // Cassidy activities
  for (let i = 0; i < 4; i++) {
    await prisma.cassidyActivity.create({
      data: {
        action: ["submission_reviewed", "tier_assigned", "submission_reviewed", "submission_reviewed"][i],
        details: { songTitle: SONG_TITLES[i], decision: i < 2 ? "placed" : "pending" },
        successful: true,
      },
    });
    activitiesCreated++;
  }

  // Elliot activities
  for (let i = 0; i < 3; i++) {
    await prisma.elliotActivity.create({
      data: {
        action: ["registered_listener", "campaign_launched", "registered_listener"][i],
        teamMember: "elliot",
        listenerId: listenerIds[i] || null,
        details: { listenerName: listenerData[i]?.name },
        successful: true,
      },
    });
    activitiesCreated++;
  }

  console.log(`Seeded ${activitiesCreated} activity records`);

  console.log("\nActivation data seed complete!");
  console.log("Summary:");
  console.log(`  Artists: ${createdArtists.length}`);
  console.log(`  Submissions: ${submissionsCreated}`);
  console.log(`  Tier Placements: ${placementsCreated}`);
  console.log(`  Listeners: ${listenersCreated}`);
  console.log(`  Sessions: ${sessionsCreated}`);
  console.log(`  Sponsors: ${sponsorsCreated}`);
  console.log(`  Activities: ${activitiesCreated}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
