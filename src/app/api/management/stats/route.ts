import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get("stationId");

    // Run parallel queries for all team data
    const [
      artistCount,
      artistsByStatus,
      paidArtists,
      sponsorCount,
      activeSponsors,
      sponsorshipRevenue,
      submissionCount,
      submissionsByStatus,
      tierPlacements,
      listenerCount,
      recentSessions,
      activeCampaigns,
      songCount,
      djCount,
      clockCount,
      station,
    ] = await Promise.all([
      // Riley: Artist counts
      prisma.artist.count({ where: { deletedAt: null } }),
      prisma.artist.groupBy({
        by: ["status"],
        _count: true,
        where: { deletedAt: null },
      }),
      prisma.artist.count({
        where: {
          deletedAt: null,
          airplayTier: { not: "FREE" },
        },
      }),

      // Harper: Sponsor counts
      prisma.sponsor.count({ where: { deletedAt: null } }),
      prisma.sponsor.count({
        where: {
          deletedAt: null,
          status: { in: ["ACTIVE", "CLOSED"] },
        },
      }),
      prisma.sponsorship.aggregate({
        _sum: { monthlyAmount: true },
        where: { status: "active" },
      }),

      // Cassidy: Submission counts
      prisma.submission.count(),
      prisma.submission.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.tierPlacement.count(),

      // Elliot: Listener counts
      prisma.listener.count(),
      prisma.listeningSession.count({
        where: {
          startTime: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.growthCampaign.count({
        where: { status: "active" },
      }),

      // Station: Infrastructure counts
      stationId
        ? prisma.song.count({ where: { stationId } })
        : prisma.song.count(),
      stationId
        ? prisma.dJ.count({ where: { stationId, isActive: true } })
        : prisma.dJ.count({ where: { isActive: true } }),
      stationId
        ? prisma.clockTemplate.count({ where: { stationId, isActive: true } })
        : prisma.clockTemplate.count({ where: { isActive: true } }),

      // Station info
      stationId
        ? prisma.station.findUnique({ where: { id: stationId } })
        : prisma.station.findFirst({ where: { isActive: true } }),
    ]);

    // Calculate artist subscription revenue
    const tierRevenue: Record<string, number> = {
      TIER_5: 5,
      TIER_20: 20,
      TIER_50: 50,
      TIER_120: 120,
    };

    const artistsByTier = await prisma.artist.groupBy({
      by: ["airplayTier"],
      _count: true,
      where: { deletedAt: null, airplayTier: { not: "FREE" } },
    });

    const artistSubscriptionRevenue = artistsByTier.reduce(
      (sum, group) => sum + (tierRevenue[group.airplayTier] || 0) * group._count,
      0
    );

    const sponsorRevenue = sponsorshipRevenue._sum.monthlyAmount || 0;
    const totalRevenue = artistSubscriptionRevenue + sponsorRevenue;

    // Build status maps
    const submissionStatusMap = Object.fromEntries(
      submissionsByStatus.map((s) => [s.status, s._count])
    );
    const artistStatusMap = Object.fromEntries(
      artistsByStatus.map((a) => [a.status, a._count])
    );

    // Targets
    const targets = {
      artists: station?.maxArtistCapacity || 340,
      sponsors: station?.maxSponsorCapacity || 125,
      listeners: station?.targetDAU || 5000,
      revenue: 50000,
    };

    // Calculate playbook progress
    const playbookProgress = {
      foundation: {
        phase: 1,
        name: "Station Foundation",
        team: "Station Ops",
        total: 8,
        done: Math.min(8, songCount > 0 ? 3 : 0) + Math.min(5, djCount > 0 ? 3 : 0) + (clockCount > 0 ? 2 : 0),
        progress: 0,
      },
      curation: {
        phase: 2,
        name: "Content & Curation",
        team: "Team Cassidy",
        total: 6,
        done: (submissionStatusMap["PLACED"] || 0) > 0 ? 2 : 0,
        progress: 0,
      },
      artists: {
        phase: 3,
        name: "Artist Acquisition",
        team: "Team Riley",
        total: 7,
        done: Math.min(4, (artistCount > 0 ? 1 : 0) + (paidArtists > 0 ? 1 : 0) + ((artistStatusMap["ACTIVATED"] || 0) > 0 ? 1 : 0) + ((artistStatusMap["ACTIVE"] || 0) > 0 ? 1 : 0)),
        progress: 0,
      },
      revenue: {
        phase: 4,
        name: "Revenue Generation",
        team: "Team Harper",
        total: 7,
        done: Math.min(3, (sponsorCount > 0 ? 1 : 0) + (activeSponsors > 0 ? 1 : 0) + (sponsorRevenue > 0 ? 1 : 0)),
        progress: 0,
      },
      growth: {
        phase: 5,
        name: "Audience Growth",
        team: "Team Elliot",
        total: 7,
        done: Math.min(2, (listenerCount > 0 ? 1 : 0) + (activeCampaigns > 0 ? 1 : 0)),
        progress: 0,
      },
    };

    // Calculate percentages
    for (const phase of Object.values(playbookProgress)) {
      phase.progress = phase.total > 0 ? Math.round((phase.done / phase.total) * 100) : 0;
    }

    const totalPlaybookTasks = Object.values(playbookProgress).reduce((s, p) => s + p.total, 0);
    const completedPlaybookTasks = Object.values(playbookProgress).reduce((s, p) => s + p.done, 0);

    // Generate priority actions dynamically
    const priorityActions: Array<{
      id: string;
      priority: string;
      title: string;
      description: string;
      team: string;
      teamColor: string;
      href: string;
      dueLabel: string;
    }> = [];

    if (artistCount < 100) {
      priorityActions.push({
        id: "artists-target",
        priority: "critical",
        title: `Need ${100 - artistCount} more artists`,
        description: `Currently at ${artistCount} artists. Target: 100 paying artists for sustainable revenue.`,
        team: "Riley",
        teamColor: "purple",
        href: "/riley/pipeline",
        dueLabel: "This month",
      });
    }

    if (activeSponsors < 10) {
      priorityActions.push({
        id: "sponsors-target",
        priority: "critical",
        title: `Need ${10 - activeSponsors} more active sponsors`,
        description: `Currently at ${activeSponsors} active sponsors. Target: 10 sponsors for initial revenue.`,
        team: "Harper",
        teamColor: "green",
        href: "/harper/pipeline",
        dueLabel: "This month",
      });
    }

    const pendingSubmissions = submissionStatusMap["PENDING"] || 0;
    if (pendingSubmissions > 5) {
      priorityActions.push({
        id: "submissions-backlog",
        priority: "high",
        title: `${pendingSubmissions} submissions awaiting review`,
        description: "Clear the review queue to keep artists engaged and onboarding smooth.",
        team: "Cassidy",
        teamColor: "teal",
        href: "/cassidy/submissions",
        dueLabel: "This week",
      });
    }

    if (listenerCount < 100) {
      priorityActions.push({
        id: "listeners-target",
        priority: "high",
        title: `Build listener base (currently ${listenerCount})`,
        description: "Launch listener acquisition campaigns to build critical mass.",
        team: "Elliot",
        teamColor: "blue",
        href: "/elliot/campaigns",
        dueLabel: "This month",
      });
    }

    if (tierPlacements === 0) {
      priorityActions.push({
        id: "tier-placements",
        priority: "medium",
        title: "No tier placements yet",
        description: "Review and place artists into rotation tiers to populate the programming schedule.",
        team: "Cassidy",
        teamColor: "teal",
        href: "/cassidy/tier-management",
        dueLabel: "This month",
      });
    }

    return NextResponse.json({
      station: station
        ? { id: station.id, name: station.name, callSign: station.callSign }
        : null,
      kpis: {
        totalRevenue,
        artistSubscriptionRevenue,
        sponsorRevenue,
        artistCount,
        paidArtists,
        sponsorCount,
        activeSponsors,
        submissionCount,
        pendingSubmissions,
        tierPlacements,
        listenerCount,
        recentSessions,
        activeCampaigns,
        songCount,
        djCount,
        clockCount,
      },
      targets,
      playbook: playbookProgress,
      playbookOverall: {
        total: totalPlaybookTasks,
        completed: completedPlaybookTasks,
        progress: totalPlaybookTasks > 0
          ? Math.round((completedPlaybookTasks / totalPlaybookTasks) * 100)
          : 0,
      },
      priorityActions,
    });
  } catch (error) {
    return handleApiError(error, "/api/management/stats");
  }
}
