import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";

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

    // Weighted round-robin: pick the most overdue ad and auto-mark as played
    if (action === "next") {
      const activeAds = await prisma.sponsorAd.findMany({
        where: { stationId, isActive: true },
        include: { musicBed: true },
      });

      if (activeAds.length === 0) {
        return NextResponse.json({ ad: null });
      }

      // Score each ad: playCount / weight (lower = more overdue)
      // Among tied scores, prefer oldest lastPlayedAt (nulls first)
      activeAds.sort((a, b) => {
        const scoreA = a.playCount / (a.weight || 1);
        const scoreB = b.playCount / (b.weight || 1);
        if (scoreA !== scoreB) return scoreA - scoreB;
        // Nulls (never played) come first
        if (!a.lastPlayedAt && b.lastPlayedAt) return -1;
        if (a.lastPlayedAt && !b.lastPlayedAt) return 1;
        if (a.lastPlayedAt && b.lastPlayedAt) {
          return a.lastPlayedAt.getTime() - b.lastPlayedAt.getTime();
        }
        return 0;
      });

      const chosen = activeAds[0];

      // Auto-mark as played
      const updatedAd = await prisma.sponsorAd.update({
        where: { id: chosen.id },
        data: {
          playCount: { increment: 1 },
          lastPlayedAt: new Date(),
        },
        include: { musicBed: true },
      });

      return NextResponse.json({ ad: updatedAd });
    }

    // Default: list all sponsor ads
    const sponsorAds = await prisma.sponsorAd.findMany({
      where: { stationId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { musicBed: true },
    });

    return NextResponse.json({ sponsorAds });
  } catch (error) {
    return handleApiError(error, "/api/sponsor-ads");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("admin", "harper");
    if (!session) return unauthorized();

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
