import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// GET — return stream configuration for a station
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const station = await prisma.station.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        streamUrl: true,
        backupStreamUrl: true,
        streamFormat: true,
        streamBitrate: true,
        isActive: true,
      },
    });

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    return NextResponse.json({ stream: station });
  } catch (error) {
    return handleApiError(error, "/api/stations/[id]/stream");
  }
}

// PATCH — update stream configuration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const body = await request.json();
    const { streamUrl, backupStreamUrl, streamFormat, streamBitrate } = body;

    const updated = await prisma.station.update({
      where: { id },
      data: {
        ...(streamUrl !== undefined && { streamUrl }),
        ...(backupStreamUrl !== undefined && { backupStreamUrl }),
        ...(streamFormat !== undefined && { streamFormat }),
        ...(streamBitrate !== undefined && { streamBitrate }),
      },
      select: {
        id: true,
        name: true,
        streamUrl: true,
        backupStreamUrl: true,
        streamFormat: true,
        streamBitrate: true,
      },
    });

    return NextResponse.json({ stream: updated });
  } catch (error) {
    return handleApiError(error, "/api/stations/[id]/stream");
  }
}
