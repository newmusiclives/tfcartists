import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/api-key-auth";
import { prisma } from "@/lib/db";
import { stationToday } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/schedule
 * Public API: Returns today's schedule with DJ assignments.
 * Requires valid API key.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireApiKey(request);

  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error, timestamp: new Date().toISOString() },
      { status: authResult.status, headers: authResult.headers }
    );
  }

  try {
    const stationId = authResult.auth.stationId;

    // Get DJ shows for this station
    const djs = await prisma.dJ.findMany({
      where: { stationId },
      select: { id: true },
    });
    const djIds = djs.map((d) => d.id);

    const shows = await prisma.dJShow.findMany({
      where: { djId: { in: djIds }, isActive: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: {
        dj: { select: { id: true, name: true, slug: true, colorPrimary: true } },
      },
    });

    // Get clock assignments
    const assignments = await prisma.clockAssignment.findMany({
      where: { stationId, isActive: true },
      include: {
        dj: { select: { id: true, name: true } },
        clockTemplate: { select: { id: true, name: true, clockType: true } },
      },
    });

    // Get today's playlists
    const today = stationToday();
    const playlists = await prisma.hourPlaylist.findMany({
      where: {
        stationId,
        airDate: today,
        status: { in: ["locked", "aired"] },
      },
      orderBy: { hourOfDay: "asc" },
      select: {
        hourOfDay: true,
        status: true,
        djId: true,
      },
    });

    // Resolve DJ names for playlists
    const playlistDjIds = [...new Set(playlists.map((p) => p.djId))];
    const playlistDjs = playlistDjIds.length > 0
      ? await prisma.dJ.findMany({
          where: { id: { in: playlistDjIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const djMap = new Map(playlistDjs.map((d) => [d.id, d]));

    return NextResponse.json(
      {
        success: true,
        data: {
          date: today,
          shows: shows.map((s) => ({
            id: s.id,
            name: s.name,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            dj: {
              id: s.dj.id,
              name: s.dj.name,
              slug: s.dj.slug,
              color: s.dj.colorPrimary,
            },
          })),
          assignments: assignments.map((a) => ({
            id: a.id,
            dayType: a.dayType,
            timeSlotStart: a.timeSlotStart,
            timeSlotEnd: a.timeSlotEnd,
            dj: a.dj ? { id: a.dj.id, name: a.dj.name } : null,
            clockTemplate: a.clockTemplate
              ? { id: a.clockTemplate.id, name: a.clockTemplate.name, type: a.clockTemplate.clockType }
              : null,
          })),
          todayPlaylists: playlists.map((p) => {
            const pDj = djMap.get(p.djId);
            return {
              hour: p.hourOfDay,
              status: p.status,
              dj: pDj ? { name: pDj.name, slug: pDj.slug } : null,
            };
          }),
        },
        timestamp: new Date().toISOString(),
      },
      { headers: authResult.headers }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch schedule data",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: authResult.headers }
    );
  }
}
