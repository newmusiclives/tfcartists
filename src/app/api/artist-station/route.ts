import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { optionalAuth, requireAuth, getOrgScope } from "@/lib/api/auth";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  artistId: z.string().min(1, "artistId is required"),
  name: z.string().min(1).max(200).optional(),
  tagline: z.string().max(300).optional(),
  genre: z.string().max(100).optional(),
  stationCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  primaryColor: z.string().max(20).optional(),
  secondaryColor: z.string().max(20).optional(),
  streamUrl: z.string().url().optional(),
});

/**
 * GET /api/artist-station — List artist stations
 *
 * Query params:
 *   - slug: filter by stationCode
 *   - artistId: filter by artistOwnerId
 */
export async function GET(request: NextRequest) {
  try {
    const session = await optionalAuth();
    const slug = request.nextUrl.searchParams.get("slug");
    const artistId = request.nextUrl.searchParams.get("artistId");

    const where: Record<string, unknown> = {
      stationMode: "artist",
      isActive: true,
      deletedAt: null,
    };

    if (slug) {
      where.stationCode = slug;
    }

    if (artistId) {
      where.artistOwnerId = artistId;
    }

    // If authenticated, scope to org
    if (session) {
      const orgScope = getOrgScope(session);
      if (orgScope.organizationId) {
        where.organizationId = orgScope.organizationId;
      }
    }

    const stations = await prisma.station.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        stationCode: true,
        tagline: true,
        description: true,
        genre: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        streamUrl: true,
        stationMode: true,
        artistOwnerId: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Enrich with artist data
    const enriched = await Promise.all(
      stations.map(async (station) => {
        let artistName = station.name;
        let artistBio: string | null = null;
        let artistImageUrl: string | null = null;

        if (station.artistOwnerId) {
          const artist = await prisma.artist.findUnique({
            where: { id: station.artistOwnerId },
            select: { name: true, bio: true, sourceUrl: true },
          });
          if (artist) {
            artistName = artist.name;
            artistBio = artist.bio;
            artistImageUrl = artist.sourceUrl;
          }
        }

        return {
          ...station,
          slug: station.stationCode,
          artistName,
          artistBio,
          artistImageUrl,
        };
      })
    );

    return NextResponse.json({ stations: enriched });
  } catch (error) {
    return handleApiError(error, "/api/artist-station");
  }
}

/**
 * POST /api/artist-station — Create an artist station
 *
 * Takes an artistId and creates a Station with stationMode="artist".
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { artistId, name, tagline, genre, stationCode, primaryColor, secondaryColor, streamUrl } =
      parsed.data;

    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true, genre: true, organizationId: true },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Check for existing artist station
    const existing = await prisma.station.findFirst({
      where: {
        stationMode: "artist",
        artistOwnerId: artistId,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Artist station already exists", station: { id: existing.id, stationCode: existing.stationCode } },
        { status: 409 }
      );
    }

    // Generate slug from artist name if not provided
    const slug =
      stationCode ||
      artist.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Ensure slug uniqueness
    const slugExists = await prisma.station.findUnique({
      where: { stationCode: slug },
    });

    const finalSlug = slugExists ? `${slug}-${Date.now().toString(36)}` : slug;

    const station = await prisma.station.create({
      data: {
        name: name || `${artist.name} Radio`,
        stationCode: finalSlug,
        stationMode: "artist",
        artistOwnerId: artistId,
        tagline: tagline || `The sound of ${artist.name}`,
        genre: genre || artist.genre || "Mixed",
        primaryColor: primaryColor || "#7c3aed",
        secondaryColor: secondaryColor || "#a78bfa",
        streamUrl: streamUrl || null,
        organizationId: artist.organizationId || null,
        // Artist stations have smaller defaults
        maxTracksPerMonth: 2880, // 4 tracks/hour * 24h * 30d
        maxAdsPerMonth: 0,
        maxArtistCapacity: 20,
        maxSponsorCapacity: 0,
        targetDAU: 100,
      },
    });

    return NextResponse.json(
      {
        station: {
          id: station.id,
          name: station.name,
          stationCode: station.stationCode,
          stationMode: station.stationMode,
          artistOwnerId: station.artistOwnerId,
          genre: station.genre,
          primaryColor: station.primaryColor,
          secondaryColor: station.secondaryColor,
          isActive: station.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "/api/artist-station");
  }
}
