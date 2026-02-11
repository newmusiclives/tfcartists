import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api/errors";
import { withPagination } from "@/lib/api/helpers";

/**
 * GET /api/artists
 * Get all artists with optional filters, pagination, search, tier filter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const stage = searchParams.get("stage");
    const tier = searchParams.get("tier");
    const { page, limit, skip, sortBy, sortOrder, search } = withPagination(searchParams);

    const where: any = {
      deletedAt: null,
      ...(status && { status: status as any }),
      ...(stage && { pipelineStage: stage }),
      ...(tier && { airplayTier: tier as any }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { genre: { contains: search } },
        ],
      }),
    };

    const [artists, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip,
        include: {
          _count: {
            select: {
              conversations: true,
              shows: true,
              donations: true,
            },
          },
        },
      }),
      prisma.artist.count({ where }),
    ]);

    return NextResponse.json({
      artists,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error, "/api/artists");
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
