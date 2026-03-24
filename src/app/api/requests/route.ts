import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getOrgScope } from "@/lib/api/auth";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { withRateLimit } from "@/lib/rate-limit/limiter";
import { z } from "zod";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  stationId: z.string(),
  songTitle: z.string().min(1).max(200),
  artistName: z.string().min(1).max(200),
  songId: z.string().optional(),
  listenerId: z.string().optional(),
  listenerName: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
});

/**
 * GET /api/requests — list song requests for a station
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const orgScope = getOrgScope(session);
    const stationId = request.nextUrl.searchParams.get("stationId");
    const status = request.nextUrl.searchParams.get("status");

    const where: any = {
      ...(stationId && { stationId }),
      ...(status && { status }),
      ...(orgScope.organizationId && { station: { organizationId: orgScope.organizationId } }),
    };

    const requests = await prisma.songRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return handleApiError(error, "/api/requests");
  }
}

/**
 * POST /api/requests — submit a song request (public, rate-limited)
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, "api");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify station exists and accepts requests
    const station = await prisma.station.findUnique({
      where: { id: parsed.data.stationId },
      select: { id: true, stationMode: true, isActive: true },
    });

    if (!station || !station.isActive) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    // Check for duplicate requests (same song in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const duplicate = await prisma.songRequest.findFirst({
      where: {
        stationId: parsed.data.stationId,
        songTitle: parsed.data.songTitle,
        artistName: parsed.data.artistName,
        createdAt: { gte: oneHourAgo },
        status: { in: ["pending", "queued"] },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "This song was already requested recently", existingRequest: duplicate },
        { status: 409 }
      );
    }

    const songRequest = await prisma.songRequest.create({
      data: parsed.data,
    });

    return NextResponse.json({ request: songRequest }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/requests");
  }
}

/**
 * PATCH /api/requests — update request status (auth required)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const body = await request.json();
    const { id, status, rejectedReason } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }

    const validStatuses = ["pending", "queued", "played", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const updated = await prisma.songRequest.update({
      where: { id },
      data: {
        status,
        ...(status === "played" && { playedAt: new Date() }),
        ...(status === "rejected" && rejectedReason && { rejectedReason }),
      },
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    return handleApiError(error, "/api/requests");
  }
}
