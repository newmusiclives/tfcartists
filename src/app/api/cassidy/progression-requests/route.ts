import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireRole } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";
import type { ProgressionRequestListItem } from "@/types/cassidy";

export const dynamic = "force-dynamic";

/**
 * GET /api/cassidy/progression-requests
 *
 * Returns progression requests with optional status filter.
 * Query params:
 * - status: pending | approved | denied | needs_more_time
 * - limit: number of results (default: 50)
 *
 * Requires authentication: cassidy or admin role
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("cassidy");
    if (!session) return unauthorized();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (status) {
      where.reviewStatus = status;
    }

    const requests = await prisma.progressionRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const now = new Date();
    const items: ProgressionRequestListItem[] = requests.map((req) => {
      const daysSince = Math.floor(
        (now.getTime() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: req.id,
        artistName: req.artistName,
        currentTier: req.currentTier as ProgressionRequestListItem["currentTier"],
        requestedTier: req.requestedTier as ProgressionRequestListItem["requestedTier"],
        submittedDaysAgo: daysSince,
        status: req.reviewStatus,
      };
    });

    return NextResponse.json({ progressionRequests: items });
  } catch (error) {
    logger.error("Error fetching progression requests", { error });
    return NextResponse.json(
      { error: "Failed to fetch progression requests" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cassidy/progression-requests
 *
 * Creates a new progression request (typically from Riley's team on behalf of an artist).
 * Requires authentication: riley, cassidy, or admin role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("cassidy", "riley");
    if (!session) return unauthorized();

    const body = await request.json();

    if (!body.artistId || !body.artistName || !body.submissionId || !body.currentTier || !body.requestedTier) {
      return NextResponse.json(
        { error: "Missing required fields: artistId, artistName, submissionId, currentTier, requestedTier" },
        { status: 400 }
      );
    }

    const progressionRequest = await prisma.progressionRequest.create({
      data: {
        artistId: body.artistId,
        artistName: body.artistName,
        submissionId: body.submissionId,
        currentTier: body.currentTier,
        requestedTier: body.requestedTier,
        timeSinceLastTierDays: body.timeSinceLastTierDays,
        improvementsClaimed: body.improvementsClaimed,
        newMaterialDescription: body.newMaterialDescription,
        rileyRecommendation: body.rileyRecommendation,
        rileyConfidenceScore: body.rileyConfidenceScore,
        reviewStatus: "pending",
      },
    });

    return NextResponse.json({ success: true, progressionRequest }, { status: 201 });
  } catch (error) {
    logger.error("Error creating progression request", { error });
    return NextResponse.json(
      { error: "Failed to create progression request" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cassidy/progression-requests
 *
 * Review a progression request (approve/deny).
 * Requires authentication: cassidy or admin role
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireRole("cassidy");
    if (!session) return unauthorized();

    const body = await request.json();

    if (!body.id || !body.reviewStatus) {
      return NextResponse.json(
        { error: "Missing required fields: id, reviewStatus" },
        { status: 400 }
      );
    }

    const validStatuses = ["approved", "denied", "needs_more_time"];
    if (!validStatuses.includes(body.reviewStatus)) {
      return NextResponse.json(
        { error: `reviewStatus must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updated = await prisma.progressionRequest.update({
      where: { id: body.id },
      data: {
        reviewStatus: body.reviewStatus,
        reviewDate: new Date(),
        reviewerId: session.user.id,
        decisionRationale: body.decisionRationale,
        upgradeApproved: body.reviewStatus === "approved",
        newTierIfApproved: body.reviewStatus === "approved" ? body.newTier : null,
        timelineToResubmit: body.timelineToResubmit,
      },
    });

    // If approved, create a TierPlacement record
    if (body.reviewStatus === "approved" && body.newTier) {
      await prisma.tierPlacement.create({
        data: {
          submissionId: updated.submissionId,
          artistId: updated.artistId,
          artistName: updated.artistName,
          previousTier: updated.currentTier,
          newTier: body.newTier,
          changeDate: new Date(),
          decidedBy: session.user.name || "Cassidy",
          reason: body.decisionRationale || "Progression request approved",
          isProgression: true,
          timeInPreviousTierDays: updated.timeSinceLastTierDays,
          improvementNotes: updated.improvementsClaimed,
        },
      });

      // Log activity
      await prisma.cassidyActivity.create({
        data: {
          action: "approved_progression",
          submissionId: updated.submissionId,
          artistId: updated.artistId,
          details: {
            previousTier: updated.currentTier,
            newTier: body.newTier,
            rationale: body.decisionRationale,
          },
        },
      });
    }

    return NextResponse.json({ success: true, progressionRequest: updated });
  } catch (error) {
    logger.error("Error updating progression request", { error });
    return NextResponse.json(
      { error: "Failed to update progression request" },
      { status: 500 }
    );
  }
}
