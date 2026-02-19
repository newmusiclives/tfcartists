import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

/**
 * Harper Daily Automation Cron Job
 * Runs every day at 10:00 AM
 *
 * Tasks:
 * 1. Send follow-ups to sponsors in pipeline
 * 2. Identify sponsors needing renewal
 * 3. Prospect for new sponsors
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/harper-daily",
 *     "schedule": "0 10 * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === "development";

    // Verify cron secret (skip in development for manual triggers)
    if (!isDev) {
      const authHeader = req.headers.get("authorization");
      const cronSecret = env.CRON_SECRET;
      if (!cronSecret) {
        logger.error("CRON_SECRET not configured");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
      }

      if (authHeader !== `Bearer ${cronSecret}`) {
        logger.warn("Unauthorized cron attempt", { path: "/api/cron/harper-daily" });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    logger.info("Starting Harper daily automation");

    const results = {
      followUps: 0,
      renewals: 0,
      errors: 0,
    };

    // 1. Send follow-ups to sponsors
    const followUpSponsors = await prisma.sponsor.findMany({
      where: {
        nextFollowUpAt: {
          lte: new Date(),
        },
        status: {
          in: ["CONTACTED", "INTERESTED", "NEGOTIATING"],
        },
      },
      take: 20, // Limit to 20 per day
    });

    logger.info(`Found ${followUpSponsors.length} sponsors needing follow-up`);

    const { HarperAgent } = await import("@/lib/ai/harper-agent");
    const harper = new HarperAgent();

    for (const sponsor of followUpSponsors) {
      try {
        // Determine intent based on stage
        let intent: any = "educate_value";
        if (sponsor.pipelineStage === "interested") {
          intent = "pitch_packages";
        } else if (sponsor.pipelineStage === "negotiating") {
          intent = "negotiate";
        }

        await harper.sendMessage(sponsor.id, "", intent);

        // Schedule next follow-up
        const nextFollowUp = new Date();
        nextFollowUp.setDate(nextFollowUp.getDate() + 5); // 5 days

        await prisma.sponsor.update({
          where: { id: sponsor.id },
          data: { nextFollowUpAt: nextFollowUp },
        });

        results.followUps++;
      } catch (error) {
        logger.error("Sponsor follow-up failed", { sponsorId: sponsor.id, error });
        results.errors++;
      }
    }

    // 2. Identify sponsorships expiring in next 30 days
    const expiringSponsors = await prisma.sponsorship.findMany({
      where: {
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        status: "active",
      },
      include: {
        sponsor: true,
      },
    });

    for (const sponsorship of expiringSponsors) {
      try {
        // Send renewal message
        await harper.sendMessage(
          sponsorship.sponsorId,
          "",
          "pitch_packages" // Pitch renewal
        );

        results.renewals++;
      } catch (error) {
        logger.error("Renewal message failed", {
          sponsorshipId: sponsorship.id,
          error,
        });
        results.errors++;
      }
    }

    logger.info("Harper daily automation completed", results);

    return NextResponse.json({
      success: true,
      message: "Harper daily automation completed",
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error("Harper daily automation failed", { error });

    return NextResponse.json(
      {
        error: "Daily automation failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
