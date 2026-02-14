import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");

    // Get all DJ shows with DJ info
    const where: any = {};
    if (stationId) {
      // Get DJs for this station, then their shows
      const djs = await prisma.dJ.findMany({ where: { stationId }, select: { id: true } });
      const djIds = djs.map((d) => d.id);
      where.djId = { in: djIds };
    }

    const shows = await prisma.dJShow.findMany({
      where: { ...where, isActive: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: {
        dj: { select: { id: true, name: true, slug: true, colorPrimary: true } },
      },
    });

    // Get clock assignments
    const assignmentWhere: any = stationId ? { stationId } : {};
    const assignments = await prisma.clockAssignment.findMany({
      where: { ...assignmentWhere, isActive: true },
      include: {
        dj: { select: { id: true, name: true } },
        clockTemplate: { select: { id: true, name: true, clockType: true } },
      },
    });

    return NextResponse.json({ shows, assignments });
  } catch (error) {
    return handleApiError(error, "/api/station-schedule");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationId, schedule } = body;

    if (!stationId || !Array.isArray(schedule)) {
      return NextResponse.json({ error: "Missing required: stationId and schedule array" }, { status: 400 });
    }

    // Bulk update: delete existing assignments for this station and recreate
    await prisma.clockAssignment.deleteMany({ where: { stationId } });

    const created: any[] = [];
    for (const item of schedule) {
      if (item.djId && item.clockTemplateId && item.timeSlotStart && item.timeSlotEnd) {
        const assignment = await prisma.clockAssignment.create({
          data: {
            stationId,
            djId: item.djId,
            clockTemplateId: item.clockTemplateId,
            dayType: item.dayType || "all",
            timeSlotStart: item.timeSlotStart,
            timeSlotEnd: item.timeSlotEnd,
            priority: item.priority || 0,
          },
        });
        created.push(assignment);
      }
    }

    return NextResponse.json({ assignments: created, count: created.length });
  } catch (error) {
    return handleApiError(error, "/api/station-schedule");
  }
}
