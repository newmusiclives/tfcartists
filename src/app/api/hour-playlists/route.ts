import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { buildHourPlaylist } from "@/lib/radio/playlist-builder";
import { requireAuth } from "@/lib/api/auth";
import { verifyStationAccess } from "@/lib/db-scoped";
import { stationToday, stationDayType } from "@/lib/timezone";

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
    const session = await requireAuth();
    if (!session) return unauthorized();

    const body = await request.json();

    // Bulk regeneration mode: build all playlists for today
    if (body.regenerateToday) {
      const station = await prisma.station.findFirst({ where: { isActive: true } });
      if (!station) return NextResponse.json({ error: "No active station" }, { status: 404 });

      const today = stationToday();
      const dayType = stationDayType();

      const assignments = await prisma.clockAssignment.findMany({
        where: {
          stationId: station.id,
          isActive: true,
          dayType: { in: [dayType, "all"] },
        },
        include: { dj: { select: { id: true, name: true, isActive: true } } },
        orderBy: { timeSlotStart: "asc" },
      });

      const djUsedSongs = new Map<string, Set<string>>();
      let playlistsBuilt = 0;

      for (const assignment of assignments) {
        if (!assignment.dj?.isActive) continue;
        const startHour = parseInt(assignment.timeSlotStart.split(":")[0], 10);
        const endHour = parseInt(assignment.timeSlotEnd.split(":")[0], 10);

        if (!djUsedSongs.has(assignment.djId)) djUsedSongs.set(assignment.djId, new Set());
        const excludeSongIds = djUsedSongs.get(assignment.djId)!;

        for (let hour = startHour; hour < endHour; hour++) {
          // Skip already locked
          const existing = await prisma.hourPlaylist.findFirst({
            where: { stationId: station.id, djId: assignment.djId, airDate: today, hourOfDay: hour, status: { in: ["locked", "aired"] } },
          });
          if (existing) { playlistsBuilt++; continue; }

          const playlist = await buildHourPlaylist({
            stationId: station.id,
            djId: assignment.djId,
            clockTemplateId: assignment.clockTemplateId,
            airDate: today,
            hourOfDay: hour,
            excludeSongIds,
          });
          for (const slot of playlist.slots) { if (slot.songId) excludeSongIds.add(slot.songId); }

          await prisma.hourPlaylist.update({ where: { id: playlist.hourPlaylistId }, data: { status: "locked" } });
          playlistsBuilt++;
        }
      }

      return NextResponse.json({ success: true, playlistsBuilt, date: today.toISOString().split("T")[0] });
    }

    // Single-hour mode
    const { stationId, djId, clockTemplateId, airDate, hourOfDay } = body;

    if (!stationId || !djId || !clockTemplateId || !airDate || hourOfDay === undefined) {
      return NextResponse.json(
        { error: "stationId, djId, clockTemplateId, airDate, and hourOfDay are required" },
        { status: 400 }
      );
    }

    if (stationId && session) {
      const station = await verifyStationAccess(session, stationId);
      if (!station) return NextResponse.json({ error: "Station not found or access denied" }, { status: 404 });
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
