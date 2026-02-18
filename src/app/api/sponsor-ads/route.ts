import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");
    const action = request.nextUrl.searchParams.get("action");

    if (!stationId) {
      return NextResponse.json(
        { error: "stationId is required" },
        { status: 400 }
      );
    }

    // Round-robin: return the next ad to play
    if (action === "next") {
      const nextAd = await prisma.sponsorAd.findFirst({
        where: { stationId, isActive: true },
        orderBy: [
          { lastPlayedAt: { sort: "asc", nulls: "first" } },
          { playCount: "asc" },
        ],
        include: { musicBed: true },
      });

      if (!nextAd) {
        return NextResponse.json({ ad: null });
      }

      return NextResponse.json({ ad: nextAd });
    }

    // Default: list all sponsor ads
    const sponsorAds = await prisma.sponsorAd.findMany({
      where: { stationId },
      orderBy: { createdAt: "desc" },
      include: { musicBed: true },
    });

    return NextResponse.json({ sponsorAds });
  } catch (error) {
    return handleApiError(error, "/api/sponsor-ads");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      stationId,
      sponsorName,
      adTitle,
      scriptText,
      musicBedId,
      durationSeconds,
      tier,
      weight,
      sponsorId,
    } = body;

    if (!stationId || !sponsorName || !adTitle) {
      return NextResponse.json(
        { error: "stationId, sponsorName, and adTitle are required" },
        { status: 400 }
      );
    }

    const ad = await prisma.sponsorAd.create({
      data: {
        stationId,
        sponsorName,
        adTitle,
        scriptText: scriptText || null,
        musicBedId: musicBedId || null,
        durationSeconds: durationSeconds || null,
        tier: tier || "bronze",
        weight: weight || 1,
        sponsorId: sponsorId || null,
      },
      include: { musicBed: true },
    });

    return NextResponse.json({ ad }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/sponsor-ads");
  }
}
