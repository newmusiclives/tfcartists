import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { riley } from "@/lib/ai/riley-agent";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

/**
 * Riley Daily Automation Cron Job
 * Runs every day at 9:00 AM
 *
 * Tasks:
 * 1. Discover new artists from social media
 * 2. Send follow-up messages to artists in pipeline
 * 3. Send reminders for upcoming shows
 * 4. Celebrate first wins
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/riley-daily",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (security)
    const authHeader = req.headers.get("authorization");
    const cronSecret = env.CRON_SECRET;
    if (!cronSecret) {
      logger.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron attempt", { path: "/api/cron/riley-daily" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("Starting Riley daily automation");

    const results = {
      followUps: 0,
      showReminders: 0,
      wins: 0,
      errors: 0,
    };

    // 1. Send follow-ups to artists who need them
    const followUpArtists = await prisma.artist.findMany({
      where: {
        nextFollowUpAt: {
          lte: new Date(),
        },
        status: {
          in: ["CONTACTED", "ENGAGED", "QUALIFIED"],
        },
      },
      take: Number(env.RILEY_MAX_OUTREACH_PER_DAY) || 50,
    });

    logger.info(`Found ${followUpArtists.length} artists needing follow-up`);

    for (const artist of followUpArtists) {
      try {
        // Determine intent based on pipeline stage
        let intent: any = "qualify_live_shows";
        if (artist.pipelineStage === "qualified") {
          intent = "book_show";
        } else if (artist.pipelineStage === "engaged") {
          intent = "educate_product";
        }

        await riley.sendMessage(artist.id, "", intent);

        // Schedule next follow-up in 3-5 days
        const nextFollowUp = new Date();
        nextFollowUp.setDate(nextFollowUp.getDate() + Math.floor(Math.random() * 3) + 3);

        await prisma.artist.update({
          where: { id: artist.id },
          data: { nextFollowUpAt: nextFollowUp },
        });

        results.followUps++;
      } catch (error) {
        logger.error("Follow-up failed", { artistId: artist.id, error });
        results.errors++;
      }
    }

    // 2. Send reminders for shows happening in next 24-48 hours
    const upcomingShows = await prisma.show.findMany({
      where: {
        date: {
          gte: new Date(),
          lte: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
        status: "SCHEDULED",
      },
      include: {
        artist: true,
      },
    });

    for (const show of upcomingShows) {
      try {
        await riley.sendMessage(show.artistId, "", "send_reminder");

        await prisma.show.update({
          where: { id: show.id },
          data: { status: "REMINDED" },
        });

        results.showReminders++;
      } catch (error) {
        logger.error("Show reminder failed", { showId: show.id, error });
        results.errors++;
      }
    }

    // 3. Celebrate first wins (donations received in last 24 hours)
    const recentWins = await prisma.donation.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        isFirstWin: true,
        celebratedBy: null,
      },
      include: {
        artist: true,
      },
    });

    for (const win of recentWins) {
      try {
        await riley.sendMessage(win.artistId, "", "celebrate_win");

        await prisma.donation.update({
          where: { id: win.id },
          data: { celebratedBy: "riley" },
        });

        results.wins++;
      } catch (error) {
        logger.error("Win celebration failed", { donationId: win.id, error });
        results.errors++;
      }
    }

    logger.info("Riley daily automation completed", results);

    return NextResponse.json({
      success: true,
      message: "Riley daily automation completed",
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error("Riley daily automation failed", { error });

    return NextResponse.json(
      {
        error: "Daily automation failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
