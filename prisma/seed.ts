import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.sponsorMessage.deleteMany();
  await prisma.sponsorConversation.deleteMany();
  await prisma.sponsorCall.deleteMany();
  await prisma.sponsorship.deleteMany();
  await prisma.trackSubmission.deleteMany();
  await prisma.rileyActivity.deleteMany();
  await prisma.harperActivity.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.sponsor.deleteMany();

  // Create demo artists
  console.log("Creating demo artists...");
  const artists = await Promise.all([
    prisma.artist.create({
      data: {
        name: "Jordan Rivers",
        email: "jordan@example.com",
        phone: "+15551234567",
        genre: "Hip Hop",
        status: "ACTIVE",
        discoverySource: "instagram",
        sourceHandle: "@jordanrivers",
        pipelineStage: "activated",
        lastContactedAt: new Date("2024-03-01"),
        conversationCount: 3,
        airplayTier: "TIER_5",
        airplayActivatedAt: new Date("2024-02-01"),
        airplayShares: 5,
      },
    }),
    prisma.artist.create({
      data: {
        name: "Maya Chen",
        email: "maya@example.com",
        phone: "+15551234568",
        genre: "R&B",
        status: "ONBOARDING",
        discoverySource: "tiktok",
        sourceHandle: "@mayachen",
        pipelineStage: "qualified",
        lastContactedAt: new Date("2024-02-28"),
        conversationCount: 2,
        airplayTier: "FREE",
        airplayShares: 1,
      },
    }),
    prisma.artist.create({
      data: {
        name: "Alex Thompson",
        email: "alex@example.com",
        phone: "+15551234569",
        genre: "Electronic",
        status: "ACTIVE",
        discoverySource: "spotify",
        sourceHandle: "alex_thompson",
        pipelineStage: "activated",
        lastContactedAt: new Date("2024-03-02"),
        conversationCount: 5,
        airplayTier: "TIER_20",
        airplayActivatedAt: new Date("2024-01-15"),
        airplayShares: 25,
      },
    }),
    prisma.artist.create({
      data: {
        name: "Sam Parker",
        email: "sam@example.com",
        phone: "+15551234570",
        genre: "Rock",
        status: "QUALIFIED",
        discoverySource: "manual",
        pipelineStage: "contacted",
        lastContactedAt: new Date("2024-02-25"),
        conversationCount: 1,
        airplayTier: "FREE",
        airplayShares: 1,
      },
    }),
    prisma.artist.create({
      data: {
        name: "Riley Martinez",
        email: "rileyartist@example.com",
        phone: "+15551234571",
        genre: "Pop",
        status: "CONTACTED",
        discoverySource: "instagram",
        sourceHandle: "@rileymart",
        pipelineStage: "engaged",
        lastContactedAt: new Date("2024-02-27"),
        conversationCount: 2,
        airplayTier: "FREE",
        airplayShares: 1,
      },
    }),
    prisma.artist.create({
      data: {
        name: "Taylor Kim",
        email: "taylor@example.com",
        phone: "+15551234572",
        genre: "Indie",
        status: "DISCOVERED",
        discoverySource: "manual",
        pipelineStage: "discovery",
        airplayTier: "FREE",
        airplayShares: 1,
      },
    }),
  ]);

  // Create demo sponsors
  console.log("Creating demo sponsors...");
  const sponsors = await Promise.all([
    prisma.sponsor.create({
      data: {
        businessName: "Joe's Coffee Shop",
        contactName: "Joe Smith",
        email: "joe@joescoffee.com",
        phone: "+15559876543",
        businessType: "restaurant",
        status: "ACTIVE",
        discoverySource: "local_directory",
        pipelineStage: "active",
        lastContactedAt: new Date("2024-03-01"),
        sponsorshipTier: "bronze",
        monthlyAmount: 150,
        contractStart: new Date("2024-02-01"),
        contractEnd: new Date("2024-08-01"),
        city: "Austin",
        state: "TX",
        emailsSent: 5,
        textsSent: 3,
        callsCompleted: 2,
      },
    }),
    prisma.sponsor.create({
      data: {
        businessName: "TechStart Inc",
        contactName: "Sarah Johnson",
        email: "sarah@techstart.com",
        phone: "+15559876544",
        businessType: "technology",
        status: "ACTIVE",
        discoverySource: "linkedin",
        pipelineStage: "active",
        lastContactedAt: new Date("2024-03-02"),
        sponsorshipTier: "silver",
        monthlyAmount: 300,
        contractStart: new Date("2024-01-15"),
        contractEnd: new Date("2024-07-15"),
        city: "San Francisco",
        state: "CA",
        emailsSent: 8,
        callsCompleted: 3,
      },
    }),
    prisma.sponsor.create({
      data: {
        businessName: "Downtown Fitness Center",
        contactName: "Mike Brown",
        email: "mike@downtownfitness.com",
        phone: "+15559876545",
        businessType: "fitness",
        status: "INTERESTED",
        discoverySource: "local_directory",
        pipelineStage: "interested",
        lastContactedAt: new Date("2024-02-28"),
        sponsorshipTier: "bronze",
        city: "Austin",
        state: "TX",
        emailsSent: 3,
        textsSent: 2,
        callsCompleted: 1,
      },
    }),
    prisma.sponsor.create({
      data: {
        businessName: "Green Valley Dental",
        contactName: "Dr. Emily White",
        email: "emily@greenvalleydental.com",
        phone: "+15559876546",
        businessType: "healthcare",
        status: "CONTACTED",
        discoverySource: "google_maps",
        pipelineStage: "contacted",
        lastContactedAt: new Date("2024-02-26"),
        city: "Austin",
        state: "TX",
        emailsSent: 2,
      },
    }),
    prisma.sponsor.create({
      data: {
        businessName: "City Auto Group",
        contactName: "Tom Davis",
        email: "tom@cityauto.com",
        phone: "+15559876547",
        businessType: "automotive",
        status: "DISCOVERED",
        discoverySource: "local_directory",
        pipelineStage: "discovery",
        city: "Austin",
        state: "TX",
      },
    }),
  ]);

  // Create sponsor contracts (Sponsorship model)
  console.log("Creating sponsor contracts...");
  await Promise.all([
    prisma.sponsorship.create({
      data: {
        sponsorId: sponsors[0].id,
        tier: "bronze",
        monthlyAmount: 150,
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-08-01"),
        status: "active",
        adSpotsPerMonth: 90,
      },
    }),
    prisma.sponsorship.create({
      data: {
        sponsorId: sponsors[1].id,
        tier: "silver",
        monthlyAmount: 300,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-07-15"),
        status: "active",
        adSpotsPerMonth: 150,
        socialMentions: 4,
      },
    }),
  ]);

  // Create conversations and messages with Riley
  console.log("Creating conversations and messages...");
  const conversation1 = await prisma.conversation.create({
    data: {
      artistId: artists[0].id,
      channel: "email",
      isActive: true,
    },
  });

  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversation1.id,
        role: "riley",
        content: `Hey Jordan! I'm Riley from TrueFans RADIO. I've been checking out your music and I'm really impressed with your Hip Hop sound. We're always looking for talented artists like you to feature on our station. Would you be interested in learning more about how you can get your tracks on air?`,
        intent: "outreach",
        wasRead: true,
        sentiment: "positive",
        deliveryStatus: "delivered",
        deliveredAt: new Date("2024-01-15T10:00:00"),
        aiProvider: "claude",
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation1.id,
        role: "artist",
        content: "Hey Riley! Yeah, I'd definitely be interested! How does it work?",
        wasRead: true,
        sentiment: "positive",
        deliveryStatus: "delivered",
        deliveredAt: new Date("2024-01-15T14:30:00"),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation1.id,
        role: "riley",
        content: "Awesome! It's pretty simple. You can submit your tracks through our platform, and our team will review them. If they're a good fit, we'll add them to our rotation. The more tracks you submit, the more airtime you get. Plus, we have different tiers with benefits like priority placement and detailed analytics. Want me to send you the link to get started?",
        intent: "educate",
        wasRead: true,
        sentiment: "positive",
        deliveryStatus: "delivered",
        deliveredAt: new Date("2024-01-15T15:00:00"),
        aiProvider: "claude",
      },
    }),
  ]);

  const conversation2 = await prisma.conversation.create({
    data: {
      artistId: artists[1].id,
      channel: "sms",
      isActive: true,
    },
  });

  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversation2.id,
        role: "riley",
        content: `Hi Maya! I discovered your R&B music on TikTok and I'm blown away! Your voice is incredible. I'm Riley from TrueFans RADIO - we play independent artists like you. Would you like to get your music on the radio?`,
        intent: "outreach",
        wasRead: true,
        sentiment: "positive",
        deliveryStatus: "delivered",
        deliveredAt: new Date("2024-02-10T11:00:00"),
        aiProvider: "claude",
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation2.id,
        role: "artist",
        content: "Wow, thank you! Yes, that sounds amazing! Tell me more!",
        wasRead: true,
        sentiment: "positive",
        deliveryStatus: "delivered",
        deliveredAt: new Date("2024-02-10T11:30:00"),
      },
    }),
  ]);

  // Create track submissions
  console.log("Creating track submissions...");
  await Promise.all([
    prisma.trackSubmission.create({
      data: {
        artistId: artists[0].id,
        trackTitle: "City Lights",
        trackUrl: "https://example.com/tracks/city-lights.mp3",
        genre: "Hip Hop",
        duration: 210,
        status: "approved",
        reviewedBy: "Admin",
        reviewedAt: new Date("2024-02-16"),
        addedToRotation: true,
        playCount: 45,
      },
    }),
    prisma.trackSubmission.create({
      data: {
        artistId: artists[0].id,
        trackTitle: "Dreams",
        trackUrl: "https://example.com/tracks/dreams.mp3",
        genre: "Hip Hop",
        duration: 195,
        status: "approved",
        reviewedBy: "Admin",
        reviewedAt: new Date("2024-02-21"),
        addedToRotation: true,
        playCount: 32,
      },
    }),
    prisma.trackSubmission.create({
      data: {
        artistId: artists[2].id,
        trackTitle: "Electric Sunset",
        trackUrl: "https://example.com/tracks/electric-sunset.mp3",
        genre: "Electronic",
        duration: 240,
        status: "approved",
        reviewedBy: "Admin",
        reviewedAt: new Date("2024-02-26"),
        addedToRotation: true,
        playCount: 67,
      },
    }),
    prisma.trackSubmission.create({
      data: {
        artistId: artists[1].id,
        trackTitle: "Midnight Vibes",
        trackUrl: "https://example.com/tracks/midnight-vibes.mp3",
        genre: "R&B",
        duration: 225,
        status: "pending",
      },
    }),
  ]);

  // Create Riley activity logs
  console.log("Creating Riley activity logs...");
  await Promise.all([
    prisma.rileyActivity.create({
      data: {
        action: "discovered_artist",
        artistId: artists[0].id,
        details: { source: "instagram", genre: "Hip Hop" },
        aiProvider: "claude",
        successful: true,
      },
    }),
    prisma.rileyActivity.create({
      data: {
        action: "sent_message",
        artistId: artists[0].id,
        details: { channel: "email", intent: "outreach" },
        aiProvider: "claude",
        successful: true,
      },
    }),
    prisma.rileyActivity.create({
      data: {
        action: "discovered_artist",
        artistId: artists[1].id,
        details: { source: "tiktok", genre: "R&B" },
        aiProvider: "claude",
        successful: true,
      },
    }),
  ]);

  // Create Harper activity logs
  console.log("Creating Harper activity logs...");
  await Promise.all([
    prisma.harperActivity.create({
      data: {
        action: "discovered_sponsor",
        sponsorId: sponsors[0].id,
        details: { businessType: "restaurant", tier: "bronze" },
        aiProvider: "claude",
        successful: true,
      },
    }),
    prisma.harperActivity.create({
      data: {
        action: "closed_deal",
        sponsorId: sponsors[0].id,
        details: { tier: "bronze", monthlyAmount: 150 },
        aiProvider: "claude",
        successful: true,
      },
    }),
    prisma.harperActivity.create({
      data: {
        action: "closed_deal",
        sponsorId: sponsors[1].id,
        details: { tier: "silver", monthlyAmount: 300 },
        aiProvider: "claude",
        successful: true,
      },
    }),
  ]);

  console.log("✅ Database seeded successfully!");
  console.log(`Created ${artists.length} artists`);
  console.log(`Created ${sponsors.length} sponsors`);
  console.log("Created conversations, messages, and track submissions");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
