import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  try {
    const stations = await prisma.station.findMany({
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
    const { name, callSign, tagline, description, genre, stationCode, formatType, musicEra, ownerName, ownerEmail, primaryColor, secondaryColor, logoUrl } = body;

    if (!name || !genre) {
      return NextResponse.json({ error: "Missing required fields: name, genre" }, { status: 400 });
    }

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
      },
    });

    return NextResponse.json({ station }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/stations");
  }
}
