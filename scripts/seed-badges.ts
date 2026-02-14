import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BADGES = [
  // Listening
  { name: "First Listen", description: "Listened to TrueFans RADIO for the first time", icon: "headphones", category: "listening", condition: "first_listen" },
  { name: "Night Owl", description: "10 late night listening sessions", icon: "moon", category: "listening", condition: "night_owl_10" },
  { name: "Early Bird", description: "10 morning listening sessions", icon: "sunrise", category: "listening", condition: "early_bird_10" },
  { name: "Marathon Listener", description: "Single session over 3 hours", icon: "timer", category: "listening", condition: "marathon_3hr" },
  { name: "Century Club", description: "100 listening sessions", icon: "award", category: "listening", condition: "sessions_100" },

  // Streaks
  { name: "Week Warrior", description: "7-day listening streak", icon: "flame", category: "social", condition: "streak_7" },
  { name: "Month Master", description: "30-day listening streak", icon: "fire", category: "social", condition: "streak_30" },
  { name: "Unstoppable", description: "90-day listening streak", icon: "zap", category: "social", condition: "streak_90" },

  // Social/Referral
  { name: "First Referral", description: "Referred your first listener", icon: "user-plus", category: "referral", condition: "referrals_1" },
  { name: "Network Builder", description: "Referred 10 listeners", icon: "users", category: "referral", condition: "referrals_10" },
  { name: "Influencer", description: "Referred 50 listeners", icon: "megaphone", category: "referral", condition: "referrals_50" },

  // Embed
  { name: "Widget Pioneer", description: "First play from your embed widget", icon: "code", category: "embed", condition: "embed_first_play" },
  { name: "Broadcaster", description: "100 plays from your embed widget", icon: "radio", category: "embed", condition: "embed_100_plays" },
  { name: "Viral", description: "1,000 plays from your embed widget", icon: "trending-up", category: "embed", condition: "embed_1000_plays" },

  // Artist-specific
  { name: "Rising Star", description: "10 listeners gained via embed", icon: "star", category: "artist", condition: "artist_embed_10_listeners" },
  { name: "Fan Magnet", description: "100 listeners gained via embed", icon: "magnet", category: "artist", condition: "artist_embed_100_listeners" },

  // Sponsor-specific
  { name: "Community Builder", description: "10 listener referrals as sponsor", icon: "building", category: "sponsor", condition: "sponsor_referrals_10" },
  { name: "Patron", description: "Backed 5 artists", icon: "heart", category: "sponsor", condition: "sponsor_backed_5_artists" },

  // XP milestones
  { name: "Getting Started", description: "Reached 100 XP", icon: "sparkles", category: "milestone", xpRequired: 100, condition: "xp_100" },
  { name: "Rising Rank", description: "Reached 500 XP", icon: "trophy", category: "milestone", xpRequired: 500, condition: "xp_500" },
  { name: "Power Player", description: "Reached 2,000 XP", icon: "crown", category: "milestone", xpRequired: 2000, condition: "xp_2000" },
  { name: "Legend", description: "Reached 10,000 XP", icon: "gem", category: "milestone", xpRequired: 10000, condition: "xp_10000" },
];

async function main() {
  console.log("Seeding badges...");

  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        xpRequired: badge.xpRequired || null,
        condition: badge.condition,
      },
      create: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        xpRequired: badge.xpRequired || null,
        condition: badge.condition,
      },
    });
    console.log(`  + ${badge.name}`);
  }

  console.log(`\nSeeded ${BADGES.length} badges.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
