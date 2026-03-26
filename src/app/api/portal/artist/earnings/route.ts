import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/artist/earnings?artistId=xxx&limit=12
 * Earnings history for the artist portal
 */
export async function GET(request: NextRequest) {
  try {
    const artistId = request.nextUrl.searchParams.get("artistId");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "12", 10);

    if (!artistId) {
      return NextResponse.json({ error: "Missing artistId" }, { status: 400 });
    }

    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const earnings = await prisma.radioEarnings.findMany({
      where: { artistId },
      orderBy: { period: "desc" },
      take: limit,
    });

    // Calculate totals
    const totalEarned = earnings.reduce((sum, e) => sum + e.earnings, 0);
    const totalPaid = earnings.filter((e) => e.paid).reduce((sum, e) => sum + e.earnings, 0);
    const totalPending = totalEarned - totalPaid;

    logger.info("Fetched artist earnings history", { artistId, count: earnings.length });

    return NextResponse.json({
      earnings,
      summary: {
        totalEarned,
        totalPaid,
        totalPending,
        periodCount: earnings.length,
      },
    });
  } catch (error) {
    logger.error("Error fetching artist earnings", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 });
  }
}
