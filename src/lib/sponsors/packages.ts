/**
 * The one place a sponsorship package's price and spot count are defined.
 *
 * Sponsor pricing was in three files and no two agreed:
 *
 *   | package    | rate card | contract route | charged by Manifest |
 *   |------------|-----------|----------------|---------------------|
 *   | Local Hero | $45       | $30            | "bronze"   $100     |
 *   | Tier 1     | $79       | $80            | "silver"   $250     |
 *   | Tier 2     | $169      | $150           | "gold"     $400     |
 *   | Tier 3     | $279      | $300           | "platinum" $500     |
 *
 * Worse than drift: the payment layer was keyed by an entirely different set of
 * names. `/api/sponsors/[id]/contract` passes `local_hero` into a function whose
 * table only has `bronze`, so `pricing` came back undefined and the call threw.
 * Any sponsor contract created with Manifest configured would have failed - the
 * flow has never been exercised with a payment provider attached.
 *
 * No imports, so the rate card, the payment layer and the public advertise page
 * can all share one definition.
 */

export type SponsorPackageKey = "LOCAL_HERO" | "TIER_1" | "TIER_2" | "TIER_3";

export interface SponsorPackage {
  key: SponsorPackageKey;
  /** What the advertiser sees. */
  name: string;
  /** Monthly price in whole dollars. */
  price: number;
  /** Paid spots per day, in the 6am-6pm sellable window. */
  spotsPerDay: number;
  /** Paid spots per 30-day month. */
  spotsPerMonth: number;
  /** One line of plain English for the package card. */
  pitch: string;
}

/**
 * A volume ladder: every step costs less per spot than the one below it, so
 * buying more airtime is never worse value than buying the same volume twice.
 */
export const SPONSOR_PACKAGES: Record<SponsorPackageKey, SponsorPackage> = {
  LOCAL_HERO: {
    key: "LOCAL_HERO",
    name: "Local Hero",
    price: 45,
    spotsPerDay: 1,
    spotsPerMonth: 30,
    pitch: "One spot a day. About the price of a boosted social post.",
  },
  TIER_1: {
    key: "TIER_1",
    name: "Tier 1",
    price: 79,
    spotsPerDay: 2,
    spotsPerMonth: 60,
    pitch: "Two spots a day - morning and afternoon drive.",
  },
  TIER_2: {
    key: "TIER_2",
    name: "Tier 2",
    price: 169,
    spotsPerDay: 5,
    spotsPerMonth: 150,
    pitch: "Five spots a day. Hard to miss across a working week.",
  },
  TIER_3: {
    key: "TIER_3",
    name: "Tier 3",
    price: 279,
    spotsPerDay: 10,
    spotsPerMonth: 300,
    pitch: "Ten spots a day. The whole daytime schedule carries you.",
  },
};

export const SPONSOR_PACKAGE_LIST: SponsorPackage[] = [
  SPONSOR_PACKAGES.LOCAL_HERO,
  SPONSOR_PACKAGES.TIER_1,
  SPONSOR_PACKAGES.TIER_2,
  SPONSOR_PACKAGES.TIER_3,
];

/** Price in cents, which is what a payment provider wants. */
export function packageAmountInCents(key: SponsorPackageKey): number {
  return SPONSOR_PACKAGES[key].price * 100;
}

export function packagePlanLabel(key: SponsorPackageKey): string {
  const p = SPONSOR_PACKAGES[key];
  return `${p.name} - $${p.price}/month`;
}

export function isSponsorPackageKey(value: unknown): value is SponsorPackageKey {
  return typeof value === "string" && value in SPONSOR_PACKAGES;
}

/**
 * Accepts the older spellings still stored on Sponsor.sponsorshipTier and in
 * request bodies - lowercase keys, and the bronze/silver/gold/platinum names
 * the payment layer used - so nothing already in the database stops resolving.
 */
const LEGACY_ALIASES: Record<string, SponsorPackageKey> = {
  local_hero: "LOCAL_HERO",
  tier_1: "TIER_1",
  tier_2: "TIER_2",
  tier_3: "TIER_3",
  bronze: "LOCAL_HERO",
  silver: "TIER_1",
  gold: "TIER_2",
  platinum: "TIER_3",
};

export function resolveSponsorPackage(value: string): SponsorPackage | null {
  if (isSponsorPackageKey(value)) return SPONSOR_PACKAGES[value];
  const alias = LEGACY_ALIASES[value.toLowerCase()];
  return alias ? SPONSOR_PACKAGES[alias] : null;
}

/**
 * Overnight airings are delivered free with every package, so a sponsor hears
 * themselves roughly twice as often as they paid for. Stated explicitly rather
 * than folded into the spot count, because the two are different promises and
 * only one of them is contractual.
 */
export function totalAiringsPerMonth(key: SponsorPackageKey): number {
  return SPONSOR_PACKAGES[key].spotsPerMonth * 2;
}
