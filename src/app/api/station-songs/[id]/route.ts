import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

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
    const { id } = await params;
    const body = await request.json();
    const song = await prisma.song.update({ where: { id }, data: body });
    return NextResponse.json({ song });
  } catch (error) {
    return handleApiError(error, "/api/station-songs/[id]");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.song.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/station-songs/[id]");
  }
}
