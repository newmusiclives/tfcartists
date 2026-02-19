import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

/**
 * Cassidy Daily Submission Review Cron Job
 * Runs every day at 4:20 AM
 *
 * Tasks:
 * 1. Process pending submissions — auto-assign to judges via SubmissionReview
 * 2. Check for stale in-review submissions (>7 days)
 * 3. Auto-place judged submissions that meet tier thresholds
 * 4. Log daily review metrics
 */
export async function GET(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === "development";

    if (!isDev) {
      const authHeader = req.headers.get("authorization");
      const cronSecret = env.CRON_SECRET;
      if (!cronSecret) {
        logger.error("CRON_SECRET not configured");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
      }
      if (authHeader !== `Bearer ${cronSecret}`) {
        logger.warn("Unauthorized cron attempt", { path: "/api/cron/cassidy-daily" });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    logger.info("Starting Cassidy daily submission review");

    const results = {
      assigned: 0,
      staleReassigned: 0,
      autoPlaced: 0,
      errors: 0,
    };

    // 1. Find pending submissions not yet assigned to any judge
    const pendingSubmissions = await prisma.submission.findMany({
      where: {
        status: "PENDING",
      },
      take: 20,
    });

    // Get active judges
    const judges = await prisma.judge.findMany({
      where: { isActive: true },
    });

    if (judges.length > 0 && pendingSubmissions.length > 0) {
      for (const submission of pendingSubmissions) {
        try {
          // Round-robin assign to judges via SubmissionReview
          const judge = judges[results.assigned % judges.length];

          await prisma.submissionReview.create({
            data: {
              submissionId: submission.id,
              judgeId: judge.id,
            },
          });

          // Move submission to IN_REVIEW
          await prisma.submission.update({
            where: { id: submission.id },
            data: {
              status: "IN_REVIEW",
              judgingStartedAt: new Date(),
            },
          });

          results.assigned++;
        } catch (error) {
          logger.error("Submission assignment failed", { submissionId: submission.id, error });
          results.errors++;
        }
      }
    }

    // 2. Check for stale in-review submissions (>7 days without completion)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const staleSubmissions = await prisma.submission.findMany({
      where: {
        status: "IN_REVIEW",
        judgingStartedAt: { lte: sevenDaysAgo },
        judgingCompletedAt: null,
      },
      take: 10,
    });

    for (const submission of staleSubmissions) {
      try {
        if (judges.length > 0) {
          // Assign additional judge review
          const nextJudge = judges[results.staleReassigned % judges.length];
          await prisma.submissionReview.create({
            data: {
              submissionId: submission.id,
              judgeId: nextJudge.id,
            },
          }).catch(() => {}); // Ignore duplicate

          // Reset judging timer
          await prisma.submission.update({
            where: { id: submission.id },
            data: { judgingStartedAt: new Date() },
          });
        }
        results.staleReassigned++;
      } catch (error) {
        logger.error("Stale reassignment failed", { submissionId: submission.id, error });
        results.errors++;
      }
    }

    // 3. Auto-place JUDGED submissions that have a tier awarded
    const judgedSubmissions = await prisma.submission.findMany({
      where: {
        status: "JUDGED",
        tierAwarded: { not: null },
      },
    });

    for (const submission of judgedSubmissions) {
      try {
        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            status: "PLACED",
            awardedAt: submission.awardedAt || new Date(),
          },
        });
        results.autoPlaced++;
      } catch (error) {
        logger.error("Auto-placement failed", { submissionId: submission.id, error });
        results.errors++;
      }
    }

    logger.info("Cassidy daily submission review completed", results);

    return NextResponse.json({
      success: true,
      message: "Cassidy daily submission review completed",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Cassidy daily submission review failed", { error });

    return NextResponse.json(
      {
        error: "Daily automation failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
