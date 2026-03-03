import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAdmin, requireAuth, getOrgScope } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Public GET for station switcher, but scoped by org for authenticated users
    const session = await requireAuth();
    const orgScope = session ? getOrgScope(session) : {};

    const stations = await prisma.station.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        ...orgScope,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        _count: {
          select: {
            songs: true,
            clockTemplates: true,
            stationDJs: true,
            imagingVoices: true,
          },
        },
      },
    });
    return NextResponse.json({ stations });
  } catch (error) {
    return handleApiError(error, "/api/stations");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorized();

    const body = await request.json();
    const { name, callSign, tagline, description, genre, stationCode, formatType, musicEra, ownerName, ownerEmail, primaryColor, secondaryColor, logoUrl, organizationId } = body;

    if (!name || !genre) {
      return NextResponse.json({ error: "Missing required fields: name, genre" }, { status: 400 });
    }

    // If operator, auto-assign their org. Super-admin can specify.
    const orgId = session.user.organizationId || organizationId || null;

    const station = await prisma.station.create({
      data: {
        name,
        callSign,
        tagline,
        description,
        genre,
        stationCode: stationCode || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        formatType,
        musicEra,
        ownerName,
        ownerEmail,
        primaryColor,
        secondaryColor,
        logoUrl,
        organizationId: orgId,
      },
    });

    return NextResponse.json({ station }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/stations");
  }
}
