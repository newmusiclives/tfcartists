import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { riley } from "@/lib/ai/riley-agent";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { socialDiscovery } from "@/lib/discovery/social-discovery";

export const dynamic = "force-dynamic";

/**
 * Riley Daily Automation Cron Job
 * Runs Mon-Sat at 4:30 AM (skips Sundays)
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
    const isDev = process.env.NODE_ENV === "development";
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry_run") === "true";

    // Verify cron secret (skip in development for manual dashboard triggers)
    if (!isDev) {
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
    }

    // Skip Sundays — Riley works Mon-Sat only
    const dayOfWeek = new Date().getUTCDay(); // 0 = Sunday
    if (dayOfWeek === 0) {
      logger.info("Riley daily automation skipped (Sunday)");
      return NextResponse.json({
        success: true,
        message: "Skipped — Riley does not run on Sundays",
        results: { followUps: 0, showReminders: 0, wins: 0, errors: 0 },
        timestamp: new Date().toISOString(),
      });
    }

    logger.info("Starting Riley daily automation", { dryRun });

    const results = {
      discovered: 0,
      imported: 0,
      initialOutreach: 0,
      followUps: 0,
      showReminders: 0,
      wins: 0,
      errors: 0,
    };

    // ── Step 0: Discover new artists from Spotify ──
    try {
      const discoveryResults = dryRun
        ? { totalDiscovered: 0, imported: 0, platforms: {} }
        : await socialDiscovery.runDailyDiscovery();

      results.discovered = discoveryResults.totalDiscovered;
      results.imported = discoveryResults.imported;

      logger.info("Discovery step complete", {
        discovered: discoveryResults.totalDiscovered,
        imported: discoveryResults.imported,
        platforms: discoveryResults.platforms,
        dryRun,
      });
    } catch (error) {
      logger.error("Discovery step failed", { error });
      results.errors++;
    }

    // ── Step 0.5: Initial outreach to newly discovered artists with contact info ──
    const newArtistsWithContact = await prisma.artist.findMany({
      where: {
        status: "DISCOVERED",
        pipelineStage: "discovery",
        lastContactedAt: null,
        OR: [
          { email: { not: null } },
          { phone: { not: null } },
        ],
      },
      take: 20, // Separate cap from the 100 follow-up limit
    });

    logger.info(`Found ${newArtistsWithContact.length} new artists with contact info for initial outreach`);

    for (const artist of newArtistsWithContact) {
      try {
        if (!dryRun) {
          await riley.sendMessage(artist.id, "", "initial_outreach");

          // Schedule next follow-up in 3-5 days
          const nextFollowUp = new Date();
          nextFollowUp.setDate(nextFollowUp.getDate() + Math.floor(Math.random() * 3) + 3);

          await prisma.artist.update({
            where: { id: artist.id },
            data: {
              lastContactedAt: new Date(),
              nextFollowUpAt: nextFollowUp,
            },
          });
        }

        results.initialOutreach++;
      } catch (error) {
        logger.error("Initial outreach failed", { artistId: artist.id, error });
        results.errors++;
      }
    }

    // ── Step 1: Send follow-ups to artists who need them ──
    const followUpArtists = await prisma.artist.findMany({
      where: {
        nextFollowUpAt: {
          lte: new Date(),
        },
        status: {
          in: ["CONTACTED", "ENGAGED", "QUALIFIED"],
        },
      },
      take: Number(env.RILEY_MAX_OUTREACH_PER_DAY) || 100,
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

        if (!dryRun) {
          await riley.sendMessage(artist.id, "", intent);

          // Schedule next follow-up in 3-5 days
          const nextFollowUp = new Date();
          nextFollowUp.setDate(nextFollowUp.getDate() + Math.floor(Math.random() * 3) + 3);

          await prisma.artist.update({
            where: { id: artist.id },
            data: { nextFollowUpAt: nextFollowUp },
          });
        }

        results.followUps++;
      } catch (error) {
        logger.error("Follow-up failed", { artistId: artist.id, error });
        results.errors++;
      }
    }

    // ── Step 2: Send reminders for shows happening in next 24-48 hours ──
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
        if (!dryRun) {
          await riley.sendMessage(show.artistId, "", "send_reminder");

          await prisma.show.update({
            where: { id: show.id },
            data: { status: "REMINDED" },
          });
        }

        results.showReminders++;
      } catch (error) {
        logger.error("Show reminder failed", { showId: show.id, error });
        results.errors++;
      }
    }

    // ── Step 3: Celebrate first wins (donations received in last 24 hours) ──
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
        if (!dryRun) {
          await riley.sendMessage(win.artistId, "", "celebrate_win");

          await prisma.donation.update({
            where: { id: win.id },
            data: { celebratedBy: "riley" },
          });
        }

        results.wins++;
      } catch (error) {
        logger.error("Win celebration failed", { donationId: win.id, error });
        results.errors++;
      }
    }

    logger.info("Riley daily automation completed", { ...results, dryRun });

    return NextResponse.json({
      success: true,
      message: dryRun
        ? "Riley daily automation dry run completed (no messages sent)"
        : "Riley daily automation completed",
      dryRun,
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
