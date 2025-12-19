/**
 * Scout Monthly Payout Logic
 *
 * Calculates and processes monthly scout commission payouts
 * Integrates with Manifest Financial for actual payout processing
 */

import { prisma } from "@/lib/db";
import {
  calculateScoutCommission,
  getCurrentPeriod,
} from "./commission-calculator";
import { logger } from "@/lib/logger";

export type CommissionSummary = {
  period: string;
  totalCommissions: number;
  totalBonuses: number;
  totalAmount: number;
  scoutCount: number;
  commissionRecords: number;
};

export type PayoutResult = {
  scoutId: string;
  amount: number;
  status: "success" | "failed";
  payoutId?: string;
  error?: string;
};

export type PayoutSummary = {
  period: string;
  totalPaid: number;
  payoutCount: number;
  failedCount: number;
  results: PayoutResult[];
};

/**
 * Calculate all scout commissions for a given period
 * Creates ScoutCommission records for each eligible scout-artist pair
 */
export async function calculateMonthlyScoutCommissions(
  period: string
): Promise<CommissionSummary> {
  logger.info(`Calculating scout commissions for period: ${period}`);

  // Get all active scouts
  const scouts = await prisma.scout.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  let totalCommissions = 0;
  let totalBonuses = 0;
  let commissionRecords = 0;

  for (const scout of scouts) {
    // Get all discovered artists who have converted
    const discoveries = await prisma.artistDiscovery.findMany({
      where: {
        scoutId: scout.id,
        hasConverted: true,
        status: "CONVERTED",
      },
      include: {
        artist: true,
      },
    });

    for (const discovery of discoveries) {
      // Skip if artist is on FREE tier
      if (discovery.artist.airplayTier === "FREE") {
        continue;
      }

      // Check if commission already exists for this period
      const existingCommission = await prisma.scoutCommission.findUnique({
        where: {
          scoutId_artistId_period: {
            scoutId: scout.id,
            artistId: discovery.artistId,
            period,
          },
        },
      });

      if (existingCommission) {
        logger.info(
          `Commission already exists for scout ${scout.id}, artist ${discovery.artistId}, period ${period}`
        );
        continue;
      }

      // Calculate commission for this scout-artist pair
      const commission = await calculateScoutCommission(
        scout.id,
        discovery.artistId,
        period
      );

      if (!commission) {
        continue;
      }

      // Create commission record
      await prisma.scoutCommission.create({
        data: {
          scoutId: commission.scoutId,
          artistId: commission.artistId,
          discoveryId: discovery.id,
          type: "RECURRING", // Default type, bonuses are tracked separately
          period: commission.period,
          artistTier: commission.artistTier,
          artistPayment: commission.artistPayment,
          commissionRate: commission.commissionRate,
          commissionAmount: commission.commissionAmount,
          bonusAmount: commission.bonusAmount,
          totalAmount: commission.totalAmount,
          isUpgradeBonus: commission.hasUpgradeBonus,
          isInfluenceBonus: commission.hasInfluenceBonus,
          monthsSinceConversion: commission.monthsSinceConversion,
          status: "PENDING",
        },
      });

      totalCommissions += commission.commissionAmount;
      totalBonuses += commission.bonusAmount;
      commissionRecords++;

      logger.info(
        `Created commission for scout ${scout.id}, artist ${discovery.artistId}: $${commission.totalAmount.toFixed(2)}`
      );
    }
  }

  const totalAmount = totalCommissions + totalBonuses;

  logger.info(
    `Commission calculation complete: ${commissionRecords} records, total $${totalAmount.toFixed(2)}`
  );

  return {
    period,
    totalCommissions,
    totalBonuses,
    totalAmount,
    scoutCount: scouts.length,
    commissionRecords,
  };
}

/**
 * Process scout payouts for a given period
 * Sums up all PENDING commissions per scout and initiates payouts
 */
