/**
 * Comprehensive seed script for ALL teams
 * Run with: npx tsx scripts/seed-all-teams.ts
 *
 * Seeds realistic data for every model so all dashboards render real data.
 * Idempotent: clears all tables before re-seeding.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function randomDate(daysBack: number, daysForward = 0): Date {
  const now = Date.now();
  const start = now - daysBack * 86400000;
  const end = now + daysForward * 86400000;
  return new Date(start + Math.random() * (end - start));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function period(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const genres = [
  "Americana", "Country", "Singer-Songwriter", "Folk", "Blues",
  "Alt-Country", "Bluegrass", "Indie Folk", "Texas Country", "Red Dirt",
  "Outlaw Country", "Western Swing", "Roots Rock", "Southern Rock", "Country Rock",
];

const sources = ["instagram", "tiktok", "spotify", "manual", "venue", "referral"];
const cities = [
  "Austin, TX", "Nashville, TN", "Portland, OR", "Denver, CO", "Seattle, WA",
  "Tulsa, OK", "Asheville, NC", "Athens, GA", "Bozeman, MT", "Fort Worth, TX",
];
const venues = [
  "The Blue Room", "Electric Garden", "Cactus Cafe", "The Continental Club",
  "Station Inn", "Bluebird Cafe", "Gruene Hall", "Billy Bob's Texas",
];

async function clearAll() {
  console.log("Clearing all tables...");
  // Delete in dependency order (children first)
  await prisma.$transaction([
    prisma.sponsorReferralChain.deleteMany(),
    prisma.sponsorCommission.deleteMany(),
    prisma.sponsorArtistDevelopment.deleteMany(),
    prisma.sponsorBulkPurchase.deleteMany(),
    prisma.sponsorListenerReferral.deleteMany(),
    prisma.sponsorGrowthPartner.deleteMany(),
    prisma.listenerPlayback.deleteMany(),
    prisma.airplayPrepurchase.deleteMany(),
    prisma.scoutCommission.deleteMany(),
    prisma.listenerReferral.deleteMany(),
    prisma.artistDiscovery.deleteMany(),
    prisma.scout.deleteMany(),
    prisma.campaignResponse.deleteMany(),
    prisma.listenerEngagement.deleteMany(),
    prisma.listeningSession.deleteMany(),
    prisma.growthCampaign.deleteMany(),
    prisma.viralContent.deleteMany(),
    prisma.elliotActivity.deleteMany(),
    prisma.listener.deleteMany(),
    prisma.cassidyActivity.deleteMany(),
    prisma.rotationSlot.deleteMany(),
    prisma.panelMeeting.deleteMany(),
    prisma.progressionRequest.deleteMany(),
    prisma.tierPlacement.deleteMany(),
    prisma.submissionReview.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.judge.deleteMany(),
    prisma.programmingBlock.deleteMany(),
    prisma.trackPlayback.deleteMany(),
    prisma.dJShow.deleteMany(),
    prisma.dJ.deleteMany(),
    prisma.station.deleteMany(),
    prisma.harperActivity.deleteMany(),
    prisma.trackSubmission.deleteMany(),
    prisma.sponsorship.deleteMany(),
    prisma.sponsorMessage.deleteMany(),
    prisma.sponsorConversation.deleteMany(),
    prisma.sponsorCall.deleteMany(),
    prisma.sponsor.deleteMany(),
    prisma.radioEarnings.deleteMany(),
    prisma.radioRevenuePool.deleteMany(),
    prisma.airplayPayment.deleteMany(),
    prisma.rileyActivity.deleteMany(),
    prisma.donation.deleteMany(),
    prisma.show.deleteMany(),
    prisma.referral.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.artist.deleteMany(),
    prisma.config.deleteMany(),
  ]);
  console.log("All tables cleared.");
}

// ============ ARTISTS (34) ============
async function seedArtists() {
  console.log("Seeding artists...");
  const artistData = [
    // 18 FREE
    { name: "Sarah Miller", email: "sarah@example.com", phone: "+1-555-0101", genre: "Indie Folk", source: "instagram", handle: "@sarahmillermusic", followers: 3500, engagement: 4.2, status: "CONTACTED" as const, stage: "contacted", tier: "FREE" as const, shows: true },
    { name: "Tommy Graves", email: "tommy@example.com", phone: "+1-555-0102", genre: "Outlaw Country", source: "tiktok", handle: "@tommygraves", followers: 2100, engagement: 3.8, status: "DISCOVERED" as const, stage: "discovery", tier: "FREE" as const, shows: true },
    { name: "Lily Mae", email: "lilymae@example.com", phone: "+1-555-0103", genre: "Bluegrass", source: "spotify", handle: "lilymaebluegrass", followers: 4800, engagement: 5.1, status: "ENGAGED" as const, stage: "engaged", tier: "FREE" as const, shows: true },
    { name: "Dusty Rhodes", email: "dusty@example.com", phone: "+1-555-0104", genre: "Texas Country", source: "venue", handle: null, followers: 1200, engagement: 2.5, status: "DISCOVERED" as const, stage: "discovery", tier: "FREE" as const, shows: true },
    { name: "Willow Creek", email: "willow@example.com", phone: "+1-555-0105", genre: "Folk", source: "instagram", handle: "@willowcreekmusic", followers: 6200, engagement: 4.9, status: "QUALIFIED" as const, stage: "qualified", tier: "FREE" as const, shows: true },
    { name: "Hank Dawson", email: "hank.d@example.com", phone: "+1-555-0106", genre: "Country", source: "manual", handle: null, followers: 800, engagement: 3.2, status: "CONTACTED" as const, stage: "contacted", tier: "FREE" as const, shows: false },
    { name: "June Carter Jr.", email: "june@example.com", phone: "+1-555-0107", genre: "Americana", source: "referral", handle: null, followers: 3200, engagement: 4.0, status: "DISCOVERED" as const, stage: "discovery", tier: "FREE" as const, shows: true },
    { name: "River Stone", email: "river.s@example.com", phone: "+1-555-0108", genre: "Singer-Songwriter", source: "instagram", handle: "@riverstone", followers: 7500, engagement: 5.5, status: "ONBOARDING" as const, stage: "onboarding", tier: "FREE" as const, shows: true },
    { name: "Colt Winchester", email: "colt@example.com", phone: "+1-555-0109", genre: "Red Dirt", source: "tiktok", handle: "@coltwmusic", followers: 15000, engagement: 6.1, status: "ACTIVATED" as const, stage: "activated", tier: "FREE" as const, shows: true },
    { name: "Daisy Chain", email: "daisy@example.com", phone: "+1-555-0110", genre: "Folk", source: "spotify", handle: "daisychainmusic", followers: 2800, engagement: 3.6, status: "ENGAGED" as const, stage: "engaged", tier: "FREE" as const, shows: false },
    { name: "Clyde Barrow", email: "clyde.b@example.com", phone: "+1-555-0111", genre: "Blues", source: "venue", handle: null, followers: 900, engagement: 2.8, status: "DISCOVERED" as const, stage: "discovery", tier: "FREE" as const, shows: true },
    { name: "Pearl Jackson", email: "pearl@example.com", phone: "+1-555-0112", genre: "Southern Rock", source: "instagram", handle: "@pearljacksonband", followers: 5100, engagement: 4.5, status: "CONTACTED" as const, stage: "contacted", tier: "FREE" as const, shows: true },
    { name: "Sage Wilson", email: "sage.w@example.com", phone: "+1-555-0113", genre: "Alt-Country", source: "tiktok", handle: "@sagewilsonmusic", followers: 11000, engagement: 5.8, status: "QUALIFIED" as const, stage: "qualified", tier: "FREE" as const, shows: true },
    { name: "Bo Diddley Jr.", email: "bo@example.com", phone: "+1-555-0114", genre: "Roots Rock", source: "manual", handle: null, followers: 400, engagement: 1.9, status: "UNRESPONSIVE" as const, stage: "contacted", tier: "FREE" as const, shows: false },
    { name: "Magnolia Rose", email: "magnolia@example.com", phone: "+1-555-0115", genre: "Country Rock", source: "instagram", handle: "@magnoliarosemusic", followers: 8200, engagement: 5.3, status: "ONBOARDING" as const, stage: "onboarding", tier: "FREE" as const, shows: true },
    { name: "Ash Timber", email: "ash.t@example.com", phone: "+1-555-0116", genre: "Americana", source: "referral", handle: null, followers: 3800, engagement: 4.1, status: "ACTIVATED" as const, stage: "activated", tier: "FREE" as const, shows: true },
    { name: "Dakota Sundown", email: "dakota.s@example.com", phone: "+1-555-0117", genre: "Western Swing", source: "spotify", handle: "dakotasundown", followers: 2200, engagement: 3.4, status: "DORMANT" as const, stage: "activated", tier: "FREE" as const, shows: true },
    { name: "Ember Skye", email: "ember@example.com", phone: "+1-555-0118", genre: "Singer-Songwriter", source: "tiktok", handle: "@emberskye", followers: 9400, engagement: 6.0, status: "ENGAGED" as const, stage: "engaged", tier: "FREE" as const, shows: true },
    // 8 BRONZE (TIER_5)
    { name: "Marcus Chen", email: "marcus@example.com", phone: "+1-555-0201", genre: "Hip Hop", source: "tiktok", handle: "@marcusbeats", followers: 12000, engagement: 6.8, status: "ACTIVE" as const, stage: "activated", tier: "TIER_5" as const, shows: true },
    { name: "Luna Star", email: "luna@example.com", phone: "+1-555-0202", genre: "Electronic Pop", source: "spotify", handle: "lunastarmusic", followers: 8500, engagement: 5.1, status: "ACTIVATED" as const, stage: "activated", tier: "TIER_5" as const, shows: true },
    { name: "Wyatt Earp III", email: "wyatt@example.com", phone: "+1-555-0203", genre: "Country", source: "venue", handle: null, followers: 5600, engagement: 4.4, status: "ACTIVE" as const, stage: "activated", tier: "TIER_5" as const, shows: true },
    { name: "Rosie Thorn", email: "rosie@example.com", phone: "+1-555-0204", genre: "Indie Folk", source: "instagram", handle: "@rosiethornmusic", followers: 7200, engagement: 5.7, status: "ACTIVE" as const, stage: "activated", tier: "TIER_5" as const, shows: true },
    { name: "Beau Jennings", email: "beau@example.com", phone: "+1-555-0205", genre: "Red Dirt", source: "tiktok", handle: "@beaujennings", followers: 18000, engagement: 7.2, status: "ACTIVE" as const, stage: "activated", tier: "TIER_5" as const, shows: true },
    { name: "Wren Harper", email: "wren@example.com", phone: "+1-555-0206", genre: "Bluegrass", source: "manual", handle: null, followers: 4100, engagement: 3.9, status: "ACTIVE" as const, stage: "activated", tier: "TIER_5" as const, shows: true },
    { name: "Clay Morrison", email: "clay@example.com", phone: "+1-555-0207", genre: "Americana", source: "referral", handle: null, followers: 6800, engagement: 5.0, status: "ACTIVE" as const, stage: "activated", tier: "TIER_5" as const, shows: true },
    { name: "Ivory Keys", email: "ivory@example.com", phone: "+1-555-0208", genre: "Blues", source: "spotify", handle: "ivorykeysblues", followers: 3300, engagement: 4.3, status: "ACTIVATED" as const, stage: "activated", tier: "TIER_5" as const, shows: true },
    // 4 SILVER (TIER_20)
    { name: "Jake Rivers", email: "jake@example.com", phone: "+1-555-0301", genre: "Alt-Country", source: "instagram", handle: "@jakeriverscountry", followers: 22000, engagement: 7.5, status: "ACTIVE" as const, stage: "activated", tier: "TIER_20" as const, shows: true },
    { name: "Sierra Dawn", email: "sierra@example.com", phone: "+1-555-0302", genre: "Country", source: "tiktok", handle: "@sierradawnmusic", followers: 35000, engagement: 8.1, status: "ACTIVE" as const, stage: "activated", tier: "TIER_20" as const, shows: true },
    { name: "Flint Eastwood", email: "flint@example.com", phone: "+1-555-0303", genre: "Roots Rock", source: "venue", handle: null, followers: 15000, engagement: 6.5, status: "ACTIVE" as const, stage: "activated", tier: "TIER_20" as const, shows: true },
    { name: "Meadow Lark", email: "meadow@example.com", phone: "+1-555-0304", genre: "Folk", source: "spotify", handle: "meadowlarkfolk", followers: 19000, engagement: 7.0, status: "INNER_CIRCLE" as const, stage: "activated", tier: "TIER_20" as const, shows: true },
    // 3 GOLD (TIER_50)
    { name: "Canyon Ridge", email: "canyon@example.com", phone: "+1-555-0401", genre: "Americana", source: "instagram", handle: "@canyonridgeband", followers: 48000, engagement: 8.8, status: "ACTIVE" as const, stage: "activated", tier: "TIER_50" as const, shows: true },
    { name: "Stella North", email: "stella@example.com", phone: "+1-555-0402", genre: "Singer-Songwriter", source: "tiktok", handle: "@stellanorthmusic", followers: 62000, engagement: 9.1, status: "INNER_CIRCLE" as const, stage: "activated", tier: "TIER_50" as const, shows: true },
    { name: "Holt Ramsey", email: "holt@example.com", phone: "+1-555-0403", genre: "Texas Country", source: "venue", handle: null, followers: 41000, engagement: 8.5, status: "ACTIVE" as const, stage: "activated", tier: "TIER_50" as const, shows: true },
    // 1 PLATINUM (TIER_120)
    { name: "Phoenix Blaze", email: "phoenix@example.com", phone: "+1-555-0501", genre: "Country Rock", source: "instagram", handle: "@phoenixblazemusic", followers: 120000, engagement: 9.8, status: "INNER_CIRCLE" as const, stage: "activated", tier: "TIER_120" as const, shows: true },
  ];

  const artists: any[] = [];
  for (const a of artistData) {
    const artist = await prisma.artist.create({
      data: {
        name: a.name,
        email: a.email,
        phone: a.phone,
        genre: a.genre,
        discoverySource: a.source,
        sourceHandle: a.handle,
        sourceUrl: a.handle ? `https://${a.source}.com/${a.handle}` : undefined,
        followerCount: a.followers,
        engagementRate: a.engagement,
        status: a.status,
        pipelineStage: a.stage,
        hasLiveShows: a.shows,
        airplayTier: a.tier,
        airplayShares: a.tier === "FREE" ? 1 : a.tier === "TIER_5" ? 5 : a.tier === "TIER_20" ? 25 : a.tier === "TIER_50" ? 75 : 200,
        airplayActivatedAt: a.tier !== "FREE" ? randomDate(90) : undefined,
        lastTierUpgrade: a.tier !== "FREE" ? randomDate(60) : undefined,
        lastContactedAt: a.status !== "DISCOVERED" ? randomDate(30) : undefined,
        nextFollowUpAt: ["CONTACTED", "ENGAGED", "QUALIFIED", "ONBOARDING"].includes(a.status) ? randomDate(0, 14) : undefined,
        hasUsedNineWord: ["ACTIVATED", "ACTIVE", "INNER_CIRCLE"].includes(a.status),
        firstWinDate: ["ACTIVATED", "ACTIVE", "INNER_CIRCLE"].includes(a.status) ? randomDate(120) : undefined,
      },
    });
    artists.push(artist);
  }
  console.log(`  Created ${artists.length} artists`);
  return artists;
}

// ============ CONVERSATIONS & MESSAGES (for Riley) ============
async function seedConversations(artists: any[]) {
  console.log("Seeding conversations & messages...");
  const conversationArtists = artists.filter(a => a.status !== "DISCOVERED").slice(0, 12);
  const channels = ["sms", "instagram", "email"];
  const intents = ["initial_outreach", "qualify_live_shows", "educate_product", "book_show", "follow_up", "celebrate_win"];

  for (const artist of conversationArtists) {
    const channel = pick(channels);
    const msgCount = randomInt(2, 6);
    const messages: any[] = [];
    for (let i = 0; i < msgCount; i++) {
      messages.push({
        role: i % 2 === 0 ? "riley" : "artist",
        content: i % 2 === 0
          ? pick([
              `Hey ${artist.name.split(" ")[0]}! Saw your stuff on ${artist.discoverySource} — love your sound. Do you play live?`,
              `Quick follow-up — wanted to see if you'd be interested in getting your music on the radio. It's insanely simple.`,
              `Great news! Your track is in rotation. Just say the 9 words at your next show and you're golden.`,
              `Checking in — how did the show go? Any donations come through?`,
            ])
          : pick([
              "Yeah I play shows regularly!",
              "That sounds interesting, tell me more",
              "I'm definitely interested. What do I need to do?",
              "The show went great! Got some donations too!",
            ]),
        intent: i % 2 === 0 ? pick(intents) : undefined,
        aiProvider: i % 2 === 0 ? "claude" : undefined,
        wasRead: true,
        sentiment: "positive",
      });
    }

    await prisma.conversation.create({
      data: {
        artistId: artist.id,
        channel,
        isActive: true,
        messages: { create: messages },
      },
    });
  }
  console.log(`  Created ${conversationArtists.length} conversations with messages`);
}

// ============ SHOWS & DONATIONS ============
async function seedShows(artists: any[]) {
  console.log("Seeding shows & donations...");
  const showArtists = artists.filter(a => ["ACTIVATED", "ACTIVE", "INNER_CIRCLE"].includes(a.status)).slice(0, 8);
  let showCount = 0;
  let donationCount = 0;

  for (const artist of showArtists) {
    const numShows = randomInt(1, 3);
    for (let s = 0; s < numShows; s++) {
      const totalRaised = randomFloat(25, 250);
      const dCount = randomInt(3, 8);
      const show = await prisma.show.create({
        data: {
          artistId: artist.id,
          date: randomDate(60),
          venue: pick(venues),
          city: pick(cities),
          status: pick(["COMPLETED", "COMPLETED", "SCHEDULED"]) as any,
          usedNineWord: Math.random() > 0.2,
          donationCount: dCount,
          totalRaised,
        },
      });
      showCount++;

      const donations: any[] = [];
      for (let d = 0; d < dCount; d++) {
        donations.push({
          artistId: artist.id,
          showId: show.id,
          amount: randomFloat(5, 50),
          fanName: pick(["Alex R.", "Jamie L.", "Taylor M.", "Jordan K.", "Casey D.", "Morgan P.", "Riley F.", "Drew S."]),
          isFirstWin: d === 0 && s === 0,
        });
      }
      await prisma.donation.createMany({ data: donations });
      donationCount += dCount;
    }
  }
  console.log(`  Created ${showCount} shows and ${donationCount} donations`);
}

// ============ SPONSORS (18) ============
async function seedSponsors() {
  console.log("Seeding sponsors...");
  const sponsorData = [
    { biz: "Hill Country Guitars", contact: "Mike Hill", type: "music_shop", status: "ACTIVE" as const, stage: "active", tier: "gold", amount: 500 },
    { biz: "Lone Star Brewing Co.", contact: "Sarah Lone", type: "brewery", status: "ACTIVE" as const, stage: "active", tier: "platinum", amount: 1000 },
    { biz: "Austin Sound Studio", contact: "Dave Austin", type: "studio", status: "ACTIVE" as const, stage: "active", tier: "silver", amount: 250 },
    { biz: "Cactus Jack's BBQ", contact: "Jack Martinez", type: "restaurant", status: "ACTIVE" as const, stage: "active", tier: "bronze", amount: 100 },
    { biz: "Red River Music Festival", contact: "Amy River", type: "venue", status: "CLOSED" as const, stage: "closed", tier: "gold", amount: 500 },
    { biz: "Sundance Western Wear", contact: "Tom Sundance", type: "retail", status: "NEGOTIATING" as const, stage: "negotiating", tier: null, amount: null },
    { biz: "Pecos Valley Records", contact: "Linda Pecos", type: "label", status: "INTERESTED" as const, stage: "interested", tier: null, amount: null },
    { biz: "Mesa Verde Coffee", contact: "Carlos Mesa", type: "restaurant", status: "CONTACTED" as const, stage: "contacted", tier: null, amount: null },
    { biz: "Bluebell Bakery", contact: "Emma Blue", type: "restaurant", status: "DISCOVERED" as const, stage: "discovery", tier: null, amount: null },
    { biz: "Rattlesnake Records", contact: "Vince Rattle", type: "label", status: "ACTIVE" as const, stage: "active", tier: "silver", amount: 250 },
    { biz: "Tumbleweeds Bar & Grill", contact: "Greg Tumble", type: "venue", status: "ACTIVE" as const, stage: "active", tier: "bronze", amount: 100 },
    { biz: "Prairie Dog Print Shop", contact: "Nancy Prairie", type: "retail", status: "CONTACTED" as const, stage: "contacted", tier: null, amount: null },
    { biz: "Maverick Auto Group", contact: "Bill Maverick", type: "auto", status: "NEGOTIATING" as const, stage: "negotiating", tier: null, amount: null },
    { biz: "Canyon Creek Winery", contact: "Rose Canyon", type: "winery", status: "INTERESTED" as const, stage: "interested", tier: null, amount: null },
    { biz: "High Plains Hardware", contact: "Frank Plains", type: "retail", status: "DISCOVERED" as const, stage: "discovery", tier: null, amount: null },
    { biz: "Starlight Drive-In", contact: "Jenny Star", type: "entertainment", status: "CHURNED" as const, stage: "active", tier: "bronze", amount: 100 },
    { biz: "Wildflower Farms", contact: "Beth Wild", type: "agriculture", status: "UNRESPONSIVE" as const, stage: "contacted", tier: null, amount: null },
    { biz: "Thunder Road Motors", contact: "Ray Thunder", type: "auto", status: "ACTIVE" as const, stage: "active", tier: "gold", amount: 500 },
  ];

  const sponsors: any[] = [];
  for (const s of sponsorData) {
    const sponsor = await prisma.sponsor.create({
      data: {
        businessName: s.biz,
        contactName: s.contact,
        email: `${s.contact.split(" ")[0].toLowerCase()}@${s.biz.toLowerCase().replace(/[^a-z]/g, "")}.com`,
        phone: `+1-555-1${String(sponsors.length).padStart(3, "0")}`,
        businessType: s.type,
        discoverySource: pick(["google", "referral", "event", "cold_outreach", "linkedin"]),
        city: pick(cities).split(",")[0],
        state: pick(cities).split(",")[1]?.trim(),
        status: s.status,
        pipelineStage: s.stage,
        sponsorshipTier: s.tier,
        monthlyAmount: s.amount,
        lastContactedAt: s.status !== "DISCOVERED" ? randomDate(14) : undefined,
        nextFollowUpAt: ["CONTACTED", "INTERESTED", "NEGOTIATING"].includes(s.status) ? randomDate(0, 7) : undefined,
        contractStart: s.status === "ACTIVE" ? randomDate(180) : undefined,
        contractEnd: s.status === "ACTIVE" ? randomDate(0, 180) : undefined,
        emailsSent: randomInt(0, 12),
        textsSent: randomInt(0, 6),
        callsCompleted: randomInt(0, 5),
      },
    });
    sponsors.push(sponsor);
  }
  console.log(`  Created ${sponsors.length} sponsors`);
  return sponsors;
}

// ============ SPONSOR CONVERSATIONS, CALLS, SPONSORSHIPS ============
async function seedSponsorRelations(sponsors: any[]) {
  console.log("Seeding sponsor conversations, calls, sponsorships...");
  const activeSponsors = sponsors.filter(s => ["ACTIVE", "CLOSED", "NEGOTIATING", "INTERESTED"].includes(s.status));

  // Conversations
  for (const sponsor of activeSponsors.slice(0, 8)) {
    await prisma.sponsorConversation.create({
      data: {
        sponsorId: sponsor.id,
        channel: pick(["email", "sms", "voice_ai"]),
        isActive: true,
        messages: {
          create: [
            { role: "harper", content: `Hi ${sponsor.contactName?.split(" ")[0] || "there"}, I'd love to talk about getting ${sponsor.businessName} in front of our listeners.`, intent: "outreach", aiProvider: "claude" },
            { role: "sponsor", content: "That sounds interesting. What kind of reach are we talking about?", sentiment: "positive" },
            { role: "harper", content: "We're reaching 1,250+ daily active listeners across Texas and surrounding states. Our sponsors see real ROI.", intent: "pitch", aiProvider: "claude" },
          ],
        },
      },
    });
  }

  // Calls
  const callOutcomes = ["interested", "callback", "closed", "not_interested"];
  for (const sponsor of activeSponsors) {
    const numCalls = randomInt(1, 3);
    for (let c = 0; c < numCalls; c++) {
      await prisma.sponsorCall.create({
        data: {
          sponsorId: sponsor.id,
          callType: pick(["voice_ai", "human"]),
          duration: randomInt(60, 900),
          outcome: pick(callOutcomes),
          handledBy: pick(["harper_ai", "Harper Wilson"]),
          createdAt: randomDate(30),
        },
      });
    }
  }

  // Sponsorships for active sponsors
  const activeSps = sponsors.filter(s => s.status === "ACTIVE");
  for (const sponsor of activeSps) {
    await prisma.sponsorship.create({
      data: {
        sponsorId: sponsor.id,
        tier: sponsor.sponsorshipTier || "bronze",
        monthlyAmount: sponsor.monthlyAmount || 100,
        startDate: sponsor.contractStart || randomDate(180),
        endDate: sponsor.contractEnd || randomDate(0, 180),
        status: "active",
        adSpotsPerMonth: sponsor.sponsorshipTier === "platinum" ? 120 : sponsor.sponsorshipTier === "gold" ? 60 : sponsor.sponsorshipTier === "silver" ? 30 : 15,
        socialMentions: randomInt(2, 10),
        eventPromotion: Math.random() > 0.5,
      },
    });
  }
  console.log("  Created sponsor conversations, calls, and sponsorships");
}

// ============ JUDGES (6) ============
async function seedJudges() {
  console.log("Seeding judges...");
  const judgeData = [
    { name: "Cassidy Monroe", role: "Music Director & Panel Chair", expertise: "Overall curation and rotation strategy", bio: "20+ years in radio programming. Cassidy sets the creative direction for all rotation decisions." },
    { name: "Dakota Wells", role: "Production Engineer", expertise: "Technical assessment and production quality", bio: "Award-winning producer and audio engineer. Evaluates recording quality, mixing, and mastering." },
    { name: "Maya Reeves", role: "Programming Director", expertise: "Commercial viability and programming fit", bio: "Former major label A&R rep. Focuses on listener appeal and commercial potential." },
    { name: "Jesse Coleman", role: "Performance Specialist", expertise: "Live performance and artistic merit", bio: "Touring musician and vocal coach. Assesses performance quality and stage readiness." },
    { name: "Dr. Sam Chen", role: "Musicologist", expertise: "Cultural significance and musical analysis", bio: "PhD in Ethnomusicology. Evaluates artistic depth, genre authenticity, and cultural impact." },
    { name: "Whitley Cross", role: "Audience Analyst", expertise: "Audience engagement and growth potential", bio: "Data-driven audience researcher. Predicts listener response and growth trajectories." },
  ];

  const judges: any[] = [];
  for (const j of judgeData) {
    const judge = await prisma.judge.create({
      data: {
        name: j.name,
        role: j.role,
        expertiseArea: j.expertise,
        bio: j.bio,
        avgScoreAccuracy: randomFloat(0.75, 0.95),
        judgingConsistency: randomFloat(0.80, 0.95),
        totalSubmissionsJudged: randomInt(20, 120),
        isActive: true,
      },
    });
    judges.push(judge);
  }
  console.log(`  Created ${judges.length} judges`);
  return judges;
}

// ============ SUBMISSIONS & REVIEWS ============
async function seedSubmissions(artists: any[], judges: any[]) {
  console.log("Seeding submissions & reviews...");
  const tiers: ("BRONZE" | "SILVER" | "GOLD" | "PLATINUM")[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
  const statuses: ("PENDING" | "IN_REVIEW" | "JUDGED" | "PLACED" | "NOT_PLACED")[] = ["PENDING", "IN_REVIEW", "JUDGED", "PLACED", "NOT_PLACED"];

  // 18 submissions spread across statuses
  const submissionConfigs = [
    // 4 PENDING
    ...Array(4).fill(null).map(() => ({ status: "PENDING" as const, tier: null })),
    // 3 IN_REVIEW
    ...Array(3).fill(null).map(() => ({ status: "IN_REVIEW" as const, tier: null })),
    // 3 JUDGED
    ...Array(3).fill(null).map(() => ({ status: "JUDGED" as const, tier: pick(tiers) })),
    // 6 PLACED
    { status: "PLACED" as const, tier: "BRONZE" as const },
    { status: "PLACED" as const, tier: "BRONZE" as const },
    { status: "PLACED" as const, tier: "SILVER" as const },
    { status: "PLACED" as const, tier: "SILVER" as const },
    { status: "PLACED" as const, tier: "GOLD" as const },
    { status: "PLACED" as const, tier: "PLATINUM" as const },
    // 2 NOT_PLACED
    ...Array(2).fill(null).map(() => ({ status: "NOT_PLACED" as const, tier: null })),
  ];

  const submissions: any[] = [];
  for (let i = 0; i < submissionConfigs.length; i++) {
    const config = submissionConfigs[i];
    const artist = artists[i % artists.length];
    const submission = await prisma.submission.create({
      data: {
        artistId: artist.id,
        artistName: artist.name,
        artistEmail: artist.email,
        trackTitle: pick(["Wildfire", "Long Road Home", "Desert Moon", "Fading Light", "Broken Strings", "Highway 10", "Sunset County", "Dusty Boots", "Open Range", "Whiskey Sunset", "Midnight Train", "Prairie Wind", "Thunder Ridge", "Silver Creek", "Canyon Song", "Lone Star Night", "Red River Blues", "Mountain Echo"]),
        trackFileUrl: `https://storage.example.com/tracks/track-${i + 1}.mp3`,
        trackDuration: randomInt(180, 300),
        genre: artist.genre || pick(genres),
        discoverySource: pick(["Newport Folk Festival", "Local Venue", "Social Media", "Referral", "Open Submission"]),
        discoveredBy: "Riley Team",
        status: config.status,
        tierAwarded: config.tier as any,
        judgingStartedAt: ["IN_REVIEW", "JUDGED", "PLACED", "NOT_PLACED"].includes(config.status) ? randomDate(30) : undefined,
        judgingCompletedAt: ["JUDGED", "PLACED", "NOT_PLACED"].includes(config.status) ? randomDate(14) : undefined,
        awardedAt: config.tier ? randomDate(14) : undefined,
        rotationSpinsWeekly: config.tier === "BRONZE" ? 5 : config.tier === "SILVER" ? 12 : config.tier === "GOLD" ? 22 : config.tier === "PLATINUM" ? 32 : undefined,
        decisionRationale: config.status === "PLACED" ? "Strong production quality and clear commercial appeal. Fits our rotation well." : config.status === "NOT_PLACED" ? "Needs more polish in production. Encourage resubmission after improvements." : undefined,
        createdAt: randomDate(45),
      },
    });
    submissions.push(submission);

    // Add reviews for judged/placed/not_placed submissions
    if (["JUDGED", "PLACED", "NOT_PLACED"].includes(config.status)) {
      for (const judge of judges) {
        await prisma.submissionReview.create({
          data: {
            submissionId: submission.id,
            judgeId: judge.id,
            overallScore: randomInt(55, 98),
            productionQuality: randomInt(50, 100),
            commercialViability: randomInt(45, 100),
            artisticMerit: randomInt(55, 100),
            performanceQuality: randomInt(50, 100),
            culturalSignificance: randomInt(40, 100),
            growthPotential: randomInt(50, 100),
            strengths: pick(["Strong vocal performance", "Excellent production", "Great songwriting", "Unique sound", "Compelling lyrics"]),
            growthAreas: pick(["Mix could be tighter", "Bridge section needs work", "Vocal dynamics", "Arrangement variety", "Genre authenticity"]),
            tierRecommendation: config.tier as any || pick(tiers),
          },
        });
      }
    }
  }
  console.log(`  Created ${submissions.length} submissions with reviews`);
  return submissions;
}

// ============ TIER PLACEMENTS ============
async function seedTierPlacements(submissions: any[]) {
  console.log("Seeding tier placements...");
  const placedSubs = submissions.filter(s => s.tierAwarded);
  for (const sub of placedSubs) {
    await prisma.tierPlacement.create({
      data: {
        submissionId: sub.id,
        artistId: sub.artistId,
        artistName: sub.artistName,
        newTier: sub.tierAwarded,
        reason: "Panel consensus after review",
        decidedBy: "Cassidy Monroe",
        isProgression: Math.random() > 0.7,
        changeDate: sub.awardedAt || new Date(),
      },
    });
  }
  console.log(`  Created ${placedSubs.length} tier placements`);
}

// ============ ROTATION SLOTS (60) ============
async function seedRotationSlots(artists: any[]) {
  console.log("Seeding rotation slots...");
  const dayparts = ["morning_drive", "midday", "afternoon_drive", "evening", "overnight", "weekend"];
  const activeArtists = artists.filter(a => ["ACTIVE", "INNER_CIRCLE", "ACTIVATED"].includes(a.status));
  const slots: any[] = [];

  for (let day = 0; day < 7; day++) {
    for (const daypart of dayparts) {
      const timeRanges: Record<string, [string, string]> = {
        morning_drive: ["06:00", "10:00"],
        midday: ["10:00", "14:00"],
        afternoon_drive: ["14:00", "18:00"],
        evening: ["18:00", "22:00"],
        overnight: ["22:00", "06:00"],
        weekend: ["10:00", "18:00"],
      };
      if (daypart === "weekend" && day < 5) continue; // Weekend slots only on Sat/Sun
      if (daypart !== "weekend" && day >= 5) continue; // Weekday slots only Mon-Fri

      const artist = activeArtists.length > 0 ? pick(activeArtists) : null;
      const isIndie = Math.random() > 0.2; // 80% indie target

      slots.push({
        daypart,
        dayOfWeek: day,
        timeStart: timeRanges[daypart][0],
        timeEnd: timeRanges[daypart][1],
        currentArtistId: artist?.id,
        currentArtistName: artist?.name,
        currentTier: artist ? pick(["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const) : undefined,
        indieVsMainstream: isIndie ? "indie" : "mainstream",
        avgEngagementScore: randomFloat(3.0, 9.5),
        skipRate: randomFloat(0.02, 0.15),
        mainstreamReplaced: isIndie,
        replacedAt: isIndie ? randomDate(90) : undefined,
        progressContribution: isIndie ? randomFloat(0.1, 2.0) : undefined,
      });
    }
  }

  await prisma.rotationSlot.createMany({ data: slots });
  console.log(`  Created ${slots.length} rotation slots`);
}

// ============ LISTENERS (60) ============
async function seedListeners() {
  console.log("Seeding listeners...");
  const listenerStatuses = ["NEW", "ACTIVE", "POWER_USER", "AT_RISK", "CHURNED", "REACTIVATED"] as const;
  const listenerTiers = ["CASUAL", "REGULAR", "SUPER_FAN", "EVANGELIST"] as const;
  const discoverySources = ["artist_referral", "social_media", "organic", "search", "ad"];
  const timeSlots = ["morning", "midday", "evening", "late_night"];
  const devices = ["web", "mobile", "smart_speaker"];

  const listeners: any[] = [];
  for (let i = 0; i < 60; i++) {
    const status = pick([...listenerStatuses]);
    const tier = pick([...listenerTiers]);
    const listener = await prisma.listener.create({
      data: {
        email: `listener${i + 1}@example.com`,
        name: pick(["Alex", "Jordan", "Casey", "Morgan", "Riley", "Quinn", "Avery", "Taylor", "Drew", "Blake"]) + " " + pick(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]),
        discoverySource: pick(discoverySources),
        totalSessions: randomInt(1, 200),
        totalListeningHours: randomFloat(0.5, 500),
        averageSessionLength: randomFloat(10, 120),
        lastListenedAt: status === "CHURNED" ? randomDate(60) : randomDate(7),
        favoriteTimeSlot: pick(timeSlots),
        engagementScore: randomInt(5, 100),
        status,
        tier,
        listeningStreak: status === "POWER_USER" ? randomInt(10, 60) : randomInt(0, 14),
        preferredDJ: pick(["hank", "june", "aj", "loretta", null]),
        notificationsEnabled: Math.random() > 0.4,
        communityMember: Math.random() > 0.5,
      },
    });
    listeners.push(listener);
  }
  console.log(`  Created ${listeners.length} listeners`);
  return listeners;
}

// ============ LISTENING SESSIONS (120) ============
async function seedListeningSessions(listeners: any[]) {
  console.log("Seeding listening sessions...");
  const timeSlots = ["morning", "midday", "evening", "late_night"];
  const djs = ["hank", "june", "aj", "loretta", "merle"];
  const sessions: any[] = [];

  for (let i = 0; i < 120; i++) {
    const listener = pick(listeners);
    const startTime = randomDate(30);
    const duration = randomInt(10, 180);
    sessions.push({
      listenerId: listener.id,
      startTime,
      endTime: new Date(startTime.getTime() + duration * 60000),
      duration,
      timeSlot: pick(timeSlots),
      djName: pick(djs),
      tracksHeard: randomInt(3, 30),
      adsHeard: randomInt(0, 8),
      device: pick(["web", "mobile", "smart_speaker"]),
      location: pick(cities),
    });
  }

  await prisma.listeningSession.createMany({ data: sessions });
  console.log(`  Created ${sessions.length} listening sessions`);
}

// ============ VIRAL CONTENT (12) ============
async function seedViralContent(artists: any[]) {
  console.log("Seeding viral content...");
  const contentTypes = [
    { type: "tiktok", platform: "tiktok" },
    { type: "reel", platform: "instagram" },
    { type: "short", platform: "youtube" },
  ];
  const categories = ["artist_spotlight", "dj_moment", "behind_scenes", "listener_story"];
  const creators = ["nova", "river", "sage", "elliot"];

  const contents: any[] = [];
  for (let i = 0; i < 12; i++) {
    const ct = pick(contentTypes);
    const artist = pick(artists);
    contents.push({
      type: ct.type,
      title: pick([
        `${artist.name} Live at ${pick(venues)}`,
        "Behind the Scenes: Morning Drive",
        "When the crowd goes wild",
        "DJ Hank's vinyl collection",
        "Fan Moment of the Week",
        `First Win: ${artist.name}`,
        "Late Night Jam Session",
        "Backstage with the Band",
        "Listener Story: How I Found TrueFans",
        "Studio Sessions with Dakota",
        "The 9 Words That Changed Everything",
        "Community Spotlight",
      ]),
      description: "Viral content capturing the spirit of TrueFans Radio",
      platform: ct.platform,
      createdBy: pick(creators),
      category: pick(categories),
      artistId: Math.random() > 0.3 ? artist.id : undefined,
      artistName: Math.random() > 0.3 ? artist.name : undefined,
      views: randomInt(500, 250000),
      likes: randomInt(50, 25000),
      shares: randomInt(10, 5000),
      comments: randomInt(5, 2000),
      newListeners: randomInt(0, 50),
      status: pick(["published", "published", "published", "draft"]),
      publishedAt: randomDate(30),
    });
  }

  await prisma.viralContent.createMany({ data: contents });
  console.log(`  Created ${contents.length} viral content items`);
}

// ============ GROWTH CAMPAIGNS (5) ============
async function seedCampaigns(listeners: any[]) {
  console.log("Seeding growth campaigns & responses...");
  const campaignData = [
    { name: "Artist Referral Drive Q1", type: "artist_referral", channel: "social", goal: "listeners", target: 200, reached: 145 },
    { name: "Habit Builder: Morning Routine", type: "habit_builder", channel: "push", goal: "retention", target: 80, reached: 62 },
    { name: "TikTok Viral Push", type: "viral_push", channel: "social", goal: "virality", target: 50000, reached: 32000 },
    { name: "Community Meetup Campaign", type: "community_event", channel: "community", goal: "listeners", target: 100, reached: 88 },
    { name: "Win-Back: At-Risk Listeners", type: "habit_builder", channel: "email", goal: "retention", target: 50, reached: 23 },
  ];

  for (const c of campaignData) {
    const campaign = await prisma.growthCampaign.create({
      data: {
        name: c.name,
        type: c.type,
        status: c.reached >= c.target ? "completed" : "active",
        targetAudience: pick(["new_listeners", "at_risk", "power_users", "all"]),
        channel: c.channel,
        managedBy: pick(["elliot", "nova", "river", "sage"]),
        goalType: c.goal,
        goalTarget: c.target,
        goalReached: c.reached,
        startDate: randomDate(60),
        endDate: c.reached >= c.target ? randomDate(7) : undefined,
      },
    });

    // 5 responses per campaign
    const responses: any[] = [];
    for (let r = 0; r < 5; r++) {
      responses.push({
        campaignId: campaign.id,
        listenerId: pick(listeners).id,
        action: pick(["clicked", "listened", "shared", "joined", "ignored"]),
        converted: Math.random() > 0.5,
      });
    }
    await prisma.campaignResponse.createMany({ data: responses });
  }
  console.log("  Created 5 campaigns with 25 responses");
}

// ============ DJs (6) + DJ SHOWS + STATION ============
async function seedStation() {
  console.log("Seeding station, DJs, and shows...");

  // Station
  await prisma.station.create({
    data: {
      name: "TrueFans Radio",
      callSign: "TFR",
      tagline: "Where the music finds you",
      description: "TrueFans Radio is an AI-powered Americana and Country radio station that champions independent artists.",
      genre: "Americana, Country, Singer-Songwriter",
      maxTracksPerMonth: 8640,
      maxAdsPerMonth: 17280,
      maxArtistCapacity: 340,
      maxSponsorCapacity: 125,
      targetDAU: 1250,
      isActive: true,
    },
  });

  // DJs
  const djData = [
    { name: "Hank Westwood", slug: "hank-westwood", bio: "Blue-collar poet of the morning airwaves", vibe: "Working-class pride", tagline: "Pour the coffee. Fire up the engine.", weekend: false, primary: "#8B4513", secondary: "#D2691E" },
    { name: "Loretta Merrick", slug: "loretta-merrick", bio: "Desert folk storyteller with a penchant for vinyl", vibe: "Southwestern mystic", tagline: "Let the desert sing.", weekend: false, primary: "#CD853F", secondary: "#DEB887" },
    { name: "AJ Thornton", slug: "aj-thornton", bio: "Late night blues and soul groove master", vibe: "Smooth midnight vibes", tagline: "Night falls. Music rises.", weekend: false, primary: "#191970", secondary: "#483D8B" },
    { name: "Merle Santiago", slug: "merle-santiago", bio: "Honky-tonk historian with encyclopedic music knowledge", vibe: "Vintage country authenticity", tagline: "Real country. Real stories.", weekend: false, primary: "#8B0000", secondary: "#DC143C" },
    { name: "June Wilder", slug: "june-wilder", bio: "Weekend wanderer and folk music curator", vibe: "Free-spirited weekend energy", tagline: "Wander free.", weekend: true, primary: "#2E8B57", secondary: "#3CB371" },
    { name: "Tex Montana", slug: "tex-montana", bio: "Rodeo-bred weekend warrior of the airwaves", vibe: "Saturday night energy", tagline: "Ride on.", weekend: true, primary: "#B8860B", secondary: "#DAA520" },
  ];

  const djs: any[] = [];
  for (const d of djData) {
    const dj = await prisma.dJ.create({
      data: {
        name: d.name,
        slug: d.slug,
        bio: d.bio,
        vibe: d.vibe,
        tagline: d.tagline,
        isActive: true,
        isWeekend: d.weekend,
        colorPrimary: d.primary,
        colorSecondary: d.secondary,
        priority: djs.length,
      },
    });
    djs.push(dj);
  }

  // DJ Shows (weekly schedule)
  const weekdayDjs = djs.filter(d => !d.isWeekend);
  const weekendDjs = djs.filter(d => d.isWeekend);
  const showSlots = [
    { name: "Sunrise & Steel", start: "06:00", end: "10:00", dur: 240, mood: "Morning ritual" },
    { name: "Midday Mesa", start: "10:00", end: "14:00", dur: 240, mood: "Laid-back midday" },
    { name: "Afternoon Drive", start: "14:00", end: "18:00", dur: 240, mood: "Upbeat commute" },
    { name: "Evening Porch", start: "18:00", end: "22:00", dur: 240, mood: "Wind-down storytelling" },
  ];

  let showIdx = 0;
  for (let day = 1; day <= 5; day++) { // Mon-Fri
    for (let s = 0; s < showSlots.length; s++) {
      const slot = showSlots[s];
      const dj = weekdayDjs[s % weekdayDjs.length];
      await prisma.dJShow.create({
        data: {
          djId: dj.id,
          name: `${slot.name} with ${dj.name.split(" ")[0]}`,
          slug: `${slot.name.toLowerCase().replace(/ /g, "-")}-${dj.name.split(" ")[0].toLowerCase()}-${day}`,
          dayOfWeek: day,
          startTime: slot.start,
          endTime: slot.end,
          duration: slot.dur,
          mood: slot.mood,
          isActive: true,
        },
      });
      showIdx++;
    }
  }

  // Weekend shows
  for (let day = 0; day <= 6; day += 6) { // Sun and Sat
    for (let s = 0; s < 2; s++) {
      const dj = weekendDjs[s % weekendDjs.length];
      await prisma.dJShow.create({
        data: {
          djId: dj.id,
          name: `Weekend with ${dj.name.split(" ")[0]}`,
          slug: `weekend-${dj.name.split(" ")[0].toLowerCase()}-${day}-${s}`,
          dayOfWeek: day,
          startTime: s === 0 ? "08:00" : "14:00",
          endTime: s === 0 ? "14:00" : "20:00",
          duration: 360,
          mood: "Weekend vibes",
          isActive: true,
        },
      });
    }
  }

  console.log(`  Created station, ${djs.length} DJs, and ${showIdx + 4} DJ shows`);
  return djs;
}

// ============ ACTIVITY LOGS ============
async function seedActivityLogs(artists: any[], sponsors: any[], listeners: any[]) {
  console.log("Seeding activity logs...");

  // Riley Activity (20+)
  const rileyActions = ["discovered_artist", "sent_message", "qualified_artist", "booked_show", "sent_message", "discovered_artist"];
  const rileyActivities: any[] = [];
  for (let i = 0; i < 25; i++) {
    rileyActivities.push({
      action: pick(rileyActions),
      artistId: pick(artists).id,
      details: { note: `Automated activity ${i + 1}` },
      aiProvider: Math.random() > 0.3 ? "claude" : undefined,
      successful: Math.random() > 0.1,
      createdAt: randomDate(30),
    });
  }
  await prisma.rileyActivity.createMany({ data: rileyActivities });

  // Harper Activity (20+)
  const harperActions = ["discovered_sponsor", "sent_email", "completed_call", "closed_deal", "sent_email"];
  const harperActivities: any[] = [];
  for (let i = 0; i < 25; i++) {
    harperActivities.push({
      action: pick(harperActions),
      sponsorId: pick(sponsors).id,
      details: { note: `Automated activity ${i + 1}` },
      aiProvider: Math.random() > 0.3 ? "claude" : undefined,
      successful: Math.random() > 0.1,
      createdAt: randomDate(30),
    });
  }
  await prisma.harperActivity.createMany({ data: harperActivities });

  // Elliot Activity (20+)
  const elliotActions = ["created_content", "launched_campaign", "activated_listener", "sent_notification"];
  const elliotMembers = ["elliot", "nova", "river", "sage", "orion"];
  const elliotActivities: any[] = [];
  for (let i = 0; i < 25; i++) {
    elliotActivities.push({
      action: pick(elliotActions),
      teamMember: pick(elliotMembers),
      listenerId: pick(listeners).id,
      details: { note: `Automated activity ${i + 1}` },
      successful: Math.random() > 0.1,
      createdAt: randomDate(30),
    });
  }
  await prisma.elliotActivity.createMany({ data: elliotActivities });

  // Cassidy Activity (20+)
  const cassidyActions = ["reviewed_submission", "assigned_tier", "approved_progression", "scheduled_meeting"];
  const cassidyActivities: any[] = [];
  for (let i = 0; i < 25; i++) {
    cassidyActivities.push({
      action: pick(cassidyActions),
      artistId: pick(artists).id,
      details: { note: `Panel activity ${i + 1}` },
      successful: Math.random() > 0.05,
      createdAt: randomDate(30),
    });
  }
  await prisma.cassidyActivity.createMany({ data: cassidyActivities });

  console.log("  Created 100 activity log entries across all teams");
}

// ============ REVENUE ============
async function seedRevenue(artists: any[]) {
  console.log("Seeding revenue data...");
  const paidArtists = artists.filter(a => a.airplayTier !== "FREE");

  // 3 months of RadioRevenuePool
  for (let m = 0; m < 3; m++) {
    const per = period(m);
    const freeCount = artists.filter(a => a.airplayTier === "FREE").length;
    const t5Count = artists.filter(a => a.airplayTier === "TIER_5").length;
    const t20Count = artists.filter(a => a.airplayTier === "TIER_20").length;
    const t50Count = artists.filter(a => a.airplayTier === "TIER_50").length;
    const t120Count = artists.filter(a => a.airplayTier === "TIER_120").length;
    const totalShares = freeCount * 1 + t5Count * 5 + t20Count * 25 + t50Count * 75 + t120Count * 200;
    const totalAdRevenue = randomFloat(8000, 15000);
    const artistPoolAmount = totalAdRevenue * 0.8;
    const perShareValue = artistPoolAmount / totalShares;

    await prisma.radioRevenuePool.create({
      data: {
        period: per,
        totalAdRevenue,
        artistPoolAmount,
        totalShares,
        perShareValue,
        freeArtists: freeCount,
        tier5Artists: t5Count,
        tier20Artists: t20Count,
        tier50Artists: t50Count,
        tier120Artists: t120Count,
        distributedAt: m > 0 ? randomDate(30) : undefined,
        distributionComplete: m > 0,
      },
    });

    // RadioEarnings for paid artists
    if (m > 0) { // Only distributed months
      for (const artist of paidArtists) {
        const shares = artist.airplayTier === "TIER_5" ? 5 : artist.airplayTier === "TIER_20" ? 25 : artist.airplayTier === "TIER_50" ? 75 : 200;
        await prisma.radioEarnings.create({
          data: {
            artistId: artist.id,
            period: per,
            tier: artist.airplayTier,
            shares,
            earnings: parseFloat((shares * perShareValue).toFixed(2)),
            paid: true,
            paidAt: randomDate(14),
          },
        });
      }
    }
  }

  console.log("  Created 3 months of revenue pool and earnings records");
}

// ============ MAIN ============
async function main() {
  console.log("🌱 Comprehensive seed: ALL TEAMS\n");

  await clearAll();

  const artists = await seedArtists();
  await seedConversations(artists);
  await seedShows(artists);

  const sponsors = await seedSponsors();
  await seedSponsorRelations(sponsors);

  const judges = await seedJudges();
  const submissions = await seedSubmissions(artists, judges);
  await seedTierPlacements(submissions);
  await seedRotationSlots(artists);

  const listeners = await seedListeners();
  await seedListeningSessions(listeners);
  await seedViralContent(artists);
  await seedCampaigns(listeners);

  await seedStation();
  await seedActivityLogs(artists, sponsors, listeners);
  await seedRevenue(artists);

  console.log("\n🎉 All teams seeded successfully!");
  console.log(`
Summary:
  - ${artists.length} Artists (18 FREE, 8 TIER_5, 4 TIER_20, 3 TIER_50, 1 TIER_120)
  - ${sponsors.length} Sponsors across all pipeline stages
  - 6 Judges on the review panel
  - ${submissions.length} Submissions with reviews
  - 60 Listeners with sessions
  - 12 Viral content items
  - 5 Growth campaigns
  - 6 DJs with weekly schedule
  - 3 Months of revenue data
  - 100+ Activity log entries
  `);
}

main()
  .catch((e) => {
    console.error("Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
