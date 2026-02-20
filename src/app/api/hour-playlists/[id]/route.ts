import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const { id } = await params;

    const playlist = await prisma.hourPlaylist.findUnique({
      where: { id },
      include: { voiceTracks: true },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...playlist,
      slots: JSON.parse(playlist.slots),
    });
  } catch (error) {
    return handleApiError(error, "/api/hour-playlists/[id]");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["draft", "locked", "aired", "expired"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status required: draft, locked, aired, expired" },
        { status: 400 }
      );
    }

    const playlist = await prisma.hourPlaylist.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      ...playlist,
      slots: JSON.parse(playlist.slots),
    });
  } catch (error) {
    return handleApiError(error, "/api/hour-playlists/[id]");
  }
}
