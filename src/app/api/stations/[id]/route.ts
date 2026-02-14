import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const station = await prisma.station.findUnique({
      where: { id },
      include: {
        songs: { where: { isActive: true }, take: 10, orderBy: { createdAt: "desc" } },
        clockTemplates: { where: { isActive: true } },
        stationDJs: { where: { isActive: true } },
        imagingVoices: { where: { isActive: true } },
        _count: {
          select: { songs: true, clockTemplates: true, stationDJs: true, clockAssignments: true, imagingVoices: true },
        },
      },
    });
    if (!station) return NextResponse.json({ error: "Station not found" }, { status: 404 });
    return NextResponse.json({ station });
  } catch (error) {
    return handleApiError(error, "/api/stations/[id]");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const station = await prisma.station.update({ where: { id }, data: body });
    return NextResponse.json({ station });
  } catch (error) {
    return handleApiError(error, "/api/stations/[id]");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.station.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/stations/[id]");
  }
}
