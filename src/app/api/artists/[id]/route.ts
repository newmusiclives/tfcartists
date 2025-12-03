import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/artists/[id]
 * Get a specific artist with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
        shows: {
          orderBy: { date: "desc" },
        },
        donations: {
          orderBy: { createdAt: "desc" },
        },
        referrals: true,
      },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    return NextResponse.json({ artist });
  } catch (error) {
    logger.error("Error fetching artist", { error });
    return NextResponse.json({ error: "Failed to fetch artist" }, { status: 500 });
  }
}

/**
 * PATCH /api/artists/[id]
 * Update an artist's information
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const artist = await prisma.artist.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ artist });
  } catch (error) {
    logger.error("Error updating artist", { error });
    return NextResponse.json({ error: "Failed to update artist" }, { status: 500 });
  }
}
