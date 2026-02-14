import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");
    const where: any = { ...(stationId && { stationId }) };

    const voices = await prisma.stationImagingVoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ voices });
  } catch (error) {
    return handleApiError(error, "/api/station-imaging");
  }
}

export async function POST(request: NextRequest) {
  try {
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
