import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { logCronExecution } from "@/lib/cron/log";
import { calculateAllListenerPromoterEarnings } from "@/lib/scout/listener-promoter";
import { getUnpaidBonuses, markBonusesPaid } from "@/lib/scout/sponsor-referral-bonus";
import { manifest } from "@/lib/payments/manifest";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/promoter-payouts
 * Monthly cron to calculate and process listener promoter earnings
 * and sponsor referral bonuses.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") || req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  const startTime = Date.now();

  // Calculate period (previous month)
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const period = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

  try {
    // 1. Calculate listener promoter earnings
    const earnings = await calculateAllListenerPromoterEarnings(period);
    let totalPromoted = 0;
    let promotersPaid = 0;

    for (const e of earnings) {
      if (e.total < 0.01) continue;

      // Update scout earnings total
      await prisma.scout.update({
        where: { id: e.scoutId },
        data: {
          totalEarnings: { increment: e.total },
          totalCommissions: { increment: e.total },
        },
      });

      totalPromoted += e.total;
      promotersPaid++;
    }

    // 2. Process sponsor referral bonuses
    const scouts = await prisma.scout.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, listenerId: true, bankAccountId: true },
    });

    let bonusesPaid = 0;
    let bonusTotal = 0;

    for (const scout of scouts) {
      const { total, bonuses } = await getUnpaidBonuses(scout.id);
      if (total < 0.01) continue;

      // If Manifest is configured and scout has bank account, create payout
      if (manifest.isConfigured() && scout.bankAccountId) {
        try {
          await manifest.createArtistPayout({
            artistId: scout.id,
            amount: total,
            bankAccountId: scout.bankAccountId,
            period,
          });
          await markBonusesPaid(bonuses.map(b => b.id));
          bonusesPaid++;
          bonusTotal += total;
        } catch (error) {
          logger.warn("Bonus payout failed", { scoutId: scout.id, error });
        }
      } else {
        // Mark as pending for manual payout
        bonusesPaid++;
        bonusTotal += total;
      }
    }

    const duration = Date.now() - startTime;

    await logCronExecution({
      jobName: "promoter-payouts",
      status: "success",
      duration,
      summary: {
        period,
        promotersPaid,
        totalPromoted: Math.round(totalPromoted * 100) / 100,
        bonusesPaid,
        bonusTotal: Math.round(bonusTotal * 100) / 100,
      },
      startedAt,
    });

    return NextResponse.json({
      success: true,
      period,
      promotersPaid,
      totalPromoted: Math.round(totalPromoted * 100) / 100,
      bonusesPaid,
      bonusTotal: Math.round(bonusTotal * 100) / 100,
      duration,
    });
  } catch (error) {
    logger.error("Promoter payouts cron failed", { error });

    await logCronExecution({
      jobName: "promoter-payouts",
      status: "error",
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown",
      startedAt,
    });

    return NextResponse.json({ error: "Promoter payouts failed" }, { status: 500 });
  }
}
