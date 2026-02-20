import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { withPagination } from "@/lib/api/helpers";
import { requireRole } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stationId = searchParams.get("stationId");
    const category = searchParams.get("category");
    const vocalGender = searchParams.get("vocalGender");
    const { page, limit, skip, search } = withPagination(searchParams);

    const where: any = {
      ...(stationId && { stationId }),
      ...(category && { rotationCategory: category }),
      ...(vocalGender && { vocalGender }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { artistName: { contains: search } },
        ],
      }),
    };

    const [songs, total] = await Promise.all([
      prisma.song.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.song.count({ where }),
    ]);

    return NextResponse.json({
      songs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error, "/api/station-songs");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("admin", "cassidy");
    if (!session) return unauthorized();

    const body = await request.json();
    const { stationId, title, artistName, ...rest } = body;

    if (!stationId || !title || !artistName) {
      return NextResponse.json({ error: "Missing required fields: stationId, title, artistName" }, { status: 400 });
    }

    const song = await prisma.song.create({
      data: { stationId, title, artistName, ...rest },
    });

    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/station-songs");
  }
}
