import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const hourPlaylistId = sp.get("hourPlaylistId");
    const stationId = sp.get("stationId");
    const djId = sp.get("djId");
    const date = sp.get("date");
    const hour = sp.get("hour");

    const where: Record<string, unknown> = {};
    if (hourPlaylistId) where.hourPlaylistId = hourPlaylistId;
    if (stationId) where.stationId = stationId;
    if (djId) where.djId = djId;
    if (date) where.airDate = new Date(date);
    if (hour) where.hourOfDay = parseInt(hour, 10);

    const voiceTracks = await prisma.voiceTrack.findMany({
      where,
      orderBy: [{ airDate: "asc" }, { hourOfDay: "asc" }, { position: "asc" }],
    });

    return NextResponse.json({ voiceTracks });
  } catch (error) {
    return handleApiError(error, "/api/voice-tracks");
  }
}
