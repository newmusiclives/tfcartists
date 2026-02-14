import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");
    const djId = request.nextUrl.searchParams.get("djId");
    const where: any = {
      ...(stationId && { stationId }),
      ...(djId && { djId }),
    };

    const assignments = await prisma.clockAssignment.findMany({
      where,
      orderBy: { timeSlotStart: "asc" },
      include: {
        dj: { select: { id: true, name: true, slug: true } },
        clockTemplate: { select: { id: true, name: true, clockType: true } },
      },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    return handleApiError(error, "/api/clock-assignments");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationId, djId, clockTemplateId, dayType, timeSlotStart, timeSlotEnd } = body;

    if (!stationId || !djId || !clockTemplateId || !timeSlotStart || !timeSlotEnd) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const assignment = await prisma.clockAssignment.create({
      data: { stationId, djId, clockTemplateId, dayType: dayType || "all", timeSlotStart, timeSlotEnd },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/clock-assignments");
  }
}
