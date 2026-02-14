import { prisma } from "@/lib/db";

// XP amounts for each action
export const XP_ACTIONS = {
  // Listener actions
  listen_session: 10,       // 30+ min session
  daily_streak: 5,          // per day of streak
  streak_7_day: 50,         // 7-day bonus
  streak_30_day: 200,       // 30-day bonus
  streak_90_day: 500,       // 90-day bonus
  referral: 100,            // refer a listener
  referral_listen_1hr: 25,  // referred listener listens 1hr

  // Artist/Listener embed actions
  embed_play: 5,            // someone plays your embed
  embed_100_plays: 500,     // 100 embed plays milestone
  embed_new_listener: 50,   // new listener via embed

  // Artist actions
  tier_upgrade: 200,        // artist tier upgrade

  // Sponsor actions
  sponsor_listener_referral: 20,  // sponsor refers a listener
  sponsor_back_artist: 100,       // back an artist
} as const;

// XP thresholds for levels
function xpForLevel(level: number): number {
  // Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 250, etc.
  if (level <= 1) return 0;
  return Math.floor(50 * level * (level - 1));
}

export function calculateLevel(xpTotal: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xpTotal) {
    level++;
  }
  return level;
}

export function xpToNextLevel(xpTotal: number): { currentLevel: number; nextLevelXp: number; progress: number } {
  const currentLevel = calculateLevel(xpTotal);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const progress = nextLevelXp > currentLevelXp
    ? (xpTotal - currentLevelXp) / (nextLevelXp - currentLevelXp)
    : 1;
  return { currentLevel, nextLevelXp, progress };
}

/**
 * Award XP to a user and update their total/level
 */
export async function awardXP(
  userId: string,
  userType: "listener" | "artist" | "sponsor",
  action: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<{ xpTotal: number; xpLevel: number; leveledUp: boolean }> {
  // Create XP transaction
  await prisma.xPTransaction.create({
    data: {
      userId,
      userType,
      action,
      xpAmount: amount,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // Update user's XP total based on type
  if (userType === "listener") {
    const listener = await prisma.listener.update({
      where: { id: userId },
      data: { xpTotal: { increment: amount } },
    });

    const newLevel = calculateLevel(listener.xpTotal);
    const leveledUp = newLevel > listener.xpLevel;

    if (leveledUp) {
      await prisma.listener.update({
        where: { id: userId },
        data: { xpLevel: newLevel },
      });
    }

    return { xpTotal: listener.xpTotal, xpLevel: newLevel, leveledUp };
  } else if (userType === "artist") {
    const artist = await prisma.artist.update({
      where: { id: userId },
      data: { xpTotal: { increment: amount } },
    });

    const newLevel = calculateLevel(artist.xpTotal);
    const leveledUp = newLevel > artist.xpLevel;

    if (leveledUp) {
      await prisma.artist.update({
        where: { id: userId },
        data: { xpLevel: newLevel },
      });
    }

    return { xpTotal: artist.xpTotal, xpLevel: newLevel, leveledUp };
  }

  // Sponsor: just log (no xp fields on Sponsor model)
  return { xpTotal: amount, xpLevel: 1, leveledUp: false };
}

/**
 * Check and award badges for a user
 */
export async function checkBadges(
  userId: string,
  userType: "listener" | "artist" | "sponsor"
): Promise<string[]> {
  const newBadges: string[] = [];

  // Get all badge definitions
  const allBadges = await prisma.badge.findMany();

  // Get user's current badges
  let currentBadges: string[] = [];
  if (userType === "listener") {
    const listener = await prisma.listener.findUnique({ where: { id: userId } });
    if (listener?.badges) {
      try { currentBadges = JSON.parse(listener.badges); } catch { /* empty */ }
    }
  }

  // Get user's XP total
  let xpTotal = 0;
  if (userType === "listener") {
    const listener = await prisma.listener.findUnique({ where: { id: userId } });
    xpTotal = listener?.xpTotal || 0;
  } else if (userType === "artist") {
    const artist = await prisma.artist.findUnique({ where: { id: userId } });
    xpTotal = artist?.xpTotal || 0;
  }

  // Check XP-based badges
  for (const badge of allBadges) {
    if (currentBadges.includes(badge.id)) continue;

    if (badge.xpRequired && xpTotal >= badge.xpRequired) {
      newBadges.push(badge.id);
    }
  }

  // Check condition-based badges for listeners
  if (userType === "listener") {
    const listener = await prisma.listener.findUnique({ where: { id: userId } });
    if (!listener) return newBadges;

    for (const badge of allBadges) {
      if (currentBadges.includes(badge.id) || newBadges.includes(badge.id)) continue;

      switch (badge.condition) {
        case "first_listen":
          if (listener.totalSessions >= 1) newBadges.push(badge.id);
          break;
        case "sessions_100":
          if (listener.totalSessions >= 100) newBadges.push(badge.id);
          break;
        case "streak_7":
          if (listener.listeningStreak >= 7) newBadges.push(badge.id);
          break;
        case "streak_30":
          if (listener.listeningStreak >= 30) newBadges.push(badge.id);
          break;
        case "streak_90":
          if (listener.listeningStreak >= 90) newBadges.push(badge.id);
          break;
      }
    }
  }

  // Save new badges
  if (newBadges.length > 0) {
    const updatedBadges = [...currentBadges, ...newBadges];
    if (userType === "listener") {
      await prisma.listener.update({
        where: { id: userId },
        data: { badges: JSON.stringify(updatedBadges) },
      }).catch(() => {});
    }
  }

  return newBadges;
}

/**
 * Get leaderboard for a user type
 */
export async function getLeaderboard(
  userType: "listener" | "artist",
  limit = 50
): Promise<Array<{ id: string; name: string | null; xpTotal: number; xpLevel: number; badges: string[] }>> {
  if (userType === "listener") {
    const listeners = await prisma.listener.findMany({
      where: { xpTotal: { gt: 0 } },
      orderBy: { xpTotal: "desc" },
      take: limit,
      select: { id: true, name: true, email: true, xpTotal: true, xpLevel: true, badges: true },
    });

    return listeners.map((l) => ({
      id: l.id,
      name: l.name || l.email?.split("@")[0] || "Anonymous",
      xpTotal: l.xpTotal,
      xpLevel: l.xpLevel,
      badges: l.badges ? (() => { try { return JSON.parse(l.badges); } catch { return []; } })() : [],
    }));
  }

  const artists = await prisma.artist.findMany({
    where: { xpTotal: { gt: 0 } },
    orderBy: { xpTotal: "desc" },
    take: limit,
    select: { id: true, name: true, xpTotal: true, xpLevel: true },
  });

  return artists.map((a) => ({
    id: a.id,
    name: a.name,
    xpTotal: a.xpTotal,
    xpLevel: a.xpLevel,
    badges: [],
  }));
}
