import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/artists
 * Get all artists with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const stage = searchParams.get("stage");
    const limit = parseInt(searchParams.get("limit") || "50");

    const artists = await prisma.artist.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(stage && { pipelineStage: stage }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        _count: {
          select: {
            conversations: true,
            shows: true,
            donations: true,
          },
        },
      },
    });

    return NextResponse.json({ artists });
  } catch (error) {
    logger.error("Error fetching artists", { error });
    return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 });
  }
}

/**
 * POST /api/artists
 * Create a new artist (manual discovery or import)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      genre,
      discoverySource,
      sourceUrl,
      sourceHandle,
    } = body;

    if (!name || !discoverySource) {
      return NextResponse.json(
        { error: "Missing required fields: name, discoverySource" },
        { status: 400 }
      );
    }

    const artist = await prisma.artist.create({
      data: {
        name,
        email,
        phone,
        genre,
        discoverySource,
        sourceUrl,
        sourceHandle,
        status: "DISCOVERED",
        pipelineStage: "discovery",
      },
    });

    // Log Riley's activity
    await prisma.rileyActivity.create({
      data: {
        action: "discovered_artist",
        artistId: artist.id,
        details: {
          source: discoverySource,
          method: "manual",
        },
      },
    });

    return NextResponse.json({ artist }, { status: 201 });
  } catch (error) {
    logger.error("Error creating artist", { error });
    return NextResponse.json({ error: "Failed to create artist" }, { status: 500 });
  }
}
