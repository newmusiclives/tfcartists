import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { awardXP, checkBadges, XP_ACTIONS } from "@/lib/gamification/xp-engine";

export const dynamic = "force-dynamic";

function getTimeSlot(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "midday";
  if (hour >= 17 && hour < 22) return "evening";
  return "late_night";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listenerId } = body;

    const session = await prisma.listeningSession.create({
      data: {
        listenerId: listenerId || null,
        startTime: new Date(),
        timeSlot: getTimeSlot(),
        device: "web",
      },
    });

    // Update listener stats if identified
    if (listenerId) {
      await prisma.listener.update({
        where: { id: listenerId },
        data: {
          totalSessions: { increment: 1 },
          lastListenedAt: new Date(),
          favoriteTimeSlot: getTimeSlot(),
        },
      }).catch(() => {
        // Listener may not exist, non-critical
      });
    }

    return NextResponse.json({ session: { id: session.id } }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/listeners/sessions");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, duration } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const session = await prisma.listeningSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        duration: duration ? Math.round(duration / 60) : null, // Convert seconds to minutes
      },
    });

    // Update listener's total listening hours
    let xpAwarded = 0;
    if (session.listenerId && duration) {
      const hours = duration / 3600;
      const listener = await prisma.listener.update({
        where: { id: session.listenerId },
        data: {
          totalListeningHours: { increment: hours },
        },
      }).catch(() => null);

      // Award XP for 30+ minute sessions
      if (duration >= 1800 && listener) {
        try {
          const result = await awardXP(
            session.listenerId,
            "listener",
            "listen_session",
            XP_ACTIONS.listen_session,
            { sessionId, duration }
          );
          xpAwarded = XP_ACTIONS.listen_session;

          // Check streak bonuses
          if (listener.listeningStreak === 7) {
            await awardXP(session.listenerId, "listener", "streak_7_day", XP_ACTIONS.streak_7_day);
            xpAwarded += XP_ACTIONS.streak_7_day;
          } else if (listener.listeningStreak === 30) {
            await awardXP(session.listenerId, "listener", "streak_30_day", XP_ACTIONS.streak_30_day);
            xpAwarded += XP_ACTIONS.streak_30_day;
          } else if (listener.listeningStreak === 90) {
            await awardXP(session.listenerId, "listener", "streak_90_day", XP_ACTIONS.streak_90_day);
            xpAwarded += XP_ACTIONS.streak_90_day;
          }

          // Check for new badges
          await checkBadges(session.listenerId, "listener");
        } catch {
          // Non-critical: gamification failure shouldn't break session tracking
        }
      }
    }

    return NextResponse.json({ success: true, xpAwarded });
  } catch (error) {
    return handleApiError(error, "/api/listeners/sessions");
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listenerId = searchParams.get("listenerId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where: Record<string, unknown> = {};
    if (listenerId) where.listenerId = listenerId;

    const sessions = await prisma.listeningSession.findMany({
      where,
      orderBy: { startTime: "desc" },
      take: limit,
    });

    const totalSessions = await prisma.listeningSession.count({ where });
    const totalMinutes = await prisma.listeningSession.aggregate({
      _sum: { duration: true },
      where,
    });

    return NextResponse.json({
      sessions,
      stats: {
        totalSessions,
        totalMinutes: totalMinutes._sum.duration || 0,
      },
    });
  } catch (error) {
    return handleApiError(error, "/api/listeners/sessions");
  }
}
