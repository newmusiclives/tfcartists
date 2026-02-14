import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { xpToNextLevel, checkBadges } from "@/lib/gamification/xp-engine";

export const dynamic = "force-dynamic";

// GET: Get gamification profile for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const userType = searchParams.get("userType") || "listener";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (userType === "listener") {
      const listener = await prisma.listener.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          xpTotal: true,
          xpLevel: true,
          badges: true,
          listeningStreak: true,
          totalSessions: true,
          totalListeningHours: true,
          tier: true,
          engagementScore: true,
        },
      });

      if (!listener) {
        return NextResponse.json({ error: "Listener not found" }, { status: 404 });
      }

      // Check for new badges
      const newBadges = await checkBadges(userId, "listener");

      // Get recent XP transactions
      const recentXP = await prisma.xPTransaction.findMany({
        where: { userId, userType: "listener" },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Calculate level progress
      const levelInfo = xpToNextLevel(listener.xpTotal);

      // Get rank
      const rank = await prisma.listener.count({
        where: { xpTotal: { gt: listener.xpTotal } },
      }) + 1;

      // Parse badges
      let badges: string[] = [];
      if (listener.badges) {
        try { badges = JSON.parse(listener.badges); } catch { /* empty */ }
      }

      // Get badge details
      const badgeDetails = badges.length > 0
        ? await prisma.badge.findMany({ where: { id: { in: badges } } })
        : [];

      return NextResponse.json({
        profile: {
          id: listener.id,
          name: listener.name || listener.email?.split("@")[0] || "Anonymous",
          xpTotal: listener.xpTotal,
          xpLevel: levelInfo.currentLevel,
          nextLevelXp: levelInfo.nextLevelXp,
          levelProgress: Math.round(levelInfo.progress * 100),
          listeningStreak: listener.listeningStreak,
          totalSessions: listener.totalSessions,
          totalListeningHours: Math.round(listener.totalListeningHours * 10) / 10,
          tier: listener.tier,
          engagementScore: listener.engagementScore,
          rank,
          badges: badgeDetails,
          newBadges,
        },
        recentXP: recentXP.map((tx) => ({
          id: tx.id,
          action: tx.action,
          xpAmount: tx.xpAmount,
          createdAt: tx.createdAt,
        })),
      });
    }

    if (userType === "artist") {
      const artist = await prisma.artist.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          xpTotal: true,
          xpLevel: true,
          embedListeners: true,
          airplayTier: true,
        },
      });

      if (!artist) {
        return NextResponse.json({ error: "Artist not found" }, { status: 404 });
      }

      const levelInfo = xpToNextLevel(artist.xpTotal);

      const rank = await prisma.artist.count({
        where: { xpTotal: { gt: artist.xpTotal } },
      }) + 1;

      return NextResponse.json({
        profile: {
          id: artist.id,
          name: artist.name,
          xpTotal: artist.xpTotal,
          xpLevel: levelInfo.currentLevel,
          nextLevelXp: levelInfo.nextLevelXp,
          levelProgress: Math.round(levelInfo.progress * 100),
          embedListeners: artist.embedListeners,
          airplayTier: artist.airplayTier,
          rank,
        },
      });
    }

    return NextResponse.json({ error: "Invalid userType" }, { status: 400 });
  } catch (error) {
    return handleApiError(error, "/api/gamification/profile");
  }
}
