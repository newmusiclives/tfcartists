import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const PRODUCTION_FIELDS = {
  // Stream config
  streamUrl: true,
  backupStreamUrl: true,
  streamBitrate: true,
  streamFormat: true,
  // Crossfade
  crossfadeEnabled: true,
  crossfadeDuration: true,
  crossfadeStartNext: true,
  crossfadeFadeIn: true,
  crossfadeFadeOut: true,
  crossfadeCurve: true,
  // Normalization
  normalizationEnabled: true,
  normalizationTarget: true,
  normalizationWindow: true,
  normalizationGainMax: true,
  normalizationGainMin: true,
  // Compression
  compressionEnabled: true,
  compressionAttack: true,
  compressionRelease: true,
  compressionRatio: true,
  compressionThreshold: true,
  compressionKnee: true,
  // EQ
  eqEnabled: true,
  eqLowFreq: true,
  eqLowGain: true,
  eqMidFreq: true,
  eqMidGain: true,
  eqHighFreq: true,
  eqHighGain: true,
  // Ducking
  duckingEnabled: true,
  duckingAmount: true,
  duckingAttack: true,
  duckingRelease: true,
} as const;

type ProductionField = keyof typeof PRODUCTION_FIELDS;

export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");
    if (!stationId) {
      return NextResponse.json({ error: "stationId required" }, { status: 400 });
    }

    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { id: true, name: true, ...PRODUCTION_FIELDS },
    });

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    return NextResponse.json({ production: station });
  } catch (error) {
    return handleApiError(error, "/api/station-production");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationId, ...updates } = body;

    if (!stationId) {
      return NextResponse.json({ error: "stationId required" }, { status: 400 });
    }

    // Whitelist only production fields
    const data: Record<string, unknown> = {};
    for (const key of Object.keys(updates)) {
      if (key in PRODUCTION_FIELDS) {
        data[key] = updates[key];
      }
    }

    const station = await prisma.station.update({
      where: { id: stationId },
      data,
      select: { id: true, name: true, ...PRODUCTION_FIELDS },
    });

    return NextResponse.json({ production: station });
  } catch (error) {
    return handleApiError(error, "/api/station-production");
  }
}
