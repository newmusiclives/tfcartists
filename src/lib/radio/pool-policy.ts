/**
 * The artist pool: what the station owes its artists out of ad revenue.
 *
 * These rules lived only inside airplay-system.ts, which imports Prisma and so
 * cannot be reached from the revenue model. The result was that the model
 * never subtracted the pool at all - it counted the same money as operator
 * profit and as artist earnings, overstating profit three to four fold.
 *
 * No imports here, deliberately, so both the payout code and the pricing model
 * can share one definition.
 */

/** Share of ad revenue owed to artists. */
export const ARTIST_POOL_SPLIT = 0.8;

/** Withheld against months when sponsors churn. Effective rate is 72%. */
export const SPONSOR_CHURN_RESERVE = 0.1;

/**
 * Floor and cap on what one share is worth.
 *
 * The floor is a genuine liability, not a formality: when ad revenue is low,
 * `max(floor, pool/shares)` pays out MORE than the pool contains, and the
 * difference comes from the station. It is the right promise to make to
 * artists - a payout that rounds to nothing is worse than no payout - but it
 * has to appear as a cost somewhere, which is what `shortfall` below is for.
 */
export const MIN_PER_SHARE_VALUE = 0.5;
export const MAX_PER_SHARE_VALUE = 10.0;

export interface PoolObligation {
  /** 72% of ad revenue - what the pool nominally holds. */
  pool: number;
  /** Value of one share after the floor and cap are applied. */
  perShareValue: number;
  /** What actually leaves the station's account. */
  paidOut: number;
  /** Paid above what the pool held, because the floor bit. */
  shortfall: number;
  /** True when the floor is doing the work rather than the revenue. */
  floorApplied: boolean;
}

/**
 * What the station will actually pay artists for a month.
 *
 * Mirrors distributeRevenuePool() in airplay-system.ts exactly - if that
 * formula changes, change it here in the same commit.
 */
export function artistPoolObligation(adRevenue: number, totalShares: number): PoolObligation {
  const pool = adRevenue * ARTIST_POOL_SPLIT * (1 - SPONSOR_CHURN_RESERVE);

  if (totalShares <= 0) {
    return { pool, perShareValue: 0, paidOut: 0, shortfall: 0, floorApplied: false };
  }

  const raw = pool / totalShares;
  const perShareValue = Math.min(MAX_PER_SHARE_VALUE, Math.max(MIN_PER_SHARE_VALUE, raw));
  const paidOut = perShareValue * totalShares;

  return {
    pool,
    perShareValue,
    paidOut,
    shortfall: Math.max(0, paidOut - pool),
    floorApplied: raw < MIN_PER_SHARE_VALUE,
  };
}
