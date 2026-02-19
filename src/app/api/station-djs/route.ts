import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");
    const where: any = { ...(stationId && { stationId }) };

    const djs = await prisma.dJ.findMany({
      where,
      orderBy: { priority: "asc" },
      take: 200,
      include: {
        shows: { where: { isActive: true }, select: { id: true, name: true, dayOfWeek: true, startTime: true, endTime: true } },
        _count: { select: { clockAssignments: true } },
      },
    });

    return NextResponse.json({ djs });
  } catch (error) {
    return handleApiError(error, "/api/station-djs");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session) return unauthorized();

    const body = await request.json();
    const { name, slug, bio, stationId, ...rest } = body;

    if (!name || !bio) {
      return NextResponse.json({ error: "Missing required fields: name, bio" }, { status: 400 });
    }

    const djSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const dj = await prisma.dJ.create({
      data: { name, slug: djSlug, bio, stationId, ...rest },
    });

    return NextResponse.json({ dj }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/station-djs");
  }
}
