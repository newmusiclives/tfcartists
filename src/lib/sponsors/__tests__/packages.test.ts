import { describe, it, expect } from "vitest";
import {
  SPONSOR_PACKAGES,
  SPONSOR_PACKAGE_LIST,
  packageAmountInCents,
  resolveSponsorPackage,
  totalAiringsPerMonth,
  isSponsorPackageKey,
} from "../packages";
import { SPONSOR_PRICING, SPONSOR_AD_SPOTS, calculateMonthlyAirtime } from "@/lib/calculations/station-capacity";

describe("sponsor packages", () => {
  it("charges exactly the advertised price", () => {
    for (const p of SPONSOR_PACKAGE_LIST) {
      expect(packageAmountInCents(p.key)).toBe(p.price * 100);
    }
  });

  it("agrees with the rate card the revenue model prices against", () => {
    // These were separate tables. The model quoted $45-$279 while the payment
    // layer charged $100-$500 under different names.
    expect(SPONSOR_PRICING.LOCAL_HERO).toBe(SPONSOR_PACKAGES.LOCAL_HERO.price);
    expect(SPONSOR_PRICING.TIER_1).toBe(SPONSOR_PACKAGES.TIER_1.price);
    expect(SPONSOR_PRICING.TIER_2).toBe(SPONSOR_PACKAGES.TIER_2.price);
    expect(SPONSOR_PRICING.TIER_3).toBe(SPONSOR_PACKAGES.TIER_3.price);

    expect(SPONSOR_AD_SPOTS.LOCAL_HERO).toBe(SPONSOR_PACKAGES.LOCAL_HERO.spotsPerMonth);
    expect(SPONSOR_AD_SPOTS.TIER_3).toBe(SPONSOR_PACKAGES.TIER_3.spotsPerMonth);
  });

  it("is a real volume ladder - every step is cheaper per spot", () => {
    // Before the repricing, Tier 1 cost MORE per spot than the entry package,
    // so the cheapest way to buy 60 spots was two Local Heroes.
    const perSpot = SPONSOR_PACKAGE_LIST.map((p) => p.price / p.spotsPerMonth);
    for (let i = 1; i < perSpot.length; i++) {
      expect(perSpot[i]).toBeLessThan(perSpot[i - 1]);
    }
  });

  it("keeps spots per day and per month consistent over a 30-day month", () => {
    for (const p of SPONSOR_PACKAGE_LIST) {
      expect(p.spotsPerMonth).toBe(p.spotsPerDay * 30);
    }
  });

  it("delivers a free overnight airing for every paid spot", () => {
    for (const p of SPONSOR_PACKAGE_LIST) {
      expect(totalAiringsPerMonth(p.key)).toBe(p.spotsPerMonth * 2);
    }
  });

  it("resolves the legacy spellings still stored in the database", () => {
    expect(resolveSponsorPackage("local_hero")?.key).toBe("LOCAL_HERO");
    expect(resolveSponsorPackage("tier_3")?.key).toBe("TIER_3");
    // The payment layer's old names, so existing sponsor rows keep working.
    expect(resolveSponsorPackage("bronze")?.key).toBe("LOCAL_HERO");
    expect(resolveSponsorPackage("platinum")?.key).toBe("TIER_3");
    expect(resolveSponsorPackage("LOCAL_HERO")?.key).toBe("LOCAL_HERO");
  });

  it("rejects an unknown package instead of guessing", () => {
    expect(resolveSponsorPackage("diamond")).toBeNull();
    expect(resolveSponsorPackage("")).toBeNull();
    expect(isSponsorPackageKey("bronze")).toBe(false);
  });

  it("cannot oversell the sellable inventory at the modelled mix", () => {
    // The whole defect this replaced: the mix required 13,380 spots against
    // 2,160 the station actually aired.
    const air = calculateMonthlyAirtime();
    const mix = { LOCAL_HERO: 20, TIER_1: 12, TIER_2: 14, TIER_3: 7 };
    const spotsNeeded =
      mix.LOCAL_HERO * SPONSOR_PACKAGES.LOCAL_HERO.spotsPerMonth +
      mix.TIER_1 * SPONSOR_PACKAGES.TIER_1.spotsPerMonth +
      mix.TIER_2 * SPONSOR_PACKAGES.TIER_2.spotsPerMonth +
      mix.TIER_3 * SPONSOR_PACKAGES.TIER_3.spotsPerMonth;

    expect(spotsNeeded).toBeLessThanOrEqual(air.sellableMonthlyAdSpots);
    // And leaves room for sponsored hours and the week takeover.
    expect(spotsNeeded / air.sellableMonthlyAdSpots).toBeLessThan(0.85);
  });

  it("sells only the daytime hours", () => {
    const air = calculateMonthlyAirtime();
    expect(air.sellableMonthlyAdSpots).toBe(7200);
    expect(air.bonusMonthlyAdSpots).toBe(7200);
    expect(air.totalMonthlyAdSpots).toBe(14400);
  });
});
