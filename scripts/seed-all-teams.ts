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
    prisma.stationImagingVoice.deleteMany(),
    prisma.clockAssignment.deleteMany(),
    prisma.clockTemplate.deleteMany(),
    prisma.song.deleteMany(),
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
    prisma.featureSchedule.deleteMany(),
    prisma.featureContent.deleteMany(),
    prisma.featureType.deleteMany(),
    prisma.showTransition.deleteMany(),
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
        preferredDJ: pick(["hank", "loretta", "doc", "cody", "jo", "paul", "ezra", "levi", "sam", "ruby", "mark", "iris", null]),
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
  const djs = ["hank", "loretta", "doc", "cody", "jo", "paul", "ezra", "levi", "sam", "ruby", "mark", "iris"];
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

// ============ DJs (12) + DJ SHOWS + STATION ============
async function seedStation() {
  console.log("Seeding station, DJs, shows, clocks, and assignments...");

  // Station with new fields
  const station = await prisma.station.create({
    data: {
      name: "North Country Radio",
      callSign: "NCR",
      tagline: "Where the music finds you.",
      description: "North Country Radio is an AI-powered Americana and Country radio station on the TrueFans RADIO Network that champions independent artists through free airplay, community-driven curation, and direct fan support.",
      genre: "Americana, Country, Singer-Songwriter",
      stationCode: "ncr",
      formatType: "americana",
      musicEra: "mixed",
      primaryColor: "#B45309",
      secondaryColor: "#EA580C",
      streamBitrate: 128,
      streamFormat: "mp3",
      subscriptionTier: "pro",
      setupStep: 5,
      setupComplete: true,
      maxTracksPerMonth: 8640,
      maxAdsPerMonth: 17280,
      maxArtistCapacity: 340,
      maxSponsorCapacity: 125,
      targetDAU: 1250,
      isActive: true,
    },
  });

  // DJs — all 12 from the NCR schedule, attached to station
  const djData = [
    // WEEKDAY DJs (Mon-Fri, 6am-6pm)
    { name: "Hank Westwood", slug: "hank-westwood", bio: "Construction foreman by day, grew up on 90s country radio, discovered modern Americana through his daughter's Spotify. Blue-collar heart with contemporary country soul.", age: "Late 40s", background: "Construction foreman by day, grew up on 90s country radio, discovered modern Americana through his daughter's Spotify", vibe: "Blue-collar heart with contemporary country soul, bridge between classic and modern", tagline: "Pour the coffee. Fire up the engine. Let's roll.", voiceDesc: "Gravel and warmth, like coffee and worn denim", musicalFocus: "Contemporary country blend: Chris Stapleton, Zach Bryan, Tyler Childers mixed with classic working-class anthems", traits: '["grounded","genre-bridge","authenticity-advocate","morning-motivation"]', weekend: false, primary: "#B45309", secondary: "#EA580C" },
    { name: "Loretta Merrick", slug: "loretta-merrick", bio: "British expat, discovered Kacey Musgraves at 16, moved to Nashville at 25. Now champions the new wave of country storytellers from abroad.", age: "35", background: "British expat, discovered Kacey Musgraves at 16, moved to Nashville at 25. Champions the new wave of country storytellers from abroad.", vibe: "Transatlantic country curator, connects UK and US modern Americana scenes", tagline: "Somewhere between the M6 and the Mississippi.", voiceDesc: "West Midlands accent — warm Brummie with a Nashville twang", musicalFocus: "Contemporary country storytellers: Kacey Musgraves, Margo Price, Sierra Ferrell, Molly Tuttle, Brandi Carlile", traits: '["global-perspective","new-traditionalist","discovery-champion","transatlantic"]', weekend: false, primary: "#EA580C", secondary: "#DC2626" },
    { name: "Marcus 'Doc' Holloway", slug: "doc-holloway", bio: "Former A&R scout who discovered indie country artists before they broke. Now curates deep cuts across generations, connecting Merle Haggard to Zach Bryan.", age: "Mid-50s", background: "Former A&R scout, discovered indie country artists before they broke. Now curates deep cuts across generations.", vibe: "Genre historian who connects Merle Haggard to Zach Bryan, shows how country evolved", tagline: "The songs you forgot you loved.", voiceDesc: "Deep, warm baritone with encyclopedic knowledge", musicalFocus: "Cross-generational country: Sturgill Simpson, The War and Treaty, Colter Wall, mixed with deep album tracks from legends", traits: '["timeline-builder","story-connector","artist-champion","album-thinker"]', weekend: false, primary: "#7C3AED", secondary: "#4F46E5" },
    { name: "Cody Rampart", slug: "cody-rampart", bio: "Touring musician for 15 years, seen every dive bar from Austin to Asheville. Now champions the new outlaws with afternoon drive energy.", age: "Early 40s", background: "Touring musician for 15 years, seen every dive bar from Austin to Asheville. Now champions the new outlaws.", vibe: "Afternoon drive energy with modern outlaw country rebel spirit", tagline: "The road's wide open. Let's ride.", voiceDesc: "Raspy, road-worn, full of lived experience", musicalFocus: "Modern outlaw country: Zach Bryan, Ian Munsick, Cody Jinks, Flatland Cavalry, mixed with classic road anthems", traits: '["new-outlaw-champion","lived-experience","intimate-storyteller","genre-rebel"]', weekend: false, primary: "#E11D48", secondary: "#DB2777" },
    // SATURDAY DJs
    { name: "Jo McAllister", slug: "jo-mcallister", bio: "Saturday morning voice of the working class. Jo brings contemporary blue-collar country stories with a modern sound to start the weekend right.", age: "Early 30s", background: "Grew up in a steel town, found country music as a lifeline", vibe: "Contemporary working-class country energy", tagline: "Steel towns and steel guitars.", voiceDesc: "Warm, relatable, like your favorite coworker telling stories", musicalFocus: "Contemporary working-class country: Tyler Childers, Zach Bryan, The War and Treaty — blue-collar stories, modern sound", traits: '["working-class","relatable","modern","authentic"]', weekend: true, primary: "#374151", secondary: "#6B7280" },
    { name: "Paul Saunders", slug: "paul-saunders", bio: "FOUNDER of TrueFans CONNECT & TrueFans RADIO Network. Paul brings mission-driven Americana storytelling to Saturday mornings.", age: "Late 40s", background: "Creator of TrueFans CONNECT & TrueFans RADIO Network. Lifelong music advocate and community builder.", vibe: "Mission-driven Americana curator, the heart of the network", tagline: "Music that means something.", voiceDesc: "Conversational, passionate, like a friend sharing his favorite record", musicalFocus: "Contemporary Americana storytellers, mission-driven music, independent artists championed by the network", traits: '["founder","visionary","community-builder","artist-champion"]', weekend: true, primary: "#D97706", secondary: "#F59E0B" },
    { name: "Ezra Stone", slug: "ezra-stone", bio: "Curator of the contemplative side of country. Ezra brings modern melancholic country and introspective Americana to Saturday afternoons.", age: "Late 20s", background: "Former literature student who found his voice in the space between poetry and country music", vibe: "Twilight contemplation, introspective Americana", tagline: "The quiet songs hit hardest.", voiceDesc: "Soft, thoughtful, like a late-night conversation", musicalFocus: "Modern melancholic country: Phoebe Bridgers, Noah Kahan, Kacey Musgraves' introspective side — twilight contemplation", traits: '["contemplative","literary","introspective","gentle"]', weekend: true, primary: "#7C3AED", secondary: "#8B5CF6" },
    { name: "Levi Bridges", slug: "levi-bridges", bio: "Weekend adventure DJ bringing outdoor country anthems and feel-good energy to Saturday afternoons.", age: "Mid-30s", background: "Outdoor enthusiast and country music lover who believes the best songs sound better with the windows down", vibe: "Weekend adventure soundtrack energy", tagline: "Windows down. Volume up.", voiceDesc: "Bright, energetic, like sunshine through the truck window", musicalFocus: "Outdoor country anthems: Ian Munsick, Parker McCollum, Riley Green — weekend adventure soundtrack", traits: '["adventurous","energetic","feel-good","outdoor-lover"]', weekend: true, primary: "#059669", secondary: "#10B981" },
    // SUNDAY DJs
    { name: "Sam Turnbull", slug: "sam-turnbull", bio: "Sunday morning voice of raw authenticity. Sam strips country down to its bones — acoustic, honest, and real.", age: "Early 40s", background: "Recording engineer turned DJ who fell in love with the raw, unproduced sound", vibe: "Stripped-down, raw and authentic Sunday mornings", tagline: "No polish. Just truth.", voiceDesc: "Quiet, honest, like someone playing guitar on the porch at dawn", musicalFocus: "Stripped-down modern country: acoustic sessions from Zach Bryan, Sierra Ferrell, Molly Tuttle — raw and authentic", traits: '["raw","authentic","minimalist","dawn-seeker"]', weekend: true, primary: "#DC2626", secondary: "#EF4444" },
    { name: "Ruby Finch", slug: "ruby-finch", bio: "Sunday mid-morning curator of new traditional country and modern bluegrass. Ruby finds the thread connecting old-time music to today's innovators.", age: "Late 20s", background: "Grew up at bluegrass festivals, learned fiddle before she learned to read", vibe: "Modern bluegrass meets contemporary Americana", tagline: "Old roots, new branches.", voiceDesc: "Bright and musical, with an Appalachian lilt", musicalFocus: "New traditional country: Molly Tuttle, Billy Strings, Sierra Ferrell — modern bluegrass meets contemporary Americana", traits: '["traditional","innovative","bluegrass-rooted","joyful"]', weekend: true, primary: "#EA580C", secondary: "#F97316" },
    { name: "Mark Faulkner", slug: "mark-faulkner", bio: "Sunday afternoon voice of Texas country and red dirt. Mark brings the dusty roads and barroom stories to life.", age: "Late 40s", background: "Texas native who grew up on dance halls and red dirt roads", vibe: "Modern Texas country meets contemporary Nashville", tagline: "Dust on the boots. Songs in the heart.", voiceDesc: "Deep Texas drawl, warm and inviting", musicalFocus: "Modern Texas country: Cody Johnson, Parker McCollum, Flatland Cavalry — red dirt meets contemporary Nashville", traits: '["texas-proud","traditional","storyteller","dance-hall-tested"]', weekend: true, primary: "#B45309", secondary: "#D97706" },
    { name: "Iris Langley", slug: "iris-langley", bio: "Sunday evening voice of intimate storytelling. Iris closes the weekend with contemporary singer-songwriters who bare their souls.", age: "Early 30s", background: "Former music journalist who knows every lyric tells a story worth hearing", vibe: "Intimate storytelling for the modern era", tagline: "Every song is someone's truth.", voiceDesc: "Gentle, intimate, like a friend sharing secrets", musicalFocus: "Contemporary singer-songwriters: Maren Morris, Brandi Carlile, Jason Isbell — intimate storytelling for the modern era", traits: '["intimate","empathetic","literary","soul-seeker"]', weekend: true, primary: "#4F46E5", secondary: "#6366F1" },
  ];

  const djs: any[] = [];
  for (const d of djData) {
    const dj = await prisma.dJ.create({
      data: {
        name: d.name,
        slug: d.slug,
        bio: d.bio,
        age: d.age,
        background: d.background,
        vibe: d.vibe,
        tagline: d.tagline,
        voiceDescription: d.voiceDesc,
        musicalFocus: d.musicalFocus,
        personalityTraits: d.traits,
        photoUrl: `/djs/${d.slug}.png`,
        isActive: true,
        isWeekend: d.weekend,
        colorPrimary: d.primary,
        colorSecondary: d.secondary,
        stationId: station.id,
        priority: djs.length,
        voiceStability: 0.75,
        voiceSimilarityBoost: 0.75,
        gptTemperature: 0.8,
      },
    });
    djs.push(dj);
  }

  // DJ Shows (weekly schedule)
  // Weekday: Hank 6-9, Loretta 9-12, Doc 12-3, Cody 3-6
  // Saturday: Jo 6-9, Paul 9-12, Ezra 12-3, Levi 3-6
  // Sunday: Sam 6-9, Ruby 9-12, Mark 12-3, Iris 3-6
  const hank = djs.find(d => d.slug === "hank-westwood")!;
  const loretta = djs.find(d => d.slug === "loretta-merrick")!;
  const doc = djs.find(d => d.slug === "doc-holloway")!;
  const cody = djs.find(d => d.slug === "cody-rampart")!;
  const jo = djs.find(d => d.slug === "jo-mcallister")!;
  const paul = djs.find(d => d.slug === "paul-saunders")!;
  const ezra = djs.find(d => d.slug === "ezra-stone")!;
  const levi = djs.find(d => d.slug === "levi-bridges")!;
  const sam = djs.find(d => d.slug === "sam-turnbull")!;
  const ruby = djs.find(d => d.slug === "ruby-finch")!;
  const mark = djs.find(d => d.slug === "mark-faulkner")!;
  const iris = djs.find(d => d.slug === "iris-langley")!;

  const weekdayShows = [
    { dj: hank, name: "Sunrise & Steel", start: "06:00", end: "09:00", dur: 180, mood: "Morning ritual — coffee and country" },
    { dj: loretta, name: "The Transatlantic Sessions", start: "09:00", end: "12:00", dur: 180, mood: "UK meets Nashville storytelling" },
    { dj: doc, name: "The Deep Cuts", start: "12:00", end: "15:00", dur: 180, mood: "Cross-generational country connections" },
    { dj: cody, name: "The Open Road", start: "15:00", end: "18:00", dur: 180, mood: "Afternoon drive with outlaw energy" },
  ];

  const saturdayShows = [
    { dj: jo, name: "Steel Town Saturday", start: "06:00", end: "09:00", dur: 180, mood: "Working-class weekend warmup" },
    { dj: paul, name: "The Founder's Hour", start: "09:00", end: "12:00", dur: 180, mood: "Mission-driven Americana" },
    { dj: ezra, name: "Twilight Contemplation", start: "12:00", end: "15:00", dur: 180, mood: "Introspective Americana" },
    { dj: levi, name: "Windows Down", start: "15:00", end: "18:00", dur: 180, mood: "Weekend adventure soundtrack" },
  ];

  const sundayShows = [
    { dj: sam, name: "Porch Sessions", start: "06:00", end: "09:00", dur: 180, mood: "Stripped-down acoustic Sunday" },
    { dj: ruby, name: "Old Roots New Branches", start: "09:00", end: "12:00", dur: 180, mood: "Modern bluegrass and traditional" },
    { dj: mark, name: "Red Dirt Sunday", start: "12:00", end: "15:00", dur: 180, mood: "Texas country and dance hall" },
    { dj: iris, name: "Sunday Confessions", start: "15:00", end: "18:00", dur: 180, mood: "Intimate storytelling to close the weekend" },
  ];

  let showCount = 0;
  // Weekday shows (Mon=1 through Fri=5)
  for (let day = 1; day <= 5; day++) {
    for (const s of weekdayShows) {
      await prisma.dJShow.create({
        data: {
          djId: s.dj.id,
          name: `${s.name} with ${s.dj.name.split(" ")[0]}`,
          slug: `${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${day}`,
          dayOfWeek: day,
          startTime: s.start,
          endTime: s.end,
          duration: s.dur,
          mood: s.mood,
          isActive: true,
        },
      });
      showCount++;
    }
  }
  // Saturday shows (day=6)
  for (const s of saturdayShows) {
    await prisma.dJShow.create({
      data: {
        djId: s.dj.id,
        name: `${s.name} with ${s.dj.name.split(" ")[0]}`,
        slug: `${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-sat`,
        dayOfWeek: 6,
        startTime: s.start,
        endTime: s.end,
        duration: s.dur,
        mood: s.mood,
        isActive: true,
      },
    });
    showCount++;
  }
  // Sunday shows (day=0)
  for (const s of sundayShows) {
    await prisma.dJShow.create({
      data: {
        djId: s.dj.id,
        name: `${s.name} with ${s.dj.name.split(" ")[0]}`,
        slug: `${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-sun`,
        dayOfWeek: 0,
        startTime: s.start,
        endTime: s.end,
        duration: s.dur,
        mood: s.mood,
        isActive: true,
      },
    });
    showCount++;
  }

  // =========== CLOCK TEMPLATES ===========
  const clockTemplateData = [
    {
      name: "Morning Drive",
      description: "High-energy start to the day with familiar hits and upbeat tracks",
      clockType: "morning_drive",
      tempo: "upbeat",
      energyLevel: "high",
      hitsPerHour: 8,
      indiePerHour: 2,
      genderBalanceTarget: 0.45,
      pattern: [
        { position: 1, minute: 0, duration: 2, category: "TOH", type: "station_id", notes: "Morning TOH — imaging voice over music bed" },
        { position: 2, minute: 0, duration: 4, category: "A", type: "song", notes: "Hit opener" },
        { position: 3, minute: 4, duration: 4, category: "A", type: "song", notes: "Second hit" },
        { position: 4, minute: 8, duration: 0.25, category: "DJ", type: "voice_break", notes: "Morning greeting" },
        { position: 5, minute: 9, duration: 4, category: "B", type: "song", notes: "Fast tempo" },
        { position: 6, minute: 13, duration: 4, category: "A", type: "song", notes: "Hit" },
        { position: 7, minute: 17, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 1" },
        { position: 8, minute: 18, duration: 4, category: "C", type: "song", notes: "Medium tempo", featureSlot: 1, featuredTrack: "before" },
        { position: 9, minute: 22, duration: 0.5, category: "Feature", type: "feature", notes: "Artist spotlight", featureSlot: 1 },
        { position: 10, minute: 23, duration: 4, category: "A", type: "song", notes: "Hit", featureSlot: 1, featuredTrack: "after" },
        { position: 11, minute: 27, duration: 0.25, category: "DJ", type: "voice_break", notes: "Song intro" },
        { position: 12, minute: 28, duration: 4, category: "B", type: "song", notes: "Fast tempo" },
        { position: 13, minute: 32, duration: 4, category: "E", type: "song", notes: "Indie spotlight" },
        { position: 14, minute: 36, duration: 1, category: "Imaging", type: "sweeper", notes: "Imaging voice sweeper w/ music bed" },
        { position: 15, minute: 37, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 2" },
        { position: 16, minute: 38, duration: 4, category: "A", type: "song", notes: "Hit" },
        { position: 17, minute: 42, duration: 4, category: "B", type: "song", notes: "Fast tempo", featureSlot: 2, featuredTrack: "before" },
        { position: 18, minute: 46, duration: 0.5, category: "Feature", type: "feature", notes: "New release", featureSlot: 2 },
        { position: 19, minute: 47, duration: 0.25, category: "DJ", type: "voice_break", notes: "Back-sell / tease" },
        { position: 20, minute: 48, duration: 4, category: "A", type: "song", notes: "Hit", featureSlot: 2, featuredTrack: "after" },
        { position: 21, minute: 52, duration: 4, category: "E", type: "song", notes: "Indie closer" },
        { position: 22, minute: 56, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 3" },
        { position: 23, minute: 57, duration: 3, category: "A", type: "song", notes: "Closer" },
      ],
    },
    {
      name: "Midday Mix",
      description: "Relaxed midday blend with a mix of hits and deeper cuts",
      clockType: "midday",
      tempo: "moderate",
      energyLevel: "medium",
      hitsPerHour: 6,
      indiePerHour: 3,
      genderBalanceTarget: 0.5,
      pattern: [
        { position: 1, minute: 0, duration: 2, category: "TOH", type: "station_id", notes: "Standard TOH — imaging voice over music bed" },
        { position: 2, minute: 0, duration: 4, category: "A", type: "song", notes: "Hit opener" },
        { position: 3, minute: 4, duration: 4, category: "C", type: "song", notes: "Medium tempo" },
        { position: 4, minute: 8, duration: 0.25, category: "DJ", type: "voice_break", notes: "Midday check-in" },
        { position: 5, minute: 9, duration: 4, category: "C", type: "song", notes: "Medium tempo" },
        { position: 6, minute: 13, duration: 4, category: "A", type: "song", notes: "Hit" },
        { position: 7, minute: 17, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 1" },
        { position: 8, minute: 18, duration: 4, category: "D", type: "song", notes: "Slow ballad", featureSlot: 1, featuredTrack: "before" },
        { position: 9, minute: 22, duration: 0.5, category: "Feature", type: "feature", notes: "New release", featureSlot: 1 },
        { position: 10, minute: 23, duration: 4, category: "E", type: "song", notes: "Indie pick", featureSlot: 1, featuredTrack: "after" },
        { position: 11, minute: 27, duration: 0.25, category: "DJ", type: "voice_break", notes: "Song context" },
        { position: 12, minute: 28, duration: 4, category: "C", type: "song", notes: "Medium" },
        { position: 13, minute: 32, duration: 4, category: "A", type: "song", notes: "Hit" },
        { position: 14, minute: 36, duration: 1, category: "Imaging", type: "sweeper", notes: "Imaging voice sweeper w/ music bed" },
        { position: 15, minute: 37, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 2" },
        { position: 16, minute: 38, duration: 4, category: "E", type: "song", notes: "Indie" },
        { position: 17, minute: 42, duration: 4, category: "A", type: "song", notes: "Hit", featureSlot: 2, featuredTrack: "before" },
        { position: 18, minute: 46, duration: 0.5, category: "Feature", type: "feature", notes: "Artist spotlight", featureSlot: 2 },
        { position: 19, minute: 47, duration: 0.25, category: "DJ", type: "voice_break", notes: "Back-sell / tease" },
        { position: 20, minute: 48, duration: 4, category: "C", type: "song", notes: "Medium", featureSlot: 2, featuredTrack: "after" },
        { position: 21, minute: 52, duration: 4, category: "E", type: "song", notes: "Indie closer" },
        { position: 22, minute: 56, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 3" },
        { position: 23, minute: 57, duration: 3, category: "A", type: "song", notes: "Closer" },
      ],
    },
    {
      name: "Evening Laid Back",
      description: "Mellow evening programming with slower tempos and storytelling",
      clockType: "evening",
      tempo: "laid_back",
      energyLevel: "low",
      hitsPerHour: 5,
      indiePerHour: 4,
      genderBalanceTarget: 0.5,
      pattern: [
        { position: 1, minute: 0, duration: 2, category: "TOH", type: "station_id", notes: "Evening TOH — imaging voice over music bed" },
        { position: 2, minute: 0, duration: 4, category: "D", type: "song", notes: "Slow opener" },
        { position: 3, minute: 4, duration: 4, category: "A", type: "song", notes: "Hit" },
        { position: 4, minute: 8, duration: 0.25, category: "DJ", type: "voice_break", notes: "Evening story" },
        { position: 5, minute: 9, duration: 4, category: "D", type: "song", notes: "Deep cut" },
        { position: 6, minute: 13, duration: 4, category: "E", type: "song", notes: "Indie" },
        { position: 7, minute: 17, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 1" },
        { position: 8, minute: 18, duration: 4, category: "A", type: "song", notes: "Hit", featureSlot: 1, featuredTrack: "before" },
        { position: 9, minute: 22, duration: 0.5, category: "Feature", type: "feature", notes: "Songwriter session", featureSlot: 1 },
        { position: 10, minute: 23, duration: 4, category: "C", type: "song", notes: "Medium", featureSlot: 1, featuredTrack: "after" },
        { position: 11, minute: 27, duration: 0.25, category: "DJ", type: "voice_break", notes: "Artist story" },
        { position: 12, minute: 28, duration: 4, category: "E", type: "song", notes: "Indie" },
        { position: 13, minute: 32, duration: 4, category: "D", type: "song", notes: "Ballad" },
        { position: 14, minute: 36, duration: 1, category: "Imaging", type: "sweeper", notes: "Imaging voice sweeper w/ music bed" },
        { position: 15, minute: 37, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 2" },
        { position: 16, minute: 38, duration: 4, category: "A", type: "song", notes: "Hit" },
        { position: 17, minute: 42, duration: 4, category: "E", type: "song", notes: "Indie", featureSlot: 2, featuredTrack: "before" },
        { position: 18, minute: 46, duration: 0.5, category: "Feature", type: "feature", notes: "Album deep dive", featureSlot: 2 },
        { position: 19, minute: 47, duration: 0.25, category: "DJ", type: "voice_break", notes: "Back-sell / tease" },
        { position: 20, minute: 48, duration: 4, category: "D", type: "song", notes: "Deep cut", featureSlot: 2, featuredTrack: "after" },
        { position: 21, minute: 52, duration: 4, category: "E", type: "song", notes: "Indie closer" },
        { position: 22, minute: 56, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 3" },
        { position: 23, minute: 57, duration: 3, category: "D", type: "song", notes: "Night wind-down" },
      ],
    },
    {
      name: "Weekend Discovery",
      description: "Weekend programming focused on new finds and indie artists",
      clockType: "weekend",
      tempo: "moderate",
      energyLevel: "medium",
      hitsPerHour: 4,
      indiePerHour: 6,
      genderBalanceTarget: 0.55,
      pattern: [
        { position: 1, minute: 0, duration: 2, category: "TOH", type: "station_id", notes: "Weekend TOH — imaging voice over music bed" },
        { position: 2, minute: 0, duration: 4, category: "E", type: "song", notes: "Indie opener" },
        { position: 3, minute: 4, duration: 4, category: "E", type: "song", notes: "New discovery" },
        { position: 4, minute: 8, duration: 0.25, category: "DJ", type: "voice_break", notes: "Weekend intro" },
        { position: 5, minute: 9, duration: 4, category: "A", type: "song", notes: "Hit" },
        { position: 6, minute: 13, duration: 4, category: "E", type: "song", notes: "Indie" },
        { position: 7, minute: 17, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 1" },
        { position: 8, minute: 18, duration: 4, category: "C", type: "song", notes: "Medium", featureSlot: 1, featuredTrack: "before" },
        { position: 9, minute: 22, duration: 0.5, category: "Feature", type: "feature", notes: "New artist showcase", featureSlot: 1 },
        { position: 10, minute: 23, duration: 4, category: "E", type: "song", notes: "Indie", featureSlot: 1, featuredTrack: "after" },
        { position: 11, minute: 27, duration: 0.25, category: "DJ", type: "voice_break", notes: "Artist intro" },
        { position: 12, minute: 28, duration: 4, category: "A", type: "song", notes: "Hit" },
        { position: 13, minute: 32, duration: 4, category: "E", type: "song", notes: "Indie" },
        { position: 14, minute: 36, duration: 1, category: "Imaging", type: "sweeper", notes: "Imaging voice sweeper w/ music bed" },
        { position: 15, minute: 37, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 2" },
        { position: 16, minute: 38, duration: 4, category: "B", type: "song", notes: "Uptempo" },
        { position: 17, minute: 42, duration: 4, category: "E", type: "song", notes: "Indie", featureSlot: 2, featuredTrack: "before" },
        { position: 18, minute: 46, duration: 0.5, category: "Feature", type: "feature", notes: "Indie spotlight", featureSlot: 2 },
        { position: 19, minute: 47, duration: 0.25, category: "DJ", type: "voice_break", notes: "Back-sell / tease" },
        { position: 20, minute: 48, duration: 4, category: "A", type: "song", notes: "Hit", featureSlot: 2, featuredTrack: "after" },
        { position: 21, minute: 52, duration: 4, category: "E", type: "song", notes: "Indie closer" },
        { position: 22, minute: 56, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 3" },
        { position: 23, minute: 57, duration: 3, category: "E", type: "song", notes: "Discovery closer" },
      ],
    },
    {
      name: "Late Night Road",
      description: "After-hours automation with mellow deep cuts and road music",
      clockType: "late_night",
      tempo: "laid_back",
      energyLevel: "low",
      hitsPerHour: 2,
      indiePerHour: 4,
      genderBalanceTarget: 0.4,
      pattern: [
        { position: 1, minute: 0, duration: 2, category: "TOH", type: "station_id", notes: "Late night TOH — imaging voice over ambient bed" },
        { position: 2, minute: 0, duration: 5, category: "D", type: "song", notes: "Slow opener" },
        { position: 3, minute: 5, duration: 5, category: "D", type: "song", notes: "Deep cut" },
        { position: 4, minute: 10, duration: 5, category: "E", type: "song", notes: "Indie gem" },
        { position: 5, minute: 15, duration: 1, category: "Imaging", type: "sweeper", notes: "Imaging voice sweeper w/ ambient bed" },
        { position: 6, minute: 16, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 1" },
        { position: 7, minute: 17, duration: 5, category: "D", type: "song", notes: "Road song" },
        { position: 8, minute: 22, duration: 5, category: "E", type: "song", notes: "Indie" },
        { position: 9, minute: 27, duration: 4, category: "A", type: "song", notes: "Hit" },
        { position: 10, minute: 31, duration: 1, category: "Imaging", type: "sweeper", notes: "Imaging voice sweeper w/ ambient bed" },
        { position: 11, minute: 32, duration: 5, category: "D", type: "song", notes: "Ballad" },
        { position: 12, minute: 37, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 2" },
        { position: 13, minute: 38, duration: 5, category: "E", type: "song", notes: "Indie" },
        { position: 14, minute: 43, duration: 4, category: "A", type: "song", notes: "Hit" },
        { position: 15, minute: 47, duration: 5, category: "D", type: "song", notes: "Deep cut" },
        { position: 16, minute: 52, duration: 1, category: "Imaging", type: "sweeper", notes: "Imaging voice sweeper w/ ambient bed" },
        { position: 17, minute: 53, duration: 1, category: "Sponsor", type: "ad", notes: "Sponsor break 3" },
        { position: 18, minute: 54, duration: 5, category: "E", type: "song", notes: "Indie" },
        { position: 19, minute: 59, duration: 1, category: "D", type: "song", notes: "Night wind-down" },
      ],
    },
  ];

  const clockTemplates: any[] = [];
  for (const ct of clockTemplateData) {
    const template = await prisma.clockTemplate.create({
      data: {
        stationId: station.id,
        name: ct.name,
        description: ct.description,
        clockType: ct.clockType,
        tempo: ct.tempo,
        energyLevel: ct.energyLevel,
        hitsPerHour: ct.hitsPerHour,
        indiePerHour: ct.indiePerHour,
        genderBalanceTarget: ct.genderBalanceTarget,
        clockPattern: JSON.stringify(ct.pattern),
        isActive: true,
      },
    });
    clockTemplates.push(template);
  }

  // =========== CLOCK ASSIGNMENTS ===========
  // Weekday: Hank=Morning, Loretta=Midday, Doc=Midday, Cody=Evening
  // Saturday: Jo=Weekend, Paul=Weekend, Ezra=Weekend, Levi=Weekend
  // Sunday: Sam=Weekend, Ruby=Weekend, Mark=Weekend, Iris=Evening
  // Late Night (6pm-6am) = automation (Late Night Road clock)
  const morningClock = clockTemplates.find(c => c.clockType === "morning_drive")!;
  const middayClock = clockTemplates.find(c => c.clockType === "midday")!;
  const eveningClock = clockTemplates.find(c => c.clockType === "evening")!;
  const weekendClock = clockTemplates.find(c => c.clockType === "weekend")!;
  const lateNightClock = clockTemplates.find(c => c.clockType === "late_night")!;

  const assignments = [
    // Weekday DJs
    { djId: hank.id, clockTemplateId: morningClock.id, dayType: "weekday", start: "06:00", end: "09:00" },
    { djId: loretta.id, clockTemplateId: middayClock.id, dayType: "weekday", start: "09:00", end: "12:00" },
    { djId: doc.id, clockTemplateId: middayClock.id, dayType: "weekday", start: "12:00", end: "15:00" },
    { djId: cody.id, clockTemplateId: eveningClock.id, dayType: "weekday", start: "15:00", end: "18:00" },
    // Saturday DJs
    { djId: jo.id, clockTemplateId: weekendClock.id, dayType: "saturday", start: "06:00", end: "09:00" },
    { djId: paul.id, clockTemplateId: weekendClock.id, dayType: "saturday", start: "09:00", end: "12:00" },
    { djId: ezra.id, clockTemplateId: weekendClock.id, dayType: "saturday", start: "12:00", end: "15:00" },
    { djId: levi.id, clockTemplateId: weekendClock.id, dayType: "saturday", start: "15:00", end: "18:00" },
    // Sunday DJs
    { djId: sam.id, clockTemplateId: weekendClock.id, dayType: "sunday", start: "06:00", end: "09:00" },
    { djId: ruby.id, clockTemplateId: weekendClock.id, dayType: "sunday", start: "09:00", end: "12:00" },
    { djId: mark.id, clockTemplateId: weekendClock.id, dayType: "sunday", start: "12:00", end: "15:00" },
    { djId: iris.id, clockTemplateId: eveningClock.id, dayType: "sunday", start: "15:00", end: "18:00" },
  ];

  for (const a of assignments) {
    await prisma.clockAssignment.create({
      data: {
        stationId: station.id,
        djId: a.djId,
        clockTemplateId: a.clockTemplateId,
        dayType: a.dayType,
        timeSlotStart: a.start,
        timeSlotEnd: a.end,
        isActive: true,
      },
    });
  }

  // =========== IMAGING VOICES ===========
  // These are dedicated imaging voices — NOT the DJs.
  // Deep authoritative male + strong powerful female, both distinct from on-air DJ personalities.
  await prisma.stationImagingVoice.create({
    data: {
      stationId: station.id,
      displayName: "The Voice of NCR",
      voiceType: "male",
      usageTypes: "id,promo,sweeper",
      voiceStability: 0.85,
      voiceSimilarityBoost: 0.9,
      voiceStyle: 0.7,
      isActive: true,
      metadata: {
        voiceCharacter: "Deep, resonant, authoritative male voice — think classic radio imaging. Full bass, commanding presence, cinematic weight. NOT a DJ personality — this is the voice of the station itself.",
        scripts: {
          station_id: [
            { label: "Standard TOH", text: "This... is North Country Radio. Where the music finds you.", musicBed: "Slow acoustic guitar swell with light pedal steel, building to resolve on 'finds you'" },
            { label: "Morning TOH", text: "Good morning. You're locked in to North Country Radio. Where the music finds you.", musicBed: "Bright fingerpicked acoustic intro, rooster crow SFX at open, warm pad underneath" },
            { label: "Evening TOH", text: "The sun's going down, but the music never stops. North Country Radio. Where the music finds you.", musicBed: "Mellow slide guitar over ambient pad, crickets SFX fade in/out" },
            { label: "Weekend TOH", text: "It's the weekend on North Country Radio. Kick back. Turn it up. Where the music finds you.", musicBed: "Upbeat acoustic strum pattern, light brush drums, bass groove" },
          ],
          sweeper: [
            { label: "Quick hit", text: "North Country Radio.", musicBed: "Single acoustic guitar chord hit with reverb tail, 3 seconds" },
            { label: "Tagline", text: "North Country Radio... where the music finds you.", musicBed: "Pedal steel lick over warm pad, 5 seconds" },
            { label: "Between songs", text: "More music. Less talk. North Country Radio.", musicBed: "Snappy acoustic riff, kick drum hit, 4 seconds" },
            { label: "Deep night", text: "Still here. Still playing. North Country Radio.", musicBed: "Low ambient drone with single piano note, 4 seconds" },
          ],
          promo: [
            { label: "Station promo", text: "Real artists. Real music. No algorithms, no playlists — just people who love the sound. This is North Country Radio. Where the music finds you.", musicBed: "Full band bed: acoustic guitar, upright bass, light drums, fiddle accent — 15 seconds, fade under voice" },
            { label: "Artist promo", text: "Every song on North Country Radio comes from an independent artist who deserves to be heard. No major labels. No gatekeepers. Just great music. Where the music finds you.", musicBed: "Fingerpicked acoustic guitar with harmonica accent, warm and intimate, 15 seconds" },
          ],
        },
      },
    },
  });
  await prisma.stationImagingVoice.create({
    data: {
      stationId: station.id,
      displayName: "NCR Power Voice",
      voiceType: "female",
      usageTypes: "id,promo,sweeper",
      voiceStability: 0.8,
      voiceSimilarityBoost: 0.9,
      voiceStyle: 0.65,
      isActive: true,
      metadata: {
        voiceCharacter: "Strong, confident, powerful female voice — commanding and warm, with a slight Southern edge. Cuts through music beds cleanly. NOT a DJ personality — this is the station's power voice for high-energy imaging.",
        scripts: {
          station_id: [
            { label: "Standard TOH", text: "You're listening to North Country Radio. Where the music finds you.", musicBed: "Driving acoustic strum with stomping kick, builds to tagline" },
            { label: "Morning TOH", text: "Rise and shine, it's North Country Radio. Where the music finds you.", musicBed: "Bright mandolin riff with upright bass, energetic open" },
            { label: "Afternoon TOH", text: "All afternoon long — North Country Radio. Where the music finds you.", musicBed: "Mid-tempo acoustic groove, brushed snare, relaxed but confident" },
            { label: "Late night TOH", text: "Through the night... North Country Radio. Where the music finds you.", musicBed: "Sparse piano with ambient pad, soft and atmospheric" },
          ],
          sweeper: [
            { label: "Quick hit", text: "North Country Radio!", musicBed: "Punchy banjo stab with reverb, 2 seconds" },
            { label: "Tagline", text: "Where the music finds you — North Country Radio.", musicBed: "Fiddle swell into acoustic resolve, 5 seconds" },
            { label: "Energy bump", text: "Turn. It. Up. North Country Radio.", musicBed: "Three stomps then full acoustic hit, 4 seconds" },
            { label: "Smooth", text: "The sound of the heartland. North Country Radio.", musicBed: "Pedal steel melody over soft pad, 5 seconds" },
          ],
          promo: [
            { label: "Station promo", text: "Independent music. Powered by fans. Supported by community. This is North Country Radio — where the music finds you.", musicBed: "Anthemic acoustic build: guitar, drums, bass rising together — 12 seconds with big resolve" },
            { label: "Discovery promo", text: "Your next favorite artist is playing right now. You just don't know it yet. North Country Radio. Where the music finds you.", musicBed: "Mysterious fingerpicked intro building to bright acoustic payoff, 12 seconds" },
          ],
        },
      },
    },
  });

  console.log(`  Created station (NCR), ${djs.length} DJs, ${showCount} DJ shows, ${clockTemplates.length} clock templates, ${assignments.length} clock assignments, 2 imaging voices`);
  return { station, djs };
}

// ============ SONGS (~1200) ============
async function seedSongs(stationId: string) {
  console.log("Seeding music library (~1200 songs)...");

  // Realistic Americana/Country artist names (200 unique artists)
  const artistFirstNames = [
    "Hank", "Loretta", "Willie", "Patsy", "Johnny", "Dolly", "Waylon", "Tammy",
    "Merle", "Emmylou", "George", "Reba", "Buck", "Kitty", "Glen", "Crystal",
    "Chet", "Brenda", "Conway", "Barbara", "Charley", "Jeannie", "Marty", "Bobbie",
    "Kris", "Tanya", "Porter", "Dottie", "Vince", "Faith", "Alan", "Shania",
    "Tim", "Trisha", "Garth", "Martina", "Clint", "Lee Ann", "George", "Jo Dee",
    "Tyler", "Sierra", "Zach", "Maren", "Jason", "Kacey", "Sturgill", "Brandi",
    "Colter", "Molly", "Chris", "Amanda", "Cody", "Sierra", "Parker", "Ashley",
    "Luke", "Carly", "Morgan", "Lainey", "Billy", "Phoebe", "Noah", "Waxahatchee",
    "Ian", "Margo", "Charley", "Allison", "Marcus", "Adia", "Hailey", "Drayton",
    "Wyatt", "Bella", "Travis", "Amelia", "Sawyer", "Nora", "Clayton", "Rosie",
    "Dalton", "Ruby", "Emmett", "Pearl", "Jesse", "Violet", "Austin", "Sage",
    "Boone", "Hazel", "Arlo", "Mavis", "Otis", "Bonnie", "Elijah", "Daisy",
  ];
  const artistLastNames = [
    "Williams", "Cash", "Nelson", "Haggard", "Jennings", "Parton", "Cline", "Jones",
    "Harris", "Lynn", "McEntire", "Owens", "Wells", "Campbell", "Gayle", "Atkins",
    "Lee", "Twitty", "Mandrell", "Pride", "Seely", "Robbins", "Gentry", "Kristofferson",
    "Tucker", "Wagoner", "West", "Gill", "Hill", "Jackson", "Twain", "McGraw",
    "Yearwood", "Brooks", "McBride", "Black", "Womack", "Strait", "Messina",
    "Childers", "Ferrell", "Bryan", "Morris", "Isbell", "Musgraves", "Simpson", "Carlile",
    "Wall", "Tuttle", "Stapleton", "Shires", "Jinks", "Hull", "McCollum", "McBryde",
    "Combs", "Pearce", "Wallen", "Wilson", "Strings", "Bridgers", "Kahan", "Aldridge",
    "Munsick", "Price", "Crockett", "Russell", "King", "Victoria", "Whitters", "Farren",
    "Flores", "White", "Landreth", "Rateliff", "Jurado", "Prine", "Earle", "Van Zandt",
    "Clark", "Crowell", "Lovett", "Keen", "McMurtry", "Bowen", "Moreland", "Turnpike",
    "Flatland", "Midland", "Highwomen", "Pistol", "Caamp", "Trampled", "Watchhouse", "Shovels",
  ];

  // Song title components for generating realistic titles
  const titleStarts = [
    "Long", "Broken", "Whiskey", "Midnight", "Dusty", "Silver", "Golden", "Lonely",
    "Thunder", "Fading", "Burning", "Rolling", "Drifting", "Lost", "Wild", "Old",
    "Red", "Blue", "Dark", "Cold", "Sweet", "Bitter", "High", "Low",
    "Deep", "Last", "First", "Empty", "Back", "Down", "Highway", "Mountain",
    "River", "Prairie", "Canyon", "Desert", "Sunset", "Sunrise", "Moonlight", "Starlight",
    "Neon", "Gravel", "Barroom", "Honky Tonk", "Outlaw", "Ramblin'", "Troubadour", "Heartbreak",
  ];
  const titleEnds = [
    "Road", "Song", "Blues", "Night", "Morning", "Light", "Rain", "Wind",
    "Sky", "Moon", "Sun", "Fire", "Water", "Dust", "Stone", "Heart",
    "Home", "Town", "County", "Ridge", "Creek", "Hollow", "Valley", "Bridge",
    "Train", "Mile", "Dream", "Memory", "Prayer", "Whisper", "Thunder", "Lullaby",
    "Serenade", "Ballad", "Waltz", "Two-Step", "Reckoning", "Redemption", "Revival", "Requiem",
    "Confession", "Testimony", "Gospel", "Hymn", "Anthem", "Elegy", "Farewell", "Promise",
  ];
  const standalones = [
    "Amarillo by Morning", "Traveller", "Feathered Indians", "Cover Me Up", "Something to Talk About",
    "Pancho and Lefty", "Mama Tried", "Ring of Fire", "Folsom Prison Blues", "Crazy",
    "I Walk the Line", "Blue Eyes Crying in the Rain", "Jolene", "Coal Miner's Daughter",
    "The Devil Went Down to Georgia", "Friends in Low Places", "The Dance", "Live Like You Were Dying",
    "Humble and Kind", "Tin Man", "Broken Halos", "Whiskey Glasses", "Die a Happy Man",
    "Tennessee Whiskey", "Strawberry Wine", "Fast Car", "Wagon Wheel", "Take Me Home Country Roads",
    "Gentle on My Mind", "Sunday Mornin' Comin' Down", "Highwayman", "Mamas Don't Let Your Babies",
    "On the Road Again", "Always on My Mind", "He Stopped Loving Her Today", "Stand by Your Man",
    "I Fall to Pieces", "Walking After Midnight", "Your Cheatin' Heart", "I'm So Lonesome I Could Cry",
    "Guitars Cadillacs", "Ain't Livin' Long Like This", "Tulsa Time", "Copperhead Road",
    "Guitar Town", "Luxury Liner", "Boulder to Birmingham", "Wrecking Ball",
    "Car Wheels on a Gravel Road", "Passionate Kisses", "Southeastern", "Elephant",
    "Metamodern Sounds in Country Music", "A Sailor's Guide to Earth", "From a Room: Volume 1",
    "Golden Hour", "Star-Crossed", "The Ballad of Dood and Juanita", "Raising Sand",
    "In These Silent Days", "Crooked Tree", "All American Made", "Living Proof",
    "Pageant Material", "Same Trailer Different Park", "The Weight of These Wings",
    "Cry Pretty", "Gaslighter", "The Highwomen", "Lady Like", "Nightfall",
    "Punisher", "I Know the End", "Stick Season", "Northern Attitude",
    "Long Violent History", "Starting Over", "Cuttin' Grass", "Sound & Fury",
    "Childers", "Long Way from Ampurdán", "Mercury Lane", "Hell or High Water",
    "Ain't Always the Cowboy", "Yellowstone Theme", "House of Blues", "Whiskey Myers",
    "Burn It Down", "Something in the Orange", "Sun to Me", "Revival",
    "Chasin' You", "More Than My Hometown", "Sand in My Boots", "Wasted on You",
    "Half of My Hometown", "You Should Probabely Leave", "Fancy Like", "Buy Dirt",
  ];

  const albums = [
    "Heartland Sessions", "Dust & Diamonds", "Roadside Americana", "Porch Light",
    "Midnight Meridian", "Lonesome Highway", "Copper & Gold", "Wildflower",
    "Troubadour Tales", "Outlaw Gospel", "Red Dirt Revival", "Canyon Echoes",
    "Appalachian Spring", "Texas Sun", "Nashville Skyline", "Bakersfield Sound",
    "Muscle Shoals Sessions", "Austin City Limits Live", "Ryman Auditorium",
    "Songs from the Road", "Front Porch Favorites", "Barn Burner", "Slow Burn",
    "The Great Divide", "Honky Tonk Highway", "Neon Church", "Silver Tongue",
    "Broken Compass", "Tall Tales", "Ghost Town Blues", "Sunday Morning Coming Down",
    "The Long Way Home", "Wanderlust", "Crooked River", "Mountain Standard Time",
    "Plains & Simple", "Sagebrush & Starlight", "Last Call", "First Light",
    "Hallelujah Nights", "Desperate Man", "Tequila Little Time", "What You See",
    null, null, null, null, // ~10% singles with no album
  ];

  const songGenres = [
    "Americana", "Americana", "Americana", "Americana",
    "Country", "Country", "Country",
    "Alt-Country", "Alt-Country",
    "Singer-Songwriter", "Singer-Songwriter",
    "Folk", "Folk",
    "Bluegrass", "Blues",
    "Outlaw Country", "Texas Country", "Red Dirt",
    "Roots Rock", "Southern Rock", "Country Rock",
    "Western Swing", "Indie Folk",
  ];

  const musicalKeys = ["C", "D", "E", "F", "G", "A", "B", "Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm", "F#m", "C#m", "Bb", "Eb", "Ab"];

  // Distribution: A=15%, B=20%, C=30%, D=15%, E=20%
  const categoryWeights = [
    ...Array(150).fill("A"),   // Hits
    ...Array(200).fill("B"),   // Fast
    ...Array(300).fill("C"),   // Medium
    ...Array(150).fill("D"),   // Slow
    ...Array(200).fill("E"),   // Indie
  ];

  const genderWeights = [
    ...Array(40).fill("male"),
    ...Array(35).fill("female"),
    ...Array(15).fill("mixed"),
    ...Array(5).fill("instrumental"),
    ...Array(5).fill("unknown"),
  ];

  function genTitle(): string {
    if (Math.random() < 0.3) return pick(standalones);
    if (Math.random() < 0.4) return `${pick(titleStarts)} ${pick(titleEnds)}`;
    // Two-word combos and variants
    const variants = [
      () => `The ${pick(titleStarts)} ${pick(titleEnds)}`,
      () => `${pick(titleStarts)} ${pick(titleEnds)} ${pick(["Blues", "Waltz", "Song", "Lullaby"])}`,
      () => `${pick(["Letter to", "Song for", "Ode to", "Ballad of", "Hymn for"])} ${pick(titleStarts)} ${pick(titleEnds)}`,
      () => `${pick(titleStarts)}`,
    ];
    return pick(variants)();
  }

  function genArtistName(): string {
    return `${pick(artistFirstNames)} ${pick(artistLastNames)}`;
  }

  function tempoFromBpm(bpm: number): string {
    if (bpm < 70) return "very_slow";
    if (bpm < 95) return "slow";
    if (bpm < 125) return "medium";
    if (bpm < 150) return "fast";
    return "very_fast";
  }

  // Generate ~1200 songs in batches of 100 for performance
  const TOTAL_SONGS = 1200;
  const BATCH_SIZE = 100;
  let created = 0;

  // Pre-generate a pool of ~200 unique artist names to reuse (realistic: artists have multiple songs)
  const artistPool: string[] = [];
  for (let i = 0; i < 200; i++) {
    artistPool.push(genArtistName());
  }

  for (let batch = 0; batch < Math.ceil(TOTAL_SONGS / BATCH_SIZE); batch++) {
    const batchSize = Math.min(BATCH_SIZE, TOTAL_SONGS - created);
    const songs: any[] = [];

    for (let i = 0; i < batchSize; i++) {
      const category = pick(categoryWeights);
      const gender = pick(genderWeights);

      // BPM varies by category
      let bpm: number;
      switch (category) {
        case "A": bpm = randomInt(100, 145); break; // Hits — uptempo
        case "B": bpm = randomInt(120, 165); break; // Fast
        case "C": bpm = randomInt(90, 130); break;  // Medium
        case "D": bpm = randomInt(60, 95); break;   // Slow
        case "E": bpm = randomInt(80, 140); break;  // Indie — varied
        default: bpm = randomInt(90, 130);
      }

      const energy = category === "A" ? randomFloat(0.6, 0.95)
        : category === "B" ? randomFloat(0.7, 1.0)
        : category === "C" ? randomFloat(0.4, 0.7)
        : category === "D" ? randomFloat(0.1, 0.45)
        : randomFloat(0.3, 0.8);

      // Pick artist — 70% from pool (repeat artists), 30% fresh
      const artistName = Math.random() < 0.7 ? pick(artistPool) : genArtistName();

      songs.push({
        stationId,
        title: genTitle(),
        artistName,
        album: pick(albums),
        duration: randomInt(165, 330), // 2:45 to 5:30
        genre: pick(songGenres),
        bpm,
        musicalKey: pick(musicalKeys),
        energy,
        rotationCategory: category,
        vocalGender: gender,
        tempoCategory: tempoFromBpm(bpm),
        isActive: Math.random() < 0.92, // 8% inactive
        playCount: category === "A" ? randomInt(50, 500)
          : category === "B" ? randomInt(20, 200)
          : category === "C" ? randomInt(10, 150)
          : category === "D" ? randomInt(5, 80)
          : randomInt(1, 60),
        lastPlayedAt: Math.random() < 0.85 ? randomDate(14) : null,
      });
    }

    await prisma.song.createMany({ data: songs });
    created += batchSize;
  }

  console.log(`  Created ${created} songs in the music library`);
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

// ============ FEATURE TYPES (34 types) ============
async function seedFeatureTypes() {
  console.log("Seeding feature types...");

  const types = [
    // All Shows
    // "before" = song plays first, then feature talks about it
    // "after" = feature introduces, then song plays
    // null = standalone, no track link
    { id: "artist_quickies", name: "Artist Quickies", description: "30-second fun facts about the artist currently playing", category: "all_shows", trackPlacement: "before", suggestedDuration: 30, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Share a quick, fun fact about {artist_name} in the style of {dj_name}. Keep it under 30 seconds of speaking time." },
    { id: "song_story", name: "Song Story", description: "The backstory behind how a song was written or recorded", category: "all_shows", trackPlacement: "before", suggestedDuration: 45, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Tell the story behind '{song_title}' by {artist_name}. Include any interesting recording or writing details. Keep it conversational for {dj_name}." },
    { id: "this_day_in_music", name: "This Day in Music", description: "What happened on this date in music history", category: "all_shows", trackPlacement: null, suggestedDuration: 30, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Share what happened on {date} in country/Americana music history. Make it interesting and relevant for {dj_name}'s audience." },
    { id: "genre_connection", name: "Genre Connection", description: "How two different genres or artists are connected", category: "all_shows", trackPlacement: "before", suggestedDuration: 40, includesPoll: false, includesCallIn: false, socialMediaFriendly: false, gptPromptTemplate: "Explain how {genre1} and {genre2} are connected through {artist_name}. {dj_name} style." },
    { id: "cover_story", name: "Cover Story", description: "Compare an original song to a notable cover version", category: "all_shows", trackPlacement: "before", suggestedDuration: 45, includesPoll: true, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Compare the original '{song_title}' by {original_artist} to the cover by {cover_artist}. Ask listeners which version they prefer. {dj_name} style." },
    { id: "album_deep_dive", name: "Album Deep Dive", description: "Spotlight on a classic or new album", category: "all_shows", trackPlacement: "after", suggestedDuration: 60, includesPoll: false, includesCallIn: false, socialMediaFriendly: false, gptPromptTemplate: "Give a brief deep dive into the album '{album_title}' by {artist_name}. Why it matters. {dj_name} perspective." },
    { id: "songwriter_spotlight", name: "Songwriter Spotlight", description: "Highlight the songwriter behind hits", category: "all_shows", trackPlacement: null, suggestedDuration: 45, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Spotlight songwriter {songwriter} and their contributions to {genre}. {dj_name} style." },
    { id: "listener_dedication", name: "Listener Dedication", description: "Read a listener's song dedication", category: "all_shows", trackPlacement: "after", suggestedDuration: 30, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "{dj_name} reads a dedication from {from_name} to {to_name}: '{message}'. Introduce '{song_title}' by {artist_name}." },
    { id: "instrument_spotlight", name: "Instrument Spotlight", description: "Highlight a unique instrument in the current song", category: "all_shows", trackPlacement: "before", suggestedDuration: 30, includesPoll: false, includesCallIn: false, socialMediaFriendly: false, gptPromptTemplate: "Highlight the {instrument} in '{song_title}' by {artist_name}. What makes it special. {dj_name} style." },
    { id: "producer_profile", name: "Producer Profile", description: "Quick profile of the song's producer", category: "all_shows", trackPlacement: "before", suggestedDuration: 30, includesPoll: false, includesCallIn: false, socialMediaFriendly: false, gptPromptTemplate: "Quick profile of producer {producer} who worked on '{song_title}'. {dj_name} style." },
    { id: "music_trivia", name: "Music Trivia", description: "Quick trivia question about country/Americana music", category: "all_shows", trackPlacement: null, suggestedDuration: 30, includesPoll: true, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Create a fun {genre} music trivia question. Give the answer after a beat. {dj_name} style." },
    { id: "new_release_alert", name: "New Release Alert", description: "Highlight a brand new song or album release", category: "all_shows", trackPlacement: "after", suggestedDuration: 30, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Announce the new release '{song_title}' by {artist_name}. Build excitement. {dj_name} style." },
    { id: "vinyl_corner", name: "Vinyl Corner", description: "Feature a classic record worth tracking down on vinyl", category: "all_shows", trackPlacement: "after", suggestedDuration: 40, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Recommend '{album_title}' by {artist_name} as a vinyl worth hunting for. Why it sounds better on wax. {dj_name} style." },
    { id: "tour_alert", name: "Tour Alert", description: "Upcoming tour dates for featured artists", category: "all_shows", trackPlacement: null, suggestedDuration: 20, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Let listeners know {artist_name} is touring. Encourage them to check dates. {dj_name} style." },
    { id: "fan_poll", name: "Fan Poll", description: "Quick listener poll about music preferences", category: "all_shows", trackPlacement: null, suggestedDuration: 25, includesPoll: true, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Ask listeners a fun poll question about {topic} related to {genre}. {dj_name} style." },
    { id: "lyric_breakdown", name: "Lyric Breakdown", description: "Break down a particularly powerful lyric", category: "all_shows", trackPlacement: "before", suggestedDuration: 40, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Break down a powerful lyric from '{song_title}' by {artist_name}. What makes it resonate. {dj_name} style." },
    { id: "musical_journey", name: "Musical Journey", description: "Trace an artist's evolution across albums", category: "all_shows", trackPlacement: null, suggestedDuration: 50, includesPoll: false, includesCallIn: false, socialMediaFriendly: false, gptPromptTemplate: "Trace {artist_name}'s musical journey and evolution. Key turning points. {dj_name} style." },
    { id: "road_trip_pick", name: "Road Trip Pick", description: "Perfect song for a road trip playlist", category: "all_shows", trackPlacement: "after", suggestedDuration: 20, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "{dj_name} recommends '{song_title}' by {artist_name} as the perfect road trip song. Why it works." },
    { id: "indie_discovery", name: "Indie Discovery", description: "Spotlight on an unsigned or independent artist", category: "all_shows", trackPlacement: "after", suggestedDuration: 45, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Introduce indie artist {artist_name} to the audience. What makes them special. {dj_name} style." },
    { id: "then_and_now", name: "Then & Now", description: "Compare a classic sound to a modern equivalent", category: "all_shows", trackPlacement: "before", suggestedDuration: 40, includesPoll: true, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "Compare a classic {genre} sound to {artist_name}'s modern take. What changed, what stayed. {dj_name} style." },
    // Morning Only (all null trackPlacement — standalone segments)
    { id: "morning_weather", name: "Morning Weather", description: "Brief weather report with personality", category: "morning_only", trackPlacement: null, suggestedDuration: 20, includesPoll: false, includesCallIn: false, socialMediaFriendly: false, gptPromptTemplate: "{dj_name} gives a brief morning weather update. Current conditions: {weather}. Add personality." },
    { id: "morning_motivation", name: "Morning Motivation", description: "Inspirational quote or thought to start the day", category: "morning_only", trackPlacement: null, suggestedDuration: 25, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "{dj_name} shares a morning motivational thought related to {topic}. Keep it genuine and warm." },
    { id: "coffee_talk", name: "Coffee Talk", description: "Casual morning banter topic", category: "morning_only", trackPlacement: null, suggestedDuration: 30, includesPoll: true, includesCallIn: true, socialMediaFriendly: true, gptPromptTemplate: "{dj_name} starts a casual morning conversation about {topic}. Invite listeners to text in." },
    { id: "morning_news_beat", name: "Morning News Beat", description: "Quick music industry news roundup", category: "morning_only", trackPlacement: null, suggestedDuration: 40, includesPoll: false, includesCallIn: false, socialMediaFriendly: false, gptPromptTemplate: "{dj_name} shares a quick music industry news beat. Keep it light and relevant to {genre} fans." },
    { id: "sunrise_set", name: "Sunrise Set", description: "Curated 3-song block for the morning commute", category: "morning_only", trackPlacement: null, suggestedDuration: 20, includesPoll: false, includesCallIn: false, socialMediaFriendly: false, gptPromptTemplate: "{dj_name} introduces a curated sunrise set themed around {theme}. Set the mood for the morning." },
    { id: "wake_up_call", name: "Wake Up Call", description: "Energetic segment to get listeners going", category: "morning_only", trackPlacement: null, suggestedDuration: 20, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "{dj_name} delivers an energetic wake-up call. Theme: {theme}. Get listeners pumped for the day." },
    { id: "commuter_countdown", name: "Commuter Countdown", description: "Top 5 countdown for the morning drive", category: "morning_only", trackPlacement: null, suggestedDuration: 30, includesPoll: true, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "{dj_name} teases the morning commuter countdown. Theme: {theme}. Build anticipation." },
    { id: "morning_request_hour", name: "Morning Request Hour", description: "Open the lines for listener requests", category: "morning_only", trackPlacement: null, suggestedDuration: 20, includesPoll: false, includesCallIn: true, socialMediaFriendly: true, gptPromptTemplate: "{dj_name} opens the morning request hour. Encourage listeners to text or call in their picks." },
    { id: "local_spotlight", name: "Local Spotlight", description: "Highlight a local artist or venue", category: "morning_only", trackPlacement: "after", suggestedDuration: 35, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "{dj_name} spotlights local artist {artist_name}. Where to see them, what makes them worth checking out." },
    { id: "throwback_thursday", name: "Throwback Thursday", description: "Classic song from a specific year", category: "morning_only", trackPlacement: null, suggestedDuration: 30, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "{dj_name} takes us back to {year} with '{song_title}' by {artist_name}. Set the nostalgic scene." },
    { id: "good_news_minute", name: "Good News Minute", description: "Positive news story from the music world", category: "morning_only", trackPlacement: null, suggestedDuration: 25, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "{dj_name} shares a good news story from the {genre} world. Keep it uplifting and genuine." },
    { id: "battle_of_the_bands", name: "Battle of the Bands", description: "Listeners vote between two songs", category: "morning_only", trackPlacement: null, suggestedDuration: 25, includesPoll: true, includesCallIn: true, socialMediaFriendly: true, gptPromptTemplate: "{dj_name} sets up a Battle of the Bands between two {genre} tracks. Get listeners voting!" },
    { id: "morning_mixtape", name: "Morning Mixtape", description: "Themed mini-set curated by the DJ", category: "morning_only", trackPlacement: null, suggestedDuration: 20, includesPoll: false, includesCallIn: false, socialMediaFriendly: false, gptPromptTemplate: "{dj_name} introduces a morning mixtape themed around {theme}. Three songs that go perfectly together." },
    { id: "behind_the_mic", name: "Behind the Mic", description: "DJ shares a personal music memory or story", category: "morning_only", trackPlacement: null, suggestedDuration: 40, includesPoll: false, includesCallIn: false, socialMediaFriendly: true, gptPromptTemplate: "{dj_name} shares a personal memory connected to {artist_name} or '{song_title}'. Make it authentic and heartfelt." },
  ];

  for (const t of types) {
    await prisma.featureType.create({ data: t });
  }
  console.log(`  Created ${types.length} feature types`);
}

// ============ SHOW TRANSITIONS ============
async function seedShowTransitions(stationId: string, djs: any[]) {
  console.log("Seeding show transitions...");

  const hank = djs.find((d: any) => d.slug === "hank-westwood")!;
  const loretta = djs.find((d: any) => d.slug === "loretta-merrick")!;
  const doc = djs.find((d: any) => d.slug === "doc-holloway")!;
  const cody = djs.find((d: any) => d.slug === "cody-rampart")!;

  const transitions = [
    // Show intros
    { transitionType: "show_intro", name: "Sunrise & Steel Intro", scriptText: "Good morning, North Country. Hank Westwood here. Pour the coffee, fire up the engine — let's get this day started with some music that means something.", durationSeconds: 12, fromDjId: null, toDjId: hank.id, timeContext: "morning_drive", hourOfDay: 6 },
    { transitionType: "show_intro", name: "Transatlantic Sessions Intro", scriptText: "Alright, babe! Loretta Merrick here, somewhere between the M6 and the Mississippi. Grab yourself a cuppa — we've got some bustin stories to share today.", durationSeconds: 12, fromDjId: null, toDjId: loretta.id, timeContext: "midday", hourOfDay: 9 },
    { transitionType: "show_intro", name: "Deep Cuts Intro", scriptText: "Doc Holloway here. Time to dig into the record crate. The songs you forgot you loved — and a few you've never heard before.", durationSeconds: 10, fromDjId: null, toDjId: doc.id, timeContext: "midday", hourOfDay: 12 },
    { transitionType: "show_intro", name: "Open Road Intro", scriptText: "Cody Rampart. The road's wide open and the speakers are up. Let's ride.", durationSeconds: 8, fromDjId: null, toDjId: cody.id, timeContext: "evening", hourOfDay: 15 },

    // Show outros
    { transitionType: "show_outro", name: "Sunrise & Steel Outro", scriptText: "That's my time, North Country. Keep your boots on the ground and your radio turned up. Hank out.", durationSeconds: 8, fromDjId: hank.id, toDjId: null, timeContext: "morning_drive", hourOfDay: 9 },
    { transitionType: "show_outro", name: "Transatlantic Sessions Outro", scriptText: "That's me lot for today, ar kid. Keep discovering, keep listening. Loretta Merrick, signing off. Ta-ra a bit!", durationSeconds: 9, fromDjId: loretta.id, toDjId: null, timeContext: "midday", hourOfDay: 12 },
    { transitionType: "show_outro", name: "Deep Cuts Outro", scriptText: "Doc Holloway, closing the crate for today. Remember — the best songs are the ones you haven't heard yet.", durationSeconds: 8, fromDjId: doc.id, toDjId: null, timeContext: "midday", hourOfDay: 15 },
    { transitionType: "show_outro", name: "Open Road Outro", scriptText: "End of the road for today. Cody Rampart, pulling over. See you tomorrow.", durationSeconds: 7, fromDjId: cody.id, toDjId: null, timeContext: "evening", hourOfDay: 18 },

    // DJ Handoffs
    { transitionType: "handoff", name: "Morning to Midday Handoff", scriptText: "Alright, I'm handing the keys to Loretta Merrick. She's got stories from both sides of the Atlantic. Take it away, Loretta.", durationSeconds: 10, fromDjId: hank.id, toDjId: loretta.id, handoffGroupId: "morning-midday", handoffPart: 1, handoffPartName: "Farewell", hourOfDay: 9 },
    { transitionType: "handoff", name: "Morning to Midday Response", scriptText: "Cheers, Hank, babe! I'll take it from here. Right then, let's see what bustin stories the music's got for us today.", durationSeconds: 8, fromDjId: loretta.id, toDjId: null, handoffGroupId: "morning-midday", handoffPart: 2, handoffPartName: "Response", hourOfDay: 9 },
    { transitionType: "handoff", name: "Midday to Afternoon Handoff", scriptText: "Right, I'm handing you over to Doc Holloway now, ar kid. He's got deep cuts you didn't know you needed. Go on, Doc — you'll be bustin!", durationSeconds: 9, fromDjId: loretta.id, toDjId: doc.id, handoffGroupId: "midday-afternoon", handoffPart: 1, handoffPartName: "Farewell", hourOfDay: 12 },
    { transitionType: "handoff", name: "Midday to Afternoon Response", scriptText: "Loretta always leaves me inspired. Let's dig into the crate and find something special.", durationSeconds: 7, fromDjId: doc.id, toDjId: null, handoffGroupId: "midday-afternoon", handoffPart: 2, handoffPartName: "Response", hourOfDay: 12 },
    { transitionType: "handoff", name: "Afternoon to Drive Handoff", scriptText: "Handing off to Cody Rampart for the afternoon drive. Keep those windows down, Cody.", durationSeconds: 8, fromDjId: doc.id, toDjId: cody.id, handoffGroupId: "afternoon-drive", handoffPart: 1, handoffPartName: "Farewell", hourOfDay: 15 },
    { transitionType: "handoff", name: "Afternoon to Drive Response", scriptText: "Windows down, volume up. Let's make this drive count. Cody Rampart's got you.", durationSeconds: 7, fromDjId: cody.id, toDjId: null, handoffGroupId: "afternoon-drive", handoffPart: 2, handoffPartName: "Response", hourOfDay: 15 },
  ];

  for (const t of transitions) {
    await prisma.showTransition.create({
      data: {
        stationId,
        transitionType: t.transitionType,
        name: t.name,
        scriptText: t.scriptText,
        durationSeconds: t.durationSeconds,
        fromDjId: t.fromDjId,
        toDjId: t.toDjId,
        timeContext: t.timeContext || null,
        hourOfDay: t.hourOfDay || null,
        handoffGroupId: t.handoffGroupId || null,
        handoffPart: t.handoffPart || null,
        handoffPartName: t.handoffPartName || null,
        isActive: true,
      },
    });
  }
  console.log(`  Created ${transitions.length} show transitions (intros, outros, handoffs)`);
}

// ============ FEATURE SCHEDULES (DJ-curated per clock type) ============
async function seedFeatureSchedules(stationId: string, djs: any[]) {
  console.log("Seeding feature schedules (DJ-curated)...");

  // Curated feature lists per clock type
  // { featureTypeId, priority, frequencyPerShow }
  const morningDriveFeatures = [
    { id: "artist_quickies", priority: 9, freq: 3 },
    { id: "song_story", priority: 8, freq: 2 },
    { id: "new_release_alert", priority: 7, freq: 1 },
    { id: "this_day_in_music", priority: 7, freq: 1 },
    { id: "cover_story", priority: 6, freq: 1 },
    { id: "road_trip_pick", priority: 6, freq: 1 },
    { id: "music_trivia", priority: 5, freq: 1 },
    { id: "fan_poll", priority: 5, freq: 1 },
    { id: "tour_alert", priority: 4, freq: 1 },
    { id: "then_and_now", priority: 4, freq: 1 },
  ];

  const middayFeatures = [
    { id: "song_story", priority: 9, freq: 2 },
    { id: "artist_quickies", priority: 8, freq: 2 },
    { id: "songwriter_spotlight", priority: 8, freq: 1 },
    { id: "album_deep_dive", priority: 7, freq: 1 },
    { id: "cover_story", priority: 6, freq: 1 },
    { id: "genre_connection", priority: 6, freq: 1 },
    { id: "lyric_breakdown", priority: 6, freq: 1 },
    { id: "new_release_alert", priority: 5, freq: 1 },
    { id: "indie_discovery", priority: 5, freq: 1 },
    { id: "then_and_now", priority: 4, freq: 1 },
  ];

  const eveningFeatures = [
    { id: "song_story", priority: 9, freq: 2 },
    { id: "album_deep_dive", priority: 9, freq: 1 },
    { id: "songwriter_spotlight", priority: 8, freq: 1 },
    { id: "lyric_breakdown", priority: 8, freq: 1 },
    { id: "musical_journey", priority: 7, freq: 1 },
    { id: "vinyl_corner", priority: 7, freq: 1 },
    { id: "instrument_spotlight", priority: 6, freq: 1 },
    { id: "producer_profile", priority: 6, freq: 1 },
    { id: "listener_dedication", priority: 5, freq: 1 },
    { id: "indie_discovery", priority: 5, freq: 1 },
  ];

  const weekendFeatures = [
    { id: "indie_discovery", priority: 9, freq: 1 },
    { id: "new_release_alert", priority: 9, freq: 1 },
    { id: "artist_quickies", priority: 8, freq: 2 },
    { id: "song_story", priority: 7, freq: 1 },
    { id: "album_deep_dive", priority: 6, freq: 1 },
    { id: "road_trip_pick", priority: 6, freq: 1 },
    { id: "tour_alert", priority: 6, freq: 1 },
    { id: "cover_story", priority: 5, freq: 1 },
    { id: "fan_poll", priority: 5, freq: 1 },
    { id: "music_trivia", priority: 4, freq: 1 },
  ];

  // Morning-only features (all priority 6, freq 1) — only for Hank
  const morningOnlyFeatures = await prisma.featureType.findMany({ where: { category: "morning_only" } });

  // Map DJ slugs to clock types
  const djClockMap: Record<string, typeof morningDriveFeatures> = {
    "hank-westwood": morningDriveFeatures,
    "loretta-merrick": middayFeatures,
    "doc-holloway": middayFeatures,
    "cody-rampart": eveningFeatures,
    "jo-mcallister": weekendFeatures,
    "paul-saunders": weekendFeatures,
    "ezra-stone": weekendFeatures,
    "levi-bridges": weekendFeatures,
    "sam-turnbull": weekendFeatures,
    "ruby-finch": weekendFeatures,
    "mark-faulkner": weekendFeatures,
    "iris-langley": eveningFeatures,
  };

  let count = 0;
  for (const dj of djs) {
    const features = djClockMap[dj.slug];
    if (!features) continue;

    // Clock-type curated features
    for (const f of features) {
      await prisma.featureSchedule.create({
        data: {
          stationId,
          featureTypeId: f.id,
          djId: dj.id,
          djName: dj.name,
          frequencyPerShow: f.freq,
          minSongsBetween: 3,
          priority: f.priority,
          isActive: true,
        },
      });
      count++;
    }

    // Morning-only features — only Hank gets these
    if (dj.slug === "hank-westwood") {
      for (const ft of morningOnlyFeatures) {
        await prisma.featureSchedule.create({
          data: {
            stationId,
            featureTypeId: ft.id,
            djId: dj.id,
            djName: dj.name,
            frequencyPerShow: 1,
            minSongsBetween: 4,
            priority: 6,
            isActive: true,
          },
        });
        count++;
      }
    }
  }
  console.log(`  Created ${count} feature schedules (curated per clock type)`);
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

  const { station, djs: stationDjs } = await seedStation();
  await seedSongs(station.id);
  await seedFeatureTypes();
  await seedShowTransitions(station.id, stationDjs);
  await seedFeatureSchedules(station.id, stationDjs);
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
  - 12 DJs with weekly schedule (attached to NCR station)
  - 1,200 Songs in the music library (A/B/C/D/E rotation)
  - 5 Clock templates (4 live 23-slot, 1 automation 19-slot)
  - 12 Clock assignments (DJ-to-clock mappings)
  - 2 Imaging voices
  - 34 Feature types (20 all-shows + 14 morning-only)
  - 14 Show transitions (intros, outros, handoffs)
  - ~134 Feature schedules (DJ-curated per clock type)
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