export async function processScoutPayouts(
  period: string
): Promise<PayoutSummary> {
  logger.info(`Processing scout payouts for period: ${period}`);

  // Get all scouts with pending commissions for this period
  const scoutsWithCommissions = await prisma.scoutCommission.groupBy({
    by: ["scoutId"],
    where: {
      period,
      status: "PENDING",
    },
    _sum: {
      totalAmount: true,
    },
    _count: {
      id: true,
    },
  });

  const results: PayoutResult[] = [];
  let totalPaid = 0;
  let payoutCount = 0;
  let failedCount = 0;

  for (const scoutSummary of scoutsWithCommissions) {
    const scoutId = scoutSummary.scoutId;
    const amount = scoutSummary._sum.totalAmount || 0;

    // Skip if amount is too small (minimum $0.01)
    if (amount < 0.01) {
      logger.info(`Skipping scout ${scoutId}: amount too small ($${amount})`);
      continue;
    }

    try {
      // Get scout details
      const scout = await prisma.scout.findUnique({
        where: { id: scoutId },
        include: {
          listener: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      if (!scout) {
        throw new Error(`Scout ${scoutId} not found`);
      }

      // For now, we'll mark commissions as PAID without actually processing through Manifest
      // In production, you would integrate with Manifest Financial here:
      // const payout = await createScoutPayout(scout, amount, period);

      // Update all pending commissions for this scout/period to PAID
      await prisma.scoutCommission.updateMany({
        where: {
          scoutId,
          period,
          status: "PENDING",
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
          // payoutId: payout.id, // Would come from Manifest
        },
      });

      // Update scout's total earnings
      await prisma.scout.update({
        where: { id: scoutId },
        data: {
          totalEarnings: { increment: amount },
          totalCommissions: { increment: amount },
        },
      });

      results.push({
        scoutId,
        amount,
        status: "success",
        // payoutId: payout.id, // Would come from Manifest
      });

      totalPaid += amount;
      payoutCount++;

      logger.info(
        `Payout successful for scout ${scoutId}: $${amount.toFixed(2)}`
      );

      // TODO: Send payout notification email
      // await notifyScoutEarnings(scoutId, period, amount);
    } catch (error) {
      logger.error(`Payout failed for scout ${scoutId}:`, error);

      // Mark commissions as FAILED
      await prisma.scoutCommission.updateMany({
        where: {
          scoutId,
          period,
          status: "PENDING",
        },
        data: {
          status: "FAILED",
        },
      });

      results.push({
        scoutId,
        amount,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });

      failedCount++;
    }
  }

  logger.info(
    `Payout processing complete: ${payoutCount} successful, ${failedCount} failed, total $${totalPaid.toFixed(2)}`
  );

  return {
    period,
    totalPaid,
    payoutCount,
    failedCount,
    results,
  };
}

/**
 * Get commission summary for a scout and period
 */
export async function getScoutCommissionSummary(
  scoutId: string,
  period?: string
) {
  const targetPeriod = period || getCurrentPeriod();

  const commissions = await prisma.scoutCommission.findMany({
    where: {
      scoutId,
      period: targetPeriod,
    },
    include: {
      artist: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const totalAmount = commissions.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalCommissions = commissions.reduce(
    (sum, c) => sum + c.commissionAmount,
    0
  );
  const totalBonuses = commissions.reduce((sum, c) => sum + c.bonusAmount, 0);

  const paidCommissions = commissions.filter((c) => c.status === "PAID");
  const pendingCommissions = commissions.filter((c) => c.status === "PENDING");

  return {
    period: targetPeriod,
    totalAmount,
    totalCommissions,
    totalBonuses,
    commissionCount: commissions.length,
    paidAmount: paidCommissions.reduce((sum, c) => sum + c.totalAmount, 0),
    pendingAmount: pendingCommissions.reduce((sum, c) => sum + c.totalAmount, 0),
    commissions,
  };
}

/**
 * Get all-time commission summary for a scout
 */
export async function getScoutLifetimeEarnings(scoutId: string) {
  const commissions = await prisma.scoutCommission.findMany({
    where: { scoutId },
  });

  const totalAmount = commissions.reduce((sum, c) => sum + c.totalAmount, 0);
  const paidAmount = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + c.totalAmount, 0);
  const pendingAmount = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + c.totalAmount, 0);

  // Group by period
  const byPeriod = commissions.reduce(
    (acc, c) => {
      if (!acc[c.period]) {
        acc[c.period] = {
          period: c.period,
          amount: 0,
          count: 0,
        };
      }
      acc[c.period].amount += c.totalAmount;
      acc[c.period].count++;
      return acc;
    },
    {} as Record<string, { period: string; amount: number; count: number }>
  );

  return {
    totalAmount,
    paidAmount,
    pendingAmount,
    commissionCount: commissions.length,
    periods: Object.values(byPeriod).sort((a, b) =>
      b.period.localeCompare(a.period)
    ),
  };
}

/**
 * Notify scout of their monthly earnings (placeholder for email integration)
 */
export async function notifyScoutEarnings(
  scoutId: string,
  period: string,
  amount: number
): Promise<void> {
  // TODO: Implement email notification
  logger.info(
    `Would send earnings notification to scout ${scoutId} for period ${period}: $${amount.toFixed(2)}`
  );
}
