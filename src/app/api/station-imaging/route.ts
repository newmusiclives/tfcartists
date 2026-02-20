import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");
    const where: any = { ...(stationId && { stationId }) };

    const voices = await prisma.stationImagingVoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ voices });
  } catch (error) {
    return handleApiError(error, "/api/station-imaging");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session) return unauthorized();

    const body = await request.json();
    const { stationId, displayName, ...rest } = body;

    if (!stationId || !displayName) {
      return NextResponse.json({ error: "Missing required fields: stationId, displayName" }, { status: 400 });
    }

    const voice = await prisma.stationImagingVoice.create({
      data: { stationId, displayName, ...rest },
    });

    return NextResponse.json({ voice }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/station-imaging");
  }
}
