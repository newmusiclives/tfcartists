import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import type { SubmitReviewRequest } from "@/types/cassidy";

export const dynamic = "force-dynamic";

/**
 * POST /api/cassidy/reviews
 *
 * Submit a judge's review for a submission
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
    const body: SubmitReviewRequest = await request.json();

    // Validate required fields
    if (!body.submissionId || !body.judgeId) {
      return NextResponse.json(
        { error: "Missing required fields: submissionId, judgeId" },
        { status: 400 }
      );
    }

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: body.submissionId },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check if judge exists
    const judge = await prisma.judge.findUnique({
      where: { id: body.judgeId },
    });

    if (!judge) {
      return NextResponse.json(
        { error: "Judge not found" },
        { status: 404 }
      );
    }

    // Check if review already exists (prevent duplicates)
    const existingReview = await prisma.submissionReview.findUnique({
      where: {
        submissionId_judgeId: {
          submissionId: body.submissionId,
          judgeId: body.judgeId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Review already submitted by this judge" },
        { status: 409 }
      );
    }

    // Create review
    const review = await prisma.submissionReview.create({
      data: {
        submissionId: body.submissionId,
        judgeId: body.judgeId,
        overallScore: body.scores.overallScore,
        productionQuality: body.scores.productionQuality,
        commercialViability: body.scores.commercialViability,
        artisticMerit: body.scores.artisticMerit,
        performanceQuality: body.scores.performanceQuality,
        culturalSignificance: body.scores.culturalSignificance,
        growthPotential: body.scores.growthPotential,
        strengths: body.qualitative.strengths,
        growthAreas: body.qualitative.growthAreas,
        tierRecommendation: body.qualitative.tierRecommendation,
        upgradePathwayAdvice: body.qualitative.upgradePathwayAdvice,
        technicalNotes: body.judgeSpecificNotes?.technicalNotes,
        programmingNotes: body.judgeSpecificNotes?.programmingNotes,
        performanceNotes: body.judgeSpecificNotes?.performanceNotes,
        musicologicalNotes: body.judgeSpecificNotes?.musicologicalNotes,
        audienceNotes: body.judgeSpecificNotes?.audienceNotes,
      },
    });

    // Update submission status to IN_REVIEW if it was PENDING
    if (submission.status === "PENDING") {
      await prisma.submission.update({
        where: { id: body.submissionId },
        data: {
          status: "IN_REVIEW",
          judgingStartedAt: new Date(),
        },
      });
    }

    // Check if all judges have reviewed (update to JUDGED if so)
    const totalReviews = await prisma.submissionReview.count({
      where: { submissionId: body.submissionId },
    });

    const totalJudges = await prisma.judge.count({
      where: { isActive: true },
    });

    if (totalReviews >= totalJudges) {
      await prisma.submission.update({
        where: { id: body.submissionId },
        data: {
          status: "JUDGED",
          judgingCompletedAt: new Date(),
        },
      });
    }

    // Update judge's total submissions count
    await prisma.judge.update({
      where: { id: body.judgeId },
      data: {
        totalSubmissionsJudged: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        submissionId: review.submissionId,
        judgeId: review.judgeId,
        overallScore: review.overallScore,
        tierRecommendation: review.tierRecommendation,
        scoredAt: review.scoredAt,
      },
      submissionStatus: totalReviews >= totalJudges ? "JUDGED" : "IN_REVIEW",
      reviewsCompleted: totalReviews + 1,
      totalJudges,
    }, { status: 201 });
  } catch (error) {
    logger.error("Error submitting review", { error });
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cassidy/reviews
 *
 * Get reviews for a submission
 * Query params:
 * - submissionId: required - get reviews for this submission
 *
 * Requires authentication: cassidy or admin role
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing required parameter: submissionId" },
        { status: 400 }
      );
    }

    // Fetch reviews with judge details
    const reviews = await prisma.submissionReview.findMany({
      where: {
        submissionId,
      },
      include: {
        judge: {
          select: {
            id: true,
            name: true,
            role: true,
            expertiseArea: true,
          },
        },
      },
      orderBy: {
        scoredAt: "asc",
      },
      take: 50,
    });

    return NextResponse.json({
      reviews,
      count: reviews.length,
    });
  } catch (error) {
    logger.error("Error fetching reviews", { error });
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
