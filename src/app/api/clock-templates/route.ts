import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");
    const where: any = { ...(stationId && { stationId }) };

    const templates = await prisma.clockTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { assignments: true } },
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    return handleApiError(error, "/api/clock-templates");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationId, name, ...rest } = body;

    if (!stationId || !name) {
      return NextResponse.json({ error: "Missing required fields: stationId, name" }, { status: 400 });
    }

    const template = await prisma.clockTemplate.create({
      data: { stationId, name, ...rest },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/clock-templates");
  }
}
