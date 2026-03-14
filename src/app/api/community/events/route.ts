import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, optionalAuth, getOrgScope } from "@/lib/api/auth";
import { handleApiError, unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await optionalAuth();
    const orgScope = session ? getOrgScope(session) : {};
    const stationId = request.nextUrl.searchParams.get("stationId");
    const upcoming = request.nextUrl.searchParams.get("upcoming") === "true";

    const where: any = {
      isActive: true,
      ...(stationId && { stationId }),
      ...(upcoming && { startDate: { gte: new Date() } }),
      ...(orgScope.organizationId && { station: { organizationId: orgScope.organizationId } }),
    };

    const events = await prisma.communityEvent.findMany({
      where,
      orderBy: { startDate: "asc" },
      take: 50,
    });

    return NextResponse.json({ events });
  } catch (error) {
    return handleApiError(error, "/api/community/events");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const body = await request.json();
    const { stationId, title, description, location, startDate, endDate, isAllDay, category, sponsorId, announceOnAir, announcementScript } = body;

    if (!stationId || !title || !startDate) {
      return NextResponse.json({ error: "stationId, title, and startDate are required" }, { status: 400 });
    }

    const event = await prisma.communityEvent.create({
      data: {
        stationId,
        title,
        description,
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isAllDay: isAllDay || false,
        category: category || "general",
        sponsorId,
        announceOnAir: announceOnAir !== false,
        announcementScript,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/community/events");
  }
}
