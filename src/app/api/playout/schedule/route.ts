import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stationDayType, stationHour, stationNow } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * GET /api/playout/schedule — diagnostic endpoint showing the full DJ schedule
 * for today, the current hour's assigned DJ, and any overlapping assignments.
 *
 * Use this to verify ClockAssignment data when DJs appear at wrong times.
 */
export async function GET() {
  const station = await prisma.station.findFirst({ select: { id: true, name: true } });
  if (!station) {
    return NextResponse.json({ error: "No station found" }, { status: 404 });
  }

  const dayType = stationDayType();
  const currentHour = stationHour();
  const now = stationNow();

  const assignments = await prisma.clockAssignment.findMany({
    where: {
      stationId: station.id,
      isActive: true,
      dayType: { in: [dayType, "all"] },
    },
    include: {
      dj: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { timeSlotStart: "asc" },
  });

  // Expand into per-hour schedule
  const hourSchedule: Array<{
    hour: number;
    djName: string;
    djSlug: string;
    timeSlot: string;
    priority: number;
    assignmentId: string;
    isCurrent: boolean;
  }> = [];

  const hourDjMap = new Map<number, Array<{ djName: string; djSlug: string; priority: number; timeSlot: string; assignmentId: string }>>();

  for (const a of assignments) {
    if (!a.dj) continue;
    const start = parseInt(a.timeSlotStart.split(":")[0], 10);
    const end = parseInt(a.timeSlotEnd.split(":")[0], 10);
    const total = end > start ? end - start : (24 - start) + end;

    for (let i = 0; i < total; i++) {
      const hour = (start + i) % 24;
      if (!hourDjMap.has(hour)) hourDjMap.set(hour, []);
      hourDjMap.get(hour)!.push({
        djName: a.dj.name,
        djSlug: a.dj.slug,
        priority: a.priority,
        timeSlot: `${a.timeSlotStart}-${a.timeSlotEnd}`,
        assignmentId: a.id,
      });
    }
  }

  // Build schedule sorted by hour, flag overlaps
  const overlaps: string[] = [];
  for (let h = 0; h < 24; h++) {
    const djs = hourDjMap.get(h) || [];
    // Sort by priority desc
    djs.sort((a, b) => b.priority - a.priority);

    if (djs.length > 1) {
      overlaps.push(
        `Hour ${h}: ${djs.map((d) => `${d.djName} (pri=${d.priority}, ${d.timeSlot})`).join(" vs ")}`
      );
    }

    for (const dj of djs) {
      hourSchedule.push({
        hour: h,
        djName: dj.djName,
        djSlug: dj.djSlug,
        timeSlot: dj.timeSlot,
        priority: dj.priority,
        assignmentId: dj.assignmentId,
        isCurrent: h === currentHour,
      });
    }
  }

  // Who should be on now
  const currentDjs = hourDjMap.get(currentHour) || [];
  currentDjs.sort((a, b) => b.priority - a.priority);

  return NextResponse.json({
    station: station.name,
    dayType,
    currentMountainTime: now.toISOString().replace("T", " ").substring(0, 19),
    currentHour,
    currentDj: currentDjs.length > 0 ? currentDjs[0] : null,
    overlaps: overlaps.length > 0 ? overlaps : "none",
    schedule: hourSchedule,
    rawAssignments: assignments.map((a) => ({
      id: a.id,
      djName: a.dj?.name,
      djSlug: a.dj?.slug,
      dayType: a.dayType,
      timeSlotStart: a.timeSlotStart,
      timeSlotEnd: a.timeSlotEnd,
      priority: a.priority,
      isActive: a.isActive,
    })),
  });
}
