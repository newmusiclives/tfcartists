import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/requests/queue?stationId=xxx — public endpoint
 * Returns pending and queued requests sorted by votes (highest first).
 * No auth required — this is the public-facing request queue.
 */
export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");

    if (!stationId) {
      return NextResponse.json(
        { error: "stationId is required" },
        { status: 400 }
      );
    }

    const requests = await prisma.songRequest.findMany({
      where: {
        stationId,
        status: { in: ["pending", "queued"] },
      },
      select: {
        id: true,
        songTitle: true,
        artistName: true,
        listenerName: true,
        message: true,
        status: true,
        votes: true,
        createdAt: true,
      },
      orderBy: [{ votes: "desc" }, { createdAt: "asc" }],
      take: 50,
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return handleApiError(error, "/api/requests/queue");
  }
}
