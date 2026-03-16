import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const station = await prisma.station.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!station) {
      return NextResponse.json([]);
    }

    const assignments = await prisma.clockAssignment.findMany({
      where: { stationId: station.id },
      include: {
        dj: { select: { id: true, name: true, slug: true } },
        clockTemplate: { select: { id: true, name: true } },
      },
      orderBy: { timeSlotStart: "asc" },
    });

    const result = assignments.map((a) => ({
      id: a.id,
      station_id: a.stationId,
      dj_id: a.djId,
      dj_name: a.dj.name,
      dj_slug: a.dj.slug,
      clock_template_id: a.clockTemplateId,
      clock_template_name: a.clockTemplate.name,
      day_type: a.dayType,
      time_slot_start: a.timeSlotStart,
      time_slot_end: a.timeSlotEnd,
      priority: a.priority,
      is_active: a.isActive,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clock assignments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();
    const body = await request.json();

    const station = await prisma.station.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!station) {
      return NextResponse.json({ error: "No active station" }, { status: 404 });
    }

    const assignment = await prisma.clockAssignment.create({
      data: {
        stationId: body.station_id || station.id,
        djId: body.dj_id,
        clockTemplateId: body.clock_template_id,
        dayType: body.day_type || "all",
        timeSlotStart: body.time_slot_start,
        timeSlotEnd: body.time_slot_end,
        priority: body.priority || 0,
        isActive: body.is_active ?? true,
      },
    });

    return NextResponse.json({
      id: assignment.id,
      message: "Assignment created",
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create clock assignment" }, { status: 500 });
  }
}
