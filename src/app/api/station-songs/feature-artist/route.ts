import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

const MAX_FEATURED_PER_ARTIST = 5;

/** POST — Feature an artist: set isFeatured=true on up to 5 Category E songs */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("admin", "cassidy");
    if (!session) return unauthorized();

    const { stationId, artistName } = await request.json();
    if (!stationId || !artistName) {
      return NextResponse.json(
        { error: "Missing required fields: stationId, artistName" },
        { status: 400 },
      );
    }

    // Find up to MAX_FEATURED_PER_ARTIST active E-category songs by this artist
    const songs = await prisma.song.findMany({
      where: {
        stationId,
        artistName,
        rotationCategory: "E",
        isActive: true,
      },
      select: { id: true },
      take: MAX_FEATURED_PER_ARTIST,
      orderBy: { createdAt: "desc" },
    });

    if (songs.length === 0) {
      return NextResponse.json(
        { error: "No active Category E songs found for this artist" },
        { status: 404 },
      );
    }

    const now = new Date();
    const result = await prisma.song.updateMany({
      where: { id: { in: songs.map((s) => s.id) } },
      data: { isFeatured: true, featuredAt: now },
    });

    return NextResponse.json({
      featured: result.count,
      artistName,
      songIds: songs.map((s) => s.id),
    });
  } catch (error) {
    return handleApiError(error, "/api/station-songs/feature-artist");
  }
}

/** DELETE — Unfeature an artist: set isFeatured=false on all their songs */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireRole("admin", "cassidy");
    if (!session) return unauthorized();

    const { stationId, artistName } = await request.json();
    if (!stationId || !artistName) {
      return NextResponse.json(
        { error: "Missing required fields: stationId, artistName" },
        { status: 400 },
      );
    }

    const result = await prisma.song.updateMany({
      where: { stationId, artistName, isFeatured: true },
      data: { isFeatured: false, featuredAt: null },
    });

    return NextResponse.json({ unfeatured: result.count, artistName });
  } catch (error) {
    return handleApiError(error, "/api/station-songs/feature-artist");
  }
}
