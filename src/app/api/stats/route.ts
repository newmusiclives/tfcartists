import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/stats
 * Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get counts by status
    const totalArtists = await prisma.artist.count();
    const discovered = await prisma.artist.count({ where: { status: "DISCOVERED" } });
    const contacted = await prisma.artist.count({ where: { status: "CONTACTED" } });
    const engaged = await prisma.artist.count({ where: { status: "ENGAGED" } });
    const qualified = await prisma.artist.count({ where: { status: "QUALIFIED" } });
    const activated = await prisma.artist.count({ where: { status: "ACTIVATED" } });
    const active = await prisma.artist.count({ where: { status: "ACTIVE" } });

    // Get donation stats
    const totalDonations = await prisma.donation.count();
    const totalRaised = await prisma.donation.aggregate({
      _sum: { amount: true },
    });

    // Get show stats
    const totalShows = await prisma.show.count();
    const completedShows = await prisma.show.count({ where: { status: "COMPLETED" } });

    // Get Riley activity stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await prisma.rileyActivity.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const recentMessages = await prisma.message.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        role: "riley",
      },
    });

    return NextResponse.json({
      artists: {
        total: totalArtists,
        discovered,
        contacted,
        engaged,
        qualified,
        activated,
        active,
      },
      donations: {
        total: totalDonations,
        totalRaised: totalRaised._sum.amount || 0,
      },
      shows: {
        total: totalShows,
        completed: completedShows,
      },
      riley: {
        recentActivity,
        recentMessages,
      },
    });
  } catch (error) {
    logger.error("Error fetching stats", { error });
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
