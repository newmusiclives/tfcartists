import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole, pickFields } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = [
  "title", "artistName", "albumName", "genre", "bpm", "durationSeconds",
  "energy", "mood", "vocalGender", "rotationCategory", "isActive",
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const song = await prisma.song.findUnique({ where: { id } });
    if (!song) return NextResponse.json({ error: "Song not found" }, { status: 404 });
    return NextResponse.json({ song });
  } catch (error) {
    return handleApiError(error, "/api/station-songs/[id]");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("admin", "cassidy");
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const song = await prisma.song.update({ where: { id }, data: pickFields(body, ALLOWED_FIELDS) });
    return NextResponse.json({ song });
  } catch (error) {
    return handleApiError(error, "/api/station-songs/[id]");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("admin");
    if (!session) return unauthorized();

    const { id } = await params;
    await prisma.song.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/station-songs/[id]");
  }
}
