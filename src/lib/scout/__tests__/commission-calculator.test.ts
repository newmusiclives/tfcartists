import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("@/lib/db", () => ({
  prisma: {
    artistDiscovery: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    artist: {
      findUnique: vi.fn(),
    },
    listenerReferral: {
      findMany: vi.fn(),
    },
    listenerPlayback: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/radio/airplay-system", () => ({
  AIRPLAY_TIERS: {
    FREE: { name: "Free Airplay", price: 0, shares: 1 },
    TIER_5: { name: "Bronze Airplay", price: 5, shares: 5 },
    TIER_20: { name: "Silver Airplay", price: 20, shares: 25 },
    TIER_50: { name: "Gold Airplay", price: 50, shares: 75 },
    TIER_120: { name: "Platinum Airplay", price: 120, shares: 200 },
  },
}));

import {
  getCommissionRate,
  getCurrentPeriod,
  calculateScoutCommission,
  checkUpgradeBonus,
  checkNetworkInfluenceBonus,
  calculateAllScoutCommissions,
} from "../commission-calculator";
import { prisma } from "@/lib/db";

describe("Commission Calculator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCommissionRate", () => {
    it("returns 20% for first 3 months (month 0)", () => {
      expect(getCommissionRate({ isPrepurchase: false }, 0)).toBe(0.2);
    });

    it("returns 20% for month 1", () => {
      expect(getCommissionRate({ isPrepurchase: false }, 1)).toBe(0.2);
    });

    it("returns 20% for month 2", () => {
      expect(getCommissionRate({ isPrepurchase: false }, 2)).toBe(0.2);
    });

    it("returns 12% after month 3", () => {
      expect(getCommissionRate({ isPrepurchase: false }, 3)).toBe(0.12);
    });

    it("returns 12% at month 12", () => {
      expect(getCommissionRate({ isPrepurchase: false }, 12)).toBe(0.12);
    });

    it("returns 12% at month 100 (long-term residual)", () => {
      expect(getCommissionRate({ isPrepurchase: false }, 100)).toBe(0.12);
    });

    it("returns 25% lifetime for prepurchase conversions at month 0", () => {
      expect(getCommissionRate({ isPrepurchase: true }, 0)).toBe(0.25);
    });

    it("returns 25% lifetime for prepurchase conversions at month 3", () => {
      expect(getCommissionRate({ isPrepurchase: true }, 3)).toBe(0.25);
    });

    it("returns 25% lifetime for prepurchase conversions at month 50", () => {
      expect(getCommissionRate({ isPrepurchase: true }, 50)).toBe(0.25);
    });

    it("prepurchase always overrides the normal tier-based rate", () => {
      // Even at month 0 where normal is 20%, prepurchase gets 25%
      const prepurchase = getCommissionRate({ isPrepurchase: true }, 0);
      const normal = getCommissionRate({ isPrepurchase: false }, 0);
      expect(prepurchase).toBeGreaterThan(normal);
    });
  });

  describe("getCurrentPeriod", () => {
    it("returns current month in YYYY-MM format", () => {
      const period = getCurrentPeriod();
      expect(period).toMatch(/^\d{4}-\d{2}$/);
    });

    it("pads single-digit months with leading zero", () => {
      const period = getCurrentPeriod();
      const month = period.split("-")[1];
      expect(month.length).toBe(2);
    });
  });

  describe("calculateScoutCommission", () => {
    it("returns null when no discovery record exists", async () => {
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue(null);

      const result = await calculateScoutCommission("scout1", "artist1", "2025-01");
      expect(result).toBeNull();
    });

    it("returns null when artist has not converted", async () => {
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
        hasConverted: false,
        convertedAt: null,
        artist: { airplayTier: "FREE" },
      } as any);

      const result = await calculateScoutCommission("scout1", "artist1", "2025-01");
      expect(result).toBeNull();
    });

    it("returns null when converted artist is on FREE tier", async () => {
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
        hasConverted: true,
        convertedAt: new Date("2024-12-01"),
        isPrepurchase: false,
        artist: { airplayTier: "FREE" },
      } as any);

      const result = await calculateScoutCommission("scout1", "artist1", "2025-01");
      expect(result).toBeNull();
    });

    it("calculates 20% commission for TIER_5 in first 3 months", async () => {
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
        hasConverted: true,
        convertedAt: new Date("2025-01-15"),
        isPrepurchase: false,
        artist: { airplayTier: "TIER_5" },
      } as any);

      // No upgrade bonus
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        lastTierUpgrade: null,
      } as any);

      // No network influence
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([]);

      const result = await calculateScoutCommission("scout1", "artist1", "2025-02");

      expect(result).not.toBeNull();
      expect(result!.commissionRate).toBe(0.2);
      expect(result!.artistPayment).toBe(5);
      expect(result!.commissionAmount).toBe(1); // 5 * 0.2
      expect(result!.monthsSinceConversion).toBe(0); // Jan 15 to Feb 1 = 0 full months
      expect(result!.bonusAmount).toBe(0);
      expect(result!.totalAmount).toBe(1);
    });

    it("calculates 12% commission for TIER_20 after 3 months", async () => {
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
        hasConverted: true,
        convertedAt: new Date("2024-06-01"),
        isPrepurchase: false,
        artist: { airplayTier: "TIER_20" },
      } as any);

      vi.mocked(prisma.artist.findUnique).mockResolvedValue({ lastTierUpgrade: null } as any);
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([]);

      const result = await calculateScoutCommission("scout1", "artist1", "2025-01");

      expect(result!.commissionRate).toBe(0.12);
      expect(result!.artistPayment).toBe(20);
      expect(result!.commissionAmount).toBeCloseTo(2.4); // 20 * 0.12
      expect(result!.monthsSinceConversion).toBe(7); // Jun to Jan = 7 months
    });

    it("calculates 25% lifetime commission for prepurchase on TIER_120", async () => {
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
        hasConverted: true,
        convertedAt: new Date("2023-01-01"),
        isPrepurchase: true,
        artist: { airplayTier: "TIER_120" },
      } as any);

      vi.mocked(prisma.artist.findUnique).mockResolvedValue({ lastTierUpgrade: null } as any);
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([]);

      const result = await calculateScoutCommission("scout1", "artist1", "2025-06");

      expect(result!.commissionRate).toBe(0.25);
      expect(result!.artistPayment).toBe(120);
      expect(result!.commissionAmount).toBe(30); // 120 * 0.25
    });

    it("adds $10 upgrade bonus when artist upgraded in the period", async () => {
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
        hasConverted: true,
        convertedAt: new Date("2025-01-01"),
        isPrepurchase: false,
        artist: { airplayTier: "TIER_50" },
      } as any);

      // Mock upgrade bonus check: artist upgraded in this period
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        lastTierUpgrade: new Date("2025-02-10"),
        airplayPayments: [
          { tier: "TIER_20", createdAt: new Date("2025-02-01") },
          { tier: "TIER_50", createdAt: new Date("2025-02-10") },
        ],
      } as any);

      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([]);

      const result = await calculateScoutCommission("scout1", "artist1", "2025-02");

      expect(result!.hasUpgradeBonus).toBe(true);
      expect(result!.bonusAmount).toBe(10);
      expect(result!.totalAmount).toBe(result!.commissionAmount + 10);
    });

    it("adds $2 network influence bonus when referred listeners played artist", async () => {
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
        hasConverted: true,
        convertedAt: new Date("2025-01-01"),
        isPrepurchase: false,
        artist: { airplayTier: "TIER_5" },
      } as any);

      // No upgrade bonus
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        lastTierUpgrade: new Date("2025-01-15"),
      } as any);

      // Has referred listeners
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([
        { listenerId: "listener1" },
        { listenerId: "listener2" },
      ] as any);

      // Referred listeners played the artist
      vi.mocked(prisma.listenerPlayback.count).mockResolvedValue(5);

      const result = await calculateScoutCommission("scout1", "artist1", "2025-02");

      expect(result!.hasInfluenceBonus).toBe(true);
      expect(result!.bonusAmount).toBe(2);
    });

    it("adds both upgrade and influence bonuses ($12 total)", async () => {
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
        hasConverted: true,
        convertedAt: new Date("2025-01-01"),
        isPrepurchase: false,
        artist: { airplayTier: "TIER_50" },
      } as any);

      // Upgrade bonus: yes
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        lastTierUpgrade: new Date("2025-02-15"),
        airplayPayments: [
          { tier: "TIER_20", createdAt: new Date("2025-02-01") },
          { tier: "TIER_50", createdAt: new Date("2025-02-15") },
        ],
      } as any);

      // Influence bonus: yes
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([
        { listenerId: "l1" },
      ] as any);
      vi.mocked(prisma.listenerPlayback.count).mockResolvedValue(3);

      const result = await calculateScoutCommission("scout1", "artist1", "2025-02");

      expect(result!.hasUpgradeBonus).toBe(true);
      expect(result!.hasInfluenceBonus).toBe(true);
      expect(result!.bonusAmount).toBe(12); // $10 + $2
    });
  });

  describe("checkUpgradeBonus", () => {
    it("returns false when artist has no lastTierUpgrade", async () => {
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        lastTierUpgrade: null,
        airplayPayments: [],
      } as any);

      const result = await checkUpgradeBonus("artist1", "2025-01");
      expect(result).toBe(false);
    });

    it("returns false when artist not found", async () => {
      vi.mocked(prisma.artist.findUnique).mockResolvedValue(null);

      const result = await checkUpgradeBonus("artist_nonexistent", "2025-01");
      expect(result).toBe(false);
    });

    it("returns false when upgrade was in a different period", async () => {
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        lastTierUpgrade: new Date("2024-12-15"), // December
        airplayPayments: [],
      } as any);

      const result = await checkUpgradeBonus("artist1", "2025-01"); // January
      expect(result).toBe(false);
    });

    it("returns true when artist upgraded tier in the same period", async () => {
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        lastTierUpgrade: new Date("2025-01-15"),
        airplayPayments: [
          { tier: "TIER_5", createdAt: new Date("2025-01-01") },
          { tier: "TIER_20", createdAt: new Date("2025-01-15") },
        ],
      } as any);

      const result = await checkUpgradeBonus("artist1", "2025-01");
      expect(result).toBe(true);
    });

    it("returns false when artist downgraded (not upgraded)", async () => {
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        lastTierUpgrade: new Date("2025-01-15"),
        airplayPayments: [
          { tier: "TIER_50", createdAt: new Date("2025-01-01") },
          { tier: "TIER_5", createdAt: new Date("2025-01-15") },
        ],
      } as any);

      const result = await checkUpgradeBonus("artist1", "2025-01");
      expect(result).toBe(false);
    });

    it("returns false when only one payment in period (first purchase, not upgrade)", async () => {
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        lastTierUpgrade: new Date("2025-01-10"),
        airplayPayments: [
          { tier: "TIER_5", createdAt: new Date("2025-01-10") },
        ],
      } as any);

      const result = await checkUpgradeBonus("artist1", "2025-01");
      expect(result).toBe(false);
    });
  });

  describe("checkNetworkInfluenceBonus", () => {
    it("returns false when scout has no referrals", async () => {
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([]);

      const result = await checkNetworkInfluenceBonus("scout1", "artist1", "2025-01");
      expect(result).toBe(false);
    });

    it("returns false when artist has no lastTierUpgrade", async () => {
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([
        { listenerId: "l1" },
      ] as any);
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        lastTierUpgrade: null,
      } as any);

      const result = await checkNetworkInfluenceBonus("scout1", "artist1", "2025-01");
      expect(result).toBe(false);
    });

    it("returns true when referred listeners played artist before upgrade", async () => {
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([
        { listenerId: "l1" },
        { listenerId: "l2" },
      ] as any);
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        lastTierUpgrade: new Date("2025-01-15"),
      } as any);
      vi.mocked(prisma.listenerPlayback.count).mockResolvedValue(3);

      const result = await checkNetworkInfluenceBonus("scout1", "artist1", "2025-01");
      expect(result).toBe(true);
    });

    it("returns false when no referred listeners played artist before upgrade", async () => {
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([
        { listenerId: "l1" },
      ] as any);
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        lastTierUpgrade: new Date("2025-01-15"),
      } as any);
      vi.mocked(prisma.listenerPlayback.count).mockResolvedValue(0);

      const result = await checkNetworkInfluenceBonus("scout1", "artist1", "2025-01");
      expect(result).toBe(false);
    });
  });

  describe("calculateAllScoutCommissions", () => {
    it("returns empty summary when scout has no converted discoveries", async () => {
      vi.mocked(prisma.artistDiscovery.findMany).mockResolvedValue([]);

      const result = await calculateAllScoutCommissions("scout1", "2025-01");

      expect(result.totalCommissions).toBe(0);
      expect(result.totalBonuses).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.commissionCount).toBe(0);
      expect(result.commissions).toEqual([]);
    });

    it("aggregates commissions across multiple converted artists", async () => {
      // Two converted artists
      vi.mocked(prisma.artistDiscovery.findMany).mockResolvedValue([
        { artistId: "a1" },
        { artistId: "a2" },
      ] as any);

      // For calculateScoutCommission calls:
      vi.mocked(prisma.artistDiscovery.findUnique)
        .mockResolvedValueOnce({
          hasConverted: true,
          convertedAt: new Date("2025-01-01"),
          isPrepurchase: false,
          artist: { airplayTier: "TIER_5" },
        } as any)
        .mockResolvedValueOnce({
          hasConverted: true,
          convertedAt: new Date("2025-01-01"),
          isPrepurchase: false,
          artist: { airplayTier: "TIER_20" },
        } as any);

      // No bonuses
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({ lastTierUpgrade: null } as any);
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([]);

      const result = await calculateAllScoutCommissions("scout1", "2025-02");

      expect(result.commissionCount).toBe(2);
      // TIER_5: $5 * 0.2 = $1, TIER_20: $20 * 0.2 = $4
      expect(result.totalCommissions).toBe(5);
      expect(result.totalBonuses).toBe(0);
      expect(result.totalAmount).toBe(5);
    });

    it("skips artists that return null from calculateScoutCommission", async () => {
      vi.mocked(prisma.artistDiscovery.findMany).mockResolvedValue([
        { artistId: "a1" },
      ] as any);

      // Artist on FREE tier => returns null
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
        hasConverted: true,
        convertedAt: new Date("2025-01-01"),
        isPrepurchase: false,
        artist: { airplayTier: "FREE" },
      } as any);

      const result = await calculateAllScoutCommissions("scout1", "2025-02");

      expect(result.commissionCount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });

  describe("Months difference calculation (via calculateScoutCommission)", () => {
    // These tests verify the getMonthsDifference logic through the public API

    it("conversion on Jan 15 with period Feb = 0 months (not a full month)", async () => {
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
        hasConverted: true,
        convertedAt: new Date("2025-01-15"),
        isPrepurchase: false,
        artist: { airplayTier: "TIER_5" },
      } as any);
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({ lastTierUpgrade: null } as any);
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([]);

      const result = await calculateScoutCommission("s1", "a1", "2025-02");
      // Feb 1 - Jan 15: dayDiff = 1 - 15 = -14, so months = 1 - 1 = 0
      expect(result!.monthsSinceConversion).toBe(0);
      expect(result!.commissionRate).toBe(0.2); // Still in first 3 months
    });

    it("conversion on Jan 1 with period Apr = 3 months (exits high commission)", async () => {
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
        hasConverted: true,
        convertedAt: new Date("2025-01-01"),
        isPrepurchase: false,
        artist: { airplayTier: "TIER_20" },
      } as any);
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({ lastTierUpgrade: null } as any);
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([]);

      const result = await calculateScoutCommission("s1", "a1", "2025-04");
      // Apr 1 - Jan 1 = exactly 3 months
      expect(result!.monthsSinceConversion).toBe(3);
      expect(result!.commissionRate).toBe(0.12); // Dropped to residual
    });

    it("conversion Dec 31 to Jan 1 = 0 months (cross-year boundary)", async () => {
      vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
        hasConverted: true,
        convertedAt: new Date("2024-12-31"),
        isPrepurchase: false,
        artist: { airplayTier: "TIER_5" },
      } as any);
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({ lastTierUpgrade: null } as any);
      vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([]);

      const result = await calculateScoutCommission("s1", "a1", "2025-01");
      // Jan 1 - Dec 31: yearDiff=1, monthDiff=-11, dayDiff=1-31=-30
      // months = 1*12 + (-11) = 1, then dayDiff < 0 so months = 0
      expect(result!.monthsSinceConversion).toBe(0);
    });
  });

  describe("Commission amounts for each tier", () => {
    const testCases = [
      { tier: "TIER_5", price: 5, rate20: 1.0, rate12: 0.6, rate25: 1.25 },
      { tier: "TIER_20", price: 20, rate20: 4.0, rate12: 2.4, rate25: 5.0 },
      { tier: "TIER_50", price: 50, rate20: 10.0, rate12: 6.0, rate25: 12.5 },
      { tier: "TIER_120", price: 120, rate20: 24.0, rate12: 14.4, rate25: 30.0 },
    ];

    for (const tc of testCases) {
      it(`${tc.tier}: 20% = $${tc.rate20}, 12% = $${tc.rate12}, 25% = $${tc.rate25}`, async () => {
        // Test 20% rate (month 0)
        vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
          hasConverted: true,
          convertedAt: new Date("2025-01-01"),
          isPrepurchase: false,
          artist: { airplayTier: tc.tier },
        } as any);
        vi.mocked(prisma.artist.findUnique).mockResolvedValue({ lastTierUpgrade: null } as any);
        vi.mocked(prisma.listenerReferral.findMany).mockResolvedValue([]);

        const result20 = await calculateScoutCommission("s1", "a1", "2025-01");
        expect(result20!.commissionAmount).toBe(tc.rate20);

        // Test 10% rate (month 6)
        vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
          hasConverted: true,
          convertedAt: new Date("2024-06-01"),
          isPrepurchase: false,
          artist: { airplayTier: tc.tier },
        } as any);

        const result10 = await calculateScoutCommission("s1", "a1", "2025-01");
        expect(result10!.commissionAmount).toBe(tc.rate12);

        // Test 25% prepurchase rate
        vi.mocked(prisma.artistDiscovery.findUnique).mockResolvedValue({
          hasConverted: true,
          convertedAt: new Date("2025-01-01"),
          isPrepurchase: true,
          artist: { airplayTier: tc.tier },
        } as any);

        const result25 = await calculateScoutCommission("s1", "a1", "2025-01");
        expect(result25!.commissionAmount).toBe(tc.rate25);
      });
    }
  });
});
