import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth/config";
import { withRateLimit } from "@/lib/rate-limit/limiter";

export const dynamic = "force-dynamic";

/**
 * POST /api/scouts/discover-artist
 * Submit a new artist discovery
 *
 * Rate limited: 60 requests per minute (API tier)
 */
export async function POST(req: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await withRateLimit(req, "api");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // SECURITY: Require authentication
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const {
      scoutId,
      artistName,
      artistEmail,
      genre,
      discoverySource,
      sourceUrl,
      notes,
    } = body;

    // Validate required fields
    if (!scoutId || !artistName || !artistEmail) {
      return NextResponse.json(
        {
          error: "scoutId, artistName, and artistEmail are required",
        },
        { status: 400 }
      );
    }

    // Verify scout exists and is active
    const scout = await prisma.scout.findUnique({
      where: { id: scoutId },
    });

    if (!scout) {
      return NextResponse.json({ error: "Scout not found" }, { status: 404 });
    }

    if (scout.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Scout is not active" },
        { status: 403 }
      );
    }

    // Check if artist already exists
    let artist = await prisma.artist.findUnique({
      where: { email: artistEmail },
    });

    if (artist) {
      // Artist exists, check if this scout already discovered them
      const existingDiscovery = await prisma.artistDiscovery.findUnique({
        where: {
          scoutId_artistId: {
            scoutId,
            artistId: artist.id,
          },
        },
      });

      if (existingDiscovery) {
        return NextResponse.json(
          {
            error: "You have already discovered this artist",
            discovery: existingDiscovery,
          },
          { status: 400 }
        );
      }
    } else {
      // Create new artist in Riley's pipeline
      artist = await prisma.artist.create({
        data: {
          name: artistName,
          email: artistEmail,
          genre: genre || null,
          discoverySource: discoverySource || "scout_discovery",
          sourceUrl: sourceUrl || null,
          status: "DISCOVERED",
          pipelineStage: "discovery",
        },
      });

      logger.info(`New artist created by scout: ${artist.id} (${artistName})`);

      // Log Riley's activity
      await prisma.rileyActivity.create({
        data: {
          action: "discovered_artist",
          artistId: artist.id,
          details: {
            source: "scout_discovery",
            scoutId,
            artistName,
          },
        },
      });
    }

    // Create artist discovery record
    const discovery = await prisma.artistDiscovery.create({
      data: {
        scoutId,
        artistId: artist.id,
        discoverySource: discoverySource || "manual",
        sourceUrl,
        notes,
        status: "PENDING",
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
            genre: true,
            status: true,
          },
        },
      },
    });

    // Update scout's discovery count
    await prisma.scout.update({
      where: { id: scoutId },
      data: {
        artistDiscoveries: { increment: 1 },
      },
    });

    logger.info(
      `Artist discovery created: scout ${scoutId}, artist ${artist.id}`
    );

    return NextResponse.json({
      success: true,
      message: "Artist discovery submitted successfully",
      discovery: {
        id: discovery.id,
        scoutId: discovery.scoutId,
        artistId: discovery.artistId,
        discoverySource: discovery.discoverySource,
        status: discovery.status,
        createdAt: discovery.createdAt,
        artist: discovery.artist,
      },
    });
  } catch (error) {
    logger.error("Artist discovery submission failed", { error });

    return NextResponse.json(
      {
        error: "Artist discovery submission failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
