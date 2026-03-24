import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  generateWeeklyDigest,
  sendNewsletter,
} from "@/lib/newsletter/newsletter-service";
import { logCronExecution } from "@/lib/cron/log";

export const dynamic = "force-dynamic";

/**
 * GET /api/newsletter/weekly-digest
 *
 * Generates and optionally sends the weekly playlist digest.
 * Protected by CRON_SECRET for automated cron execution.
 *
 * Query params:
 *   ?send=true  — also send to subscribers (default: false, just generates)
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/newsletter/weekly-digest",
 *     "schedule": "0 9 * * 1"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  const cronStart = Date.now();
  const cronStartedAt = new Date();

  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = env.CRON_SECRET;
    if (!cronSecret) {
      logger.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron attempt", {
        path: "/api/newsletter/weekly-digest",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shouldSend = req.nextUrl.searchParams.get("send") === "true";

    logger.info("Generating weekly digest", { send: shouldSend });

    // Get the active station's organization for scoping
    const station = await prisma.station.findFirst({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, organizationId: true },
    });

    const orgId = station?.organizationId || undefined;

    // Generate the digest content
    const digest = await generateWeeklyDigest(orgId);

    // Gather additional stats for the digest
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Top artists by play count
    const topArtists = await prisma.trackPlayback.groupBy({
      by: ["artistName"],
      where: { playedAt: { gte: oneWeekAgo } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    // Most played songs
    const topTracks = await prisma.trackPlayback.groupBy({
      by: ["trackTitle", "artistName"],
      where: { playedAt: { gte: oneWeekAgo } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    // Total plays this week
    const totalPlays = await prisma.trackPlayback.count({
      where: { playedAt: { gte: oneWeekAgo } },
    });

    // Store the edition in DB
    const edition = await prisma.newsletterEdition.create({
      data: {
        organizationId: orgId || null,
        type: "weekly_digest",
        subject: digest.subject,
        htmlContent: digest.html,
        textContent: digest.text,
        recipientCount: 0,
      },
    });

    let sendResult = { sent: 0, errors: 0 };

    // Send to subscribers if requested
    if (shouldSend) {
      sendResult = await sendNewsletter({
        type: "weekly_digest",
        subject: digest.subject,
        htmlContent: digest.html,
        textContent: digest.text,
        organizationId: orgId,
        preferenceKey: "weeklyDigest",
      });

      // Update edition with send stats
      await prisma.newsletterEdition.update({
        where: { id: edition.id },
        data: {
          sentAt: new Date(),
          recipientCount: sendResult.sent,
        },
      });
    }

    const result = {
      editionId: edition.id,
      subject: digest.subject,
      stats: {
        totalPlaysThisWeek: totalPlays,
        topArtists: topArtists.map((a) => ({
          artist: a.artistName,
          plays: a._count.id,
        })),
        topTracks: topTracks.map((t) => ({
          title: t.trackTitle,
          artist: t.artistName,
          plays: t._count.id,
        })),
      },
      sent: shouldSend,
      sendResult: shouldSend ? sendResult : undefined,
      html: digest.html,
    };

    await logCronExecution({
      jobName: "newsletter-weekly-digest",
      startedAt: cronStartedAt,
      duration: Date.now() - cronStart,
      status: "success",
      summary: {
        editionId: edition.id,
        sent: shouldSend,
        recipients: sendResult.sent,
      },
    });

    logger.info("Weekly digest generated", {
      editionId: edition.id,
      sent: shouldSend,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Weekly digest failed", { error: message });

    await logCronExecution({
      jobName: "newsletter-weekly-digest",
      startedAt: cronStartedAt,
      duration: Date.now() - cronStart,
      status: "error",
      error: message,
    }).catch(() => {});

    return NextResponse.json(
      { error: "Failed to generate weekly digest" },
      { status: 500 }
    );
  }
}
