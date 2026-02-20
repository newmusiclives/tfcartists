import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAdmin, pickFields } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = [
  "name", "callSign", "tagline", "description", "genre", "formatType",
  "musicEra", "primaryColor", "secondaryColor", "logoUrl", "streamUrl",
  "backupStreamUrl", "crossfadeDuration", "audioNormalization",
  "compressionRatio", "eqPreset", "duckingLevel",
];

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
    const session = await requireAdmin();
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const station = await prisma.station.update({ where: { id }, data: pickFields(body, ALLOWED_FIELDS) });
    return NextResponse.json({ station });
  } catch (error) {
    return handleApiError(error, "/api/stations/[id]");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorized();

    const { id } = await params;
    await prisma.station.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/stations/[id]");
  }
}
