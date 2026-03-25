import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/requests/search?q=term&stationId=xxx — search songs in library
 * Public endpoint for the song request page.
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");
    const stationId = request.nextUrl.searchParams.get("stationId");

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ songs: [] });
    }

    const searchTerm = q.trim();

    const where: any = {
      isActive: true,
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { artistName: { contains: searchTerm, mode: "insensitive" } },
      ],
    };

    if (stationId) {
      where.stationId = stationId;
    }

    const songs = await prisma.song.findMany({
      where,
      select: {
        id: true,
        title: true,
        artistName: true,
      },
      orderBy: { title: "asc" },
      take: 10,
    });

    return NextResponse.json({ songs });
  } catch (error) {
    return handleApiError(error, "/api/requests/search");
  }
}
