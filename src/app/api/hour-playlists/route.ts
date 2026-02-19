import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { buildHourPlaylist } from "@/lib/radio/playlist-builder";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const stationId = sp.get("stationId");
    const djId = sp.get("djId");
    const date = sp.get("date");
    const hour = sp.get("hour");

    const where: Record<string, unknown> = {};
    if (stationId) where.stationId = stationId;
    if (djId) where.djId = djId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      where.airDate = d;
    }
    if (hour) where.hourOfDay = parseInt(hour, 10);

    const playlists = await prisma.hourPlaylist.findMany({
      where,
      orderBy: [{ airDate: "desc" }, { hourOfDay: "asc" }],
      include: { voiceTracks: true },
    });

    // Parse JSON slots for client
    const result = playlists.map((p) => ({
      ...p,
      slots: JSON.parse(p.slots),
    }));

    return NextResponse.json({ playlists: result });
  } catch (error) {
    return handleApiError(error, "/api/hour-playlists");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationId, djId, clockTemplateId, airDate, hourOfDay } = body;

    if (!stationId || !djId || !clockTemplateId || !airDate || hourOfDay === undefined) {
      return NextResponse.json(
        { error: "stationId, djId, clockTemplateId, airDate, and hourOfDay are required" },
        { status: 400 }
      );
    }

    const result = await buildHourPlaylist({
      stationId,
      djId,
      clockTemplateId,
      airDate: new Date(airDate),
      hourOfDay: parseInt(hourOfDay, 10),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/hour-playlists");
  }
}
