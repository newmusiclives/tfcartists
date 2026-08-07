/**
 * The one place an airplay tier's price and share count are defined.
 *
 * These three numbers used to live in three files and disagreed in all of them:
 *
 *   | tier      | shown on /airplay | charged by Manifest | used by the model |
 *   |-----------|-------------------|---------------------|-------------------|
 *   | TIER_20   | $15 / 20 shares   | $20 / 25 shares     | $15 / 30 shares   |
 *   | TIER_50   | $40 / 65 shares   | $50 / 75 shares     | $40 / 100 shares  |
 *   | TIER_120  | $100 / 250 shares | $120 / 200 shares   | $100 / 250 shares |
 *
 * Three of the four paid tiers would have charged an artist 20-25% more than
 * the page quoted them. It never surfaced because the `station_payments` flag
 * is off, so no card has been charged yet - the defect was waiting for the day
 * someone turned payments on.
 *
 * The cause is visible in the keys themselves: TIER_20 and TIER_50 are named
 * for the prices they used to charge. A repricing reached the display and the
 * revenue model and never reached the payment integration.
 *
 * The values below are the ones the customer is SHOWN, because that is the
 * promise we are held to: an artist who reads "$15/month, 20 plays" must be
 * charged $15 and receive 20 shares. Everything else now derives from here.
 *
 * This module deliberately has NO imports. It is pulled into client bundles,
 * server routes and the payment layer alike, and a dependency here would drag
 * Prisma into the browser.
 */

export type AirplayTierKey = "FREE" | "TIER_5" | "TIER_20" | "TIER_50" | "TIER_120";

export interface AirplayTierTerms {
  /** Monthly price in whole dollars, as displayed. */
  price: number;
  /** Pool weight AND plays per month - the two have to be the same promise. */
  shares: number;
  /** The name used in older pricing tables and the capacity model. */
  legacyName: "FREE" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
}

export const AIRPLAY_TIER_TERMS: Record<AirplayTierKey, AirplayTierTerms> = {
  FREE:     { price: 0,   shares: 1,   legacyName: "FREE" },
  TIER_5:   { price: 5,   shares: 5,   legacyName: "BRONZE" },
  TIER_20:  { price: 15,  shares: 20,  legacyName: "SILVER" },
  TIER_50:  { price: 40,  shares: 65,  legacyName: "GOLD" },
  TIER_120: { price: 100, shares: 250, legacyName: "PLATINUM" },
};

/** Price in cents, which is what a payment provider wants. */
export function tierAmountInCents(tier: AirplayTierKey): number {
  return AIRPLAY_TIER_TERMS[tier].price * 100;
}

/** "$15/month - 20 shares", built from the terms rather than typed out again. */
export function tierPlanLabel(tier: AirplayTierKey): string {
  const t = AIRPLAY_TIER_TERMS[tier];
  return `$${t.price}/month - ${t.shares} shares`;
}

/** Keyed by the BRONZE/SILVER/GOLD/PLATINUM names the capacity model uses. */
export const AIRPLAY_TERMS_BY_LEGACY_NAME = Object.fromEntries(
  Object.values(AIRPLAY_TIER_TERMS).map((t) => [t.legacyName, t]),
) as Record<AirplayTierTerms["legacyName"], AirplayTierTerms>;
