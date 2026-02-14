import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");
    const where: any = { ...(stationId && { stationId }) };

    const djs = await prisma.dJ.findMany({
      where,
      orderBy: { priority: "asc" },
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
