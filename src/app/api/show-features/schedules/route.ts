import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

// GET schedules (no auth — matches /api/stations pattern)
export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");
    if (!stationId) {
      return NextResponse.json({ error: "stationId required" }, { status: 400 });
    }

    const schedules = await prisma.featureSchedule.findMany({
      where: { stationId },
      include: { featureType: { select: { name: true, category: true, trackPlacement: true } } },
      orderBy: [{ djName: "asc" }, { priority: "desc" }],
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    return handleApiError(error, "/api/show-features/schedules");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const body = await request.json();

    if (body.action === "seed-schedules") {
      const { stationId, schedules: items } = body;
      let count = 0;
      for (const s of items) {
        await prisma.featureSchedule.create({
          data: {
            stationId,
            featureTypeId: s.featureTypeId,
            djId: s.djId || null,
            djName: s.djName,
            frequencyPerShow: s.frequencyPerShow || 1,
            minSongsBetween: s.minSongsBetween || 3,
            priority: s.priority || 5,
          },
        });
        count++;
      }
      return NextResponse.json({ seeded: count });
    }

    const { stationId, featureTypeId, djId, djName, frequencyPerShow, minSongsBetween, priority } = body;
    if (!stationId || !featureTypeId || !djName) {
      return NextResponse.json({ error: "stationId, featureTypeId, djName required" }, { status: 400 });
    }

    const schedule = await prisma.featureSchedule.create({
      data: { stationId, featureTypeId, djId, djName, frequencyPerShow: frequencyPerShow || 1, minSongsBetween: minSongsBetween || 3, priority: priority || 5 },
      include: { featureType: { select: { name: true, category: true, trackPlacement: true } } },
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/show-features/schedules");
  }
}
