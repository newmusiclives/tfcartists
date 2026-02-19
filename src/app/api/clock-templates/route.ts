import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");
    const where: any = { ...(stationId && { stationId }) };

    const templates = await prisma.clockTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
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
    const session = await requireRole("admin");
    if (!session) return unauthorized();

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
