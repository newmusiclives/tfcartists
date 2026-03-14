import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// List episodes for a station
export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");

    if (!stationId) {
      return NextResponse.json(
        { error: "stationId is required" },
        { status: 400 }
      );
    }

    const episodes = await prisma.podcastEpisode.findMany({
      where: { stationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ episodes });
  } catch (error) {
    return handleApiError(error);
  }
}

// Create a new episode
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationId, title, description, audioFilePath, duration, episodeType, publishedAt } = body;

    if (!stationId || !title) {
      return NextResponse.json(
        { error: "stationId and title are required" },
        { status: 400 }
      );
    }

    // Validate episodeType
    const validTypes = ["HOURLY_REPLAY", "WEEKLY_BEST_OF", "CUSTOM"];
    if (episodeType && !validTypes.includes(episodeType)) {
      return NextResponse.json(
        { error: `episodeType must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const episode = await prisma.podcastEpisode.create({
      data: {
        stationId,
        title,
        description: description || null,
        audioFilePath: audioFilePath || null,
        duration: duration ? parseInt(String(duration), 10) : null,
        episodeType: episodeType || "CUSTOM",
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });

    return NextResponse.json({ episode }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// Update an episode
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, audioFilePath, duration, episodeType, publishedAt } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const validTypes = ["HOURLY_REPLAY", "WEEKLY_BEST_OF", "CUSTOM"];
    if (episodeType && !validTypes.includes(episodeType)) {
      return NextResponse.json(
        { error: `episodeType must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const episode = await prisma.podcastEpisode.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(audioFilePath !== undefined && { audioFilePath }),
        ...(duration !== undefined && { duration: duration ? parseInt(String(duration), 10) : null }),
        ...(episodeType !== undefined && { episodeType }),
        ...(publishedAt !== undefined && { publishedAt: publishedAt ? new Date(publishedAt) : null }),
      },
    });

    return NextResponse.json({ episode });
  } catch (error) {
    return handleApiError(error);
  }
}

// Delete an episode
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await prisma.podcastEpisode.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
