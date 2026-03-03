import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAdmin, pickFields, getOrgScope } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = [
  "name", "callSign", "tagline", "description", "genre", "formatType",
  "musicEra", "primaryColor", "secondaryColor", "logoUrl", "streamUrl",
  "backupStreamUrl", "crossfadeDuration", "audioNormalization",
  "compressionRatio", "eqPreset", "duckingLevel", "metadata",
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const station = await prisma.station.findUnique({
      where: { id, deletedAt: null },
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

    // Optimistic locking: check version matches before updating
    if (body.version !== undefined) {
      const current = await prisma.station.findUnique({
        where: { id, deletedAt: null },
        select: { version: true },
      });
      if (!current) {
        return NextResponse.json({ error: "Station not found" }, { status: 404 });
      }
      if (current.version !== body.version) {
        return NextResponse.json(
          { error: "Conflict: station was modified by another user. Please refresh and try again.", currentVersion: current.version },
          { status: 409 }
        );
      }
    }

    const data = pickFields(body, ALLOWED_FIELDS);
    const station = await prisma.station.update({
      where: { id, deletedAt: null },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
    return NextResponse.json({ station });
  } catch (error) {
    return handleApiError(error, "/api/stations/[id]");
  }
}

/**
 * DELETE /api/stations/[id]
 * Soft-deletes the station (sets deletedAt instead of destroying data).
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorized();

    const { id } = await params;

    // Soft delete: set deletedAt timestamp instead of destroying
    await prisma.station.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/stations/[id]");
  }
}
