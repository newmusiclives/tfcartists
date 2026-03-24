import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { withRateLimit } from "@/lib/rate-limit/limiter";
import { z } from "zod";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  songTitle: z.string().min(1, "Song title is required").max(200),
  artistName: z.string().min(1).max(200),
  songId: z.string().optional(),
  listenerName: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
});

/**
 * Resolve station from the slug (stationCode).
 * Only returns artist-mode stations.
 */
async function resolveStation(slug: string) {
  return prisma.station.findFirst({
    where: {
      stationCode: slug,
      stationMode: "artist",
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, name: true },
  });
}

/**
 * GET /api/artist-station/[slug]/request — List recent song requests
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const station = await resolveStation(slug);

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    const statusFilter = request.nextUrl.searchParams.get("status");
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") || "20", 10),
      100
    );

    const where: Record<string, unknown> = {
      stationId: station.id,
    };

    if (statusFilter) {
      where.status = statusFilter;
    }

    const requests = await prisma.songRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        songTitle: true,
        artistName: true,
        listenerName: true,
        message: true,
        status: true,
        createdAt: true,
        playedAt: true,
      },
    });

    return NextResponse.json({
      station: station.name,
      requests,
      count: requests.length,
    });
  } catch (error) {
    return handleApiError(error, "/api/artist-station/[slug]/request");
  }
}

/**
 * POST /api/artist-station/[slug]/request — Submit a fan song request
 *
 * Public endpoint, rate-limited. No auth required.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Rate limit: prevent spam
    const rateLimitResponse = await withRateLimit(request, "api");
    if (rateLimitResponse) return rateLimitResponse;

    const { slug } = await params;
    const station = await resolveStation(slug);

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check for duplicate requests (same song in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const duplicate = await prisma.songRequest.findFirst({
      where: {
        stationId: station.id,
        songTitle: parsed.data.songTitle,
        artistName: parsed.data.artistName,
        createdAt: { gte: oneHourAgo },
        status: { in: ["pending", "queued"] },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "This song was already requested recently", existingRequest: duplicate },
        { status: 409 }
      );
    }

    // If songId is provided, verify it exists in the station library
    if (parsed.data.songId) {
      const song = await prisma.song.findFirst({
        where: {
          id: parsed.data.songId,
          stationId: station.id,
          isActive: true,
        },
        select: { id: true, title: true, artistName: true },
      });

      if (!song) {
        // Song not in library — still accept as free-text request
        // but clear the songId
        parsed.data.songId = undefined;
      }
    }

    const songRequest = await prisma.songRequest.create({
      data: {
        stationId: station.id,
        songTitle: parsed.data.songTitle,
        artistName: parsed.data.artistName,
        songId: parsed.data.songId || null,
        listenerName: parsed.data.listenerName || null,
        message: parsed.data.message || null,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        request: {
          id: songRequest.id,
          songTitle: songRequest.songTitle,
          artistName: songRequest.artistName,
          status: songRequest.status,
          createdAt: songRequest.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "/api/artist-station/[slug]/request");
  }
}
