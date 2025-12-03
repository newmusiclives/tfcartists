/**
 * Seed demo data for testing
 * Run with: npm run seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding demo data...");

  // Create demo artists
  const artist1 = await prisma.artist.create({
    data: {
      name: "Sarah Miller",
      email: "sarah@example.com",
      phone: "+1-555-0101",
      genre: "Indie Folk",
      discoverySource: "instagram",
      sourceHandle: "@sarahmillermusic",
      sourceUrl: "https://instagram.com/sarahmillermusic",
      followerCount: 3500,
      engagementRate: 4.2,
      status: "CONTACTED",
      pipelineStage: "contacted",
      hasLiveShows: true,
    },
  });

  const artist2 = await prisma.artist.create({
    data: {
      name: "Marcus Chen",
      email: "marcus@example.com",
      phone: "+1-555-0102",
      genre: "Hip Hop",
      discoverySource: "tiktok",
      sourceHandle: "@marcusbeats",
      sourceUrl: "https://tiktok.com/@marcusbeats",
      followerCount: 12000,
      engagementRate: 6.8,
      status: "QUALIFIED",
      pipelineStage: "qualified",
      hasLiveShows: true,
      nextShowDate: new Date("2024-12-15T20:00:00"),
      nextShowVenue: "The Blue Room",
      nextShowCity: "Austin, TX",
    },
  });

  const artist3 = await prisma.artist.create({
    data: {
      name: "Luna Star",
      email: "luna@example.com",
      genre: "Electronic Pop",
      discoverySource: "spotify",
      sourceHandle: "lunastarmusic",
      sourceUrl: "https://spotify.com/artist/lunastar",
      followerCount: 8500,
      engagementRate: 5.1,
      status: "ACTIVATED",
      pipelineStage: "activated",
      hasLiveShows: true,
      hasUsedNineWord: true,
      firstWinDate: new Date("2024-11-28T21:30:00"),
    },
  });

  console.log("✅ Created demo artists");

  // Create conversations
  const conv1 = await prisma.conversation.create({
    data: {
      artistId: artist1.id,
      channel: "sms",
      isActive: true,
      messages: {
        create: [
          {
            role: "riley",
            content: "Hey Sarah — quick q: do you play live shows?",
            intent: "initial_outreach",
            aiProvider: "claude",
          },
          {
            role: "artist",
            content: "Yes I do! I play at local coffee shops mostly",
          },
          {
            role: "riley",
            content:
              "Nice! I've got something insanely simple that helps artists earn more during their sets. Want to hear about it?",
            intent: "qualify_live_shows",
            aiProvider: "claude",
          },
        ],
      },
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      artistId: artist2.id,
      channel: "sms",
      isActive: true,
      messages: {
        create: [
          {
            role: "riley",
            content: "Hey Marcus! Saw your TikTok — love the beats. Do you perform live?",
            intent: "initial_outreach",
            aiProvider: "claude",
          },
          {
            role: "artist",
            content: "Thanks! Yeah I have shows pretty regularly",
          },
          {
            role: "riley",
            content:
              "Perfect. It's called TrueFans RADIO — you say one 9-word line onstage and fans can instantly support you. No setup, no QR codes. Interested?",
            intent: "educate_product",
            aiProvider: "claude",
          },
          {
            role: "artist",
            content: "That sounds simple. What's the line?",
          },
          {
            role: "riley",
            content:
              "Just: 'To support my music, text TRUEFANS to [your number]' — that's it. Want to try it at your next show?",
            intent: "educate_product",
            aiProvider: "claude",
          },
          {
            role: "artist",
            content: "Yeah let's do it. I have a show on Dec 15",
          },
          {
            role: "riley",
            content: "Perfect! The Blue Room in Austin, right? I'll send you a reminder the day before 🎤",
            intent: "book_show",
            aiProvider: "claude",
          },
        ],
      },
    },
  });

  console.log("✅ Created conversations");

  // Create shows for Luna (activated artist)
  const show1 = await prisma.show.create({
    data: {
      artistId: artist3.id,
      date: new Date("2024-11-28T21:00:00"),
      venue: "Electric Garden",
      city: "Portland, OR",
      status: "COMPLETED",
      usedNineWord: true,
      donationCount: 8,
      totalRaised: 127.5,
    },
  });

  console.log("✅ Created shows");

  // Create donations for Luna's show
  await prisma.donation.createMany({
    data: [
      {
        artistId: artist3.id,
        showId: show1.id,
        amount: 20,
        fanName: "Alex R.",
        isFirstWin: true,
      },
      {
        artistId: artist3.id,
        showId: show1.id,
        amount: 15,
        fanName: "Jamie L.",
      },
      {
        artistId: artist3.id,
        showId: show1.id,
        amount: 10,
        fanName: "Taylor M.",
      },
      {
        artistId: artist3.id,
        showId: show1.id,
        amount: 25,
        fanName: "Jordan K.",
      },
      {
        artistId: artist3.id,
        showId: show1.id,
        amount: 12.5,
      },
      {
        artistId: artist3.id,
        showId: show1.id,
        amount: 15,
        fanName: "Casey D.",
      },
      {
        artistId: artist3.id,
        showId: show1.id,
        amount: 10,
      },
      {
        artistId: artist3.id,
        showId: show1.id,
        amount: 20,
        fanName: "Morgan P.",
      },
    ],
  });

  console.log("✅ Created donations");

  // Create Riley activity log
  await prisma.rileyActivity.createMany({
    data: [
      {
        action: "discovered_artist",
        artistId: artist1.id,
        details: { source: "instagram", followers: 3500 },
        successful: true,
      },
      {
        action: "sent_message",
        artistId: artist1.id,
        details: { intent: "initial_outreach" },
        successful: true,
        aiProvider: "claude",
      },
      {
        action: "discovered_artist",
        artistId: artist2.id,
        details: { source: "tiktok", followers: 12000 },
        successful: true,
      },
      {
        action: "qualified_artist",
        artistId: artist2.id,
        details: { hasShows: true },
        successful: true,
      },
      {
        action: "booked_show",
        artistId: artist2.id,
        details: { venue: "The Blue Room", date: "2024-12-15" },
        successful: true,
      },
    ],
  });

  console.log("✅ Created Riley activity log");

  console.log("\n🎉 Demo data seeded successfully!");
  console.log("\nDemo artists created:");
  console.log("1. Sarah Miller (Indie Folk) - CONTACTED");
  console.log("2. Marcus Chen (Hip Hop) - QUALIFIED with upcoming show");
  console.log("3. Luna Star (Electronic Pop) - ACTIVATED with first wins");
  console.log("\nGo to http://localhost:3000/admin to see them!");
}

main()
  .catch((e) => {
    console.error("Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
