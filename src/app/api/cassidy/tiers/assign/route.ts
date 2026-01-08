import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import type { AssignTierRequest } from "@/types/cassidy";

/**
 * POST /api/cassidy/tiers/assign
 *
 * Assigns a tier to a submission (final decision by Cassidy Monroe)
 *
 * Requires authentication: cassidy or admin role
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role authorization
    const userRole = session.user.role;
    if (userRole !== "cassidy" && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body: AssignTierRequest = await request.json();

    // Validate required fields
    if (!body.submissionId || !body.tierAwarded || !body.rotationSpinsWeekly) {
      return NextResponse.json(
        { error: "Missing required fields: submissionId, tierAwarded, rotationSpinsWeekly" },
        { status: 400 }
      );
    }

    // Validate tier
    const validTiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
    if (!validTiers.includes(body.tierAwarded)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be one of: BRONZE, SILVER, GOLD, PLATINUM" },
        { status: 400 }
      );
    }

    // Check if submission exists and get details
    const submission = await prisma.submission.findUnique({
      where: { id: body.submissionId },
      include: {
        reviews: {
          include: {
            judge: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Update submission with tier assignment
    const updatedSubmission = await prisma.submission.update({
      where: { id: body.submissionId },
      data: {
        tierAwarded: body.tierAwarded,
        rotationSpinsWeekly: body.rotationSpinsWeekly,
        decisionRationale: body.decisionRationale,
        upgradePathway: body.upgradePathway,
        status: "PLACED",
        awardedAt: new Date(),
        judgingCompletedAt: submission.judgingCompletedAt || new Date(),
      },
    });

    // Create tier placement record
    const tierPlacement = await prisma.tierPlacement.create({
      data: {
        submissionId: body.submissionId,
        artistId: submission.artistId,
        artistName: submission.artistName,
        newTier: body.tierAwarded,
        decidedBy: session.user.name || "Cassidy Monroe",
        reason: body.decisionRationale,
        isProgression: submission.submissionType === "progression_request",
        judgeScores: {
          judges: submission.reviews.map((r) => ({
            judgeId: r.judgeId,
            judgeName: r.judge.name,
            overallScore: r.overallScore,
            tierRecommendation: r.tierRecommendation,
          })),
        },
      },
    });

    // Create rotation slots if specified
    let rotationSlots: string[] = [];
    if (body.rotationIntegration?.replacesMainstreamSlot) {
      // Find available mainstream slots to replace
      const slotsToReplace = await prisma.rotationSlot.findMany({
        where: {
          indieVsMainstream: "mainstream",
          mainstreamReplaced: false,
        },
        take: body.rotationSpinsWeekly,
        orderBy: {
          createdAt: "asc",
        },
      });

      // Replace slots with indie artist
      for (const slot of slotsToReplace) {
        await prisma.rotationSlot.update({
          where: { id: slot.id },
          data: {
            currentArtistId: submission.artistId,
            currentArtistName: submission.artistName,
            currentTier: body.tierAwarded,
            indieVsMainstream: "indie",
            mainstreamReplaced: true,
            replacedAt: new Date(),
          },
        });
        rotationSlots.push(slot.id);
      }
    }

    // Log activity
    await prisma.cassidyActivity.create({
      data: {
        action: "assigned_tier",
        submissionId: body.submissionId,
        artistId: submission.artistId,
        details: {
          tier: body.tierAwarded,
          spinsWeekly: body.rotationSpinsWeekly,
          replacedMainstreamSlots: rotationSlots.length,
        },
        successful: true,
      },
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: updatedSubmission.id,
        artistName: updatedSubmission.artistName,
        trackTitle: updatedSubmission.trackTitle,
        tierAwarded: updatedSubmission.tierAwarded,
        rotationSpinsWeekly: updatedSubmission.rotationSpinsWeekly,
        status: updatedSubmission.status,
        awardedAt: updatedSubmission.awardedAt,
      },
      tierPlacement: {
        id: tierPlacement.id,
        tier: tierPlacement.newTier,
        decidedBy: tierPlacement.decidedBy,
      },
      rotationSlots: {
        assigned: rotationSlots.length,
        mainstreamReplaced: rotationSlots.length,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Error assigning tier:", error);
    return NextResponse.json(
      { error: "Failed to assign tier" },
      { status: 500 }
    );
  }
}
