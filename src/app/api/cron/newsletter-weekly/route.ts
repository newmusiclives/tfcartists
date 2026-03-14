import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { logCronExecution } from "@/lib/cron/log";
import {
  generateWeeklyDigest,
  sendNewsletter,
} from "@/lib/newsletter/newsletter-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/newsletter-weekly
 * Sends weekly digest newsletter to all active subscribers.
 * Runs once per week (Sunday morning).
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") || req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  const startTime = Date.now();

  try {
    const orgs = await prisma.organization.findMany({
      where: {
        deletedAt: null,
        newsletterSubscribers: { some: { isActive: true, weeklyDigest: true } },
      },
      select: { id: true, name: true },
    });

    let totalSent = 0;
    let totalErrors = 0;

    for (const org of orgs) {
      try {
        const digest = await generateWeeklyDigest(org.id);
        const result = await sendNewsletter({
          type: "weekly_digest",
          subject: digest.subject,
          htmlContent: digest.html,
          textContent: digest.text,
          organizationId: org.id,
          preferenceKey: "weeklyDigest",
        });
        totalSent += result.sent;
        totalErrors += result.errors;
      } catch (error) {
        logger.error("Newsletter digest failed for org", { orgId: org.id, error });
        totalErrors++;
      }
    }

    // Subscribers without an organization
    const unorgCount = await prisma.newsletterSubscriber.count({
      where: { organizationId: null, isActive: true, weeklyDigest: true },
    });

    if (unorgCount > 0) {
      const digest = await generateWeeklyDigest();
      const result = await sendNewsletter({
        type: "weekly_digest",
        subject: digest.subject,
        htmlContent: digest.html,
        textContent: digest.text,
        preferenceKey: "weeklyDigest",
      });
      totalSent += result.sent;
      totalErrors += result.errors;
    }

    const duration = Date.now() - startTime;

    await logCronExecution({
      jobName: "newsletter-weekly",
      status: "success",
      duration,
      summary: { sent: totalSent, errors: totalErrors, organizations: orgs.length },
      startedAt,
    });

    return NextResponse.json({
      success: true,
      sent: totalSent,
      errors: totalErrors,
      organizations: orgs.length,
      duration,
    });
  } catch (error) {
    logger.error("Newsletter weekly cron failed", { error });

    await logCronExecution({
      jobName: "newsletter-weekly",
      status: "error",
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown",
      startedAt,
    });

    return NextResponse.json({ error: "Newsletter cron failed" }, { status: 500 });
  }
}
