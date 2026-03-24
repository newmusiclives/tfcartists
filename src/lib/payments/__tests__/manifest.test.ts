import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// Mock dependencies before imports
vi.mock("@/lib/env", () => ({
  env: {
    MANIFEST_API_KEY: "test_key_123",
    MANIFEST_WEBHOOK_SECRET: "whsec_test_secret",
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/messaging/notifications", () => ({
  notifySubscriptionActivated: vi.fn(),
  notifyEarningsAvailable: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    artist: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    radioEarnings: {
      updateMany: vi.fn(),
    },
  },
}));

// Must import after mocks
import { manifest } from "../manifest";
import { notifySubscriptionActivated, notifyEarningsAvailable } from "@/lib/messaging/notifications";
import { prisma } from "@/lib/db";

describe("ManifestFinancial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("isConfigured", () => {
    it("returns true when API key is set", () => {
      expect(manifest.isConfigured()).toBe(true);
    });
  });

  describe("Airplay Subscription Tier Pricing", () => {
    // Test the pricing logic by verifying the API calls made during subscription creation
    const tiers = [
      { tier: "TIER_5" as const, expectedAmount: 500, name: "$5/month" },
      { tier: "TIER_20" as const, expectedAmount: 2000, name: "$20/month" },
      { tier: "TIER_50" as const, expectedAmount: 5000, name: "$50/month" },
      { tier: "TIER_120" as const, expectedAmount: 12000, name: "$120/month" },
    ];

    for (const { tier, expectedAmount, name } of tiers) {
      it(`creates ${name} subscription for ${tier} with amount ${expectedAmount} cents`, async () => {
        const mockFetch = vi.fn()
          // First call: createCustomer
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: "cust_123", email: "artist@test.com" }),
          })
          // Second call: createSubscription
          .mockResolvedValueOnce({
            ok: true,
            json: () =>
              Promise.resolve({
                id: "sub_123",
                customerId: "cust_123",
                planId: `airplay_${tier.toLowerCase()}`,
                amount: expectedAmount,
              }),
          });

        vi.stubGlobal("fetch", mockFetch);

        const result = await manifest.createAirplaySubscription({
          artistId: "artist_1",
          tier,
          email: "artist@test.com",
          name: "Test Artist",
        });

        expect(result.subscriptionId).toBe("sub_123");
        expect(result.checkoutUrl).toContain("sub_123");

        // Verify subscription was created with correct amount
        const subCall = mockFetch.mock.calls[1];
        const subBody = JSON.parse(subCall[1].body);
        expect(subBody.amount).toBe(expectedAmount);
        expect(subBody.planId).toBe(`airplay_${tier.toLowerCase()}`);
        expect(subBody.currency).toBe("usd");
        expect(subBody.interval).toBe("month");
        expect(subBody.metadata.artistId).toBe("artist_1");
        expect(subBody.metadata.tier).toBe(tier);
      });
    }
  });

  describe("Sponsorship Subscription Tier Pricing", () => {
    const sponsorTiers = [
      { tier: "bronze" as const, expectedAmount: 10000 },
      { tier: "silver" as const, expectedAmount: 25000 },
      { tier: "gold" as const, expectedAmount: 40000 },
      { tier: "platinum" as const, expectedAmount: 50000 },
    ];

    for (const { tier, expectedAmount } of sponsorTiers) {
      it(`creates ${tier} sponsorship with amount ${expectedAmount} cents`, async () => {
        const mockFetch = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: "cust_sponsor" }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: "sub_sponsor_123" }),
          });

        vi.stubGlobal("fetch", mockFetch);

        const result = await manifest.createSponsorshipSubscription({
          sponsorId: "sponsor_1",
          tier,
          email: "biz@test.com",
          businessName: "Test Biz",
        });

        expect(result.subscriptionId).toBe("sub_sponsor_123");

        const subBody = JSON.parse(mockFetch.mock.calls[1][1].body);
        expect(subBody.amount).toBe(expectedAmount);
        expect(subBody.planId).toBe(`sponsor_${tier}`);
        expect(subBody.metadata.type).toBe("sponsorship");
      });
    }
  });

  describe("createArtistPayout", () => {
    it("converts dollar amount to cents for API call", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "po_123",
            amount: 5000,
            destination: "ba_123",
            status: "pending",
          }),
      });

      vi.stubGlobal("fetch", mockFetch);

      const result = await manifest.createArtistPayout({
        artistId: "artist_1",
        amount: 50.0,
        bankAccountId: "ba_123",
        period: "2025-01",
      });

      expect(result.id).toBe("po_123");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.amount).toBe(5000); // $50.00 = 5000 cents
      expect(body.currency).toBe("usd");
      expect(body.destination).toBe("ba_123");
      expect(body.metadata.type).toBe("radio_earnings");
    });

    it("rounds fractional cents correctly", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "po_456", amount: 1235, destination: "ba_1", status: "pending" }),
      });

      vi.stubGlobal("fetch", mockFetch);

      await manifest.createArtistPayout({
        artistId: "a1",
        amount: 12.345,
        bankAccountId: "ba_1",
        period: "2025-02",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Math.round(12.345 * 100) = 1235
      expect(body.amount).toBe(1235);
    });

    it("handles zero-dollar payout", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "po_0", amount: 0, destination: "ba_1", status: "pending" }),
      });

      vi.stubGlobal("fetch", mockFetch);

      await manifest.createArtistPayout({
        artistId: "a1",
        amount: 0,
        bankAccountId: "ba_1",
        period: "2025-03",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.amount).toBe(0);
    });
  });

  describe("API request error handling", () => {
    it("throws when API key is not configured", async () => {
      // Create a new instance without API key
      vi.resetModules();
      vi.doMock("@/lib/env", () => ({
        env: { MANIFEST_API_KEY: undefined, MANIFEST_WEBHOOK_SECRET: "secret" },
      }));
      vi.doMock("@/lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));
      vi.doMock("@/lib/messaging/notifications", () => ({
        notifySubscriptionActivated: vi.fn(),
        notifyEarningsAvailable: vi.fn(),
      }));

      const { manifest: unconfigured } = await import("../manifest");
      expect(unconfigured.isConfigured()).toBe(false);

      await expect(
        unconfigured.createCustomer({ email: "test@test.com" })
      ).rejects.toThrow("Manifest API key not configured");
    });

    it("throws on non-OK HTTP response", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ message: "Invalid email format" }),
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(
        manifest.createCustomer({ email: "bad" })
      ).rejects.toThrow("Manifest API error: Invalid email format");
    });

    it("handles non-JSON error responses gracefully", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("not json")),
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(
        manifest.createCustomer({ email: "test@test.com" })
      ).rejects.toThrow("Manifest API error: Unknown error");
    });
  });

  describe("handleWebhook - Signature Verification", () => {
    function generateSignature(payload: string, secret: string): string {
      return "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
    }

    it("verifies valid webhook signature", async () => {
      const payload = JSON.stringify({ type: "payment.succeeded", data: { id: "pay_1" } });
      const signature = generateSignature(payload, "whsec_test_secret");

      const result = await manifest.handleWebhook(payload, signature);

      expect(result.event).toBe("payment.succeeded");
      expect(result.data.id).toBe("pay_1");
    });

    it("verifies signature without sha256= prefix", async () => {
      const payload = JSON.stringify({ type: "test.event", data: {} });
      const rawSig = crypto.createHmac("sha256", "whsec_test_secret").update(payload).digest("hex");

      const result = await manifest.handleWebhook(payload, rawSig);
      expect(result.event).toBe("test.event");
    });

    it("rejects invalid webhook signature", async () => {
      const payload = JSON.stringify({ type: "payment.succeeded", data: {} });
      const badSignature = "sha256=" + "a".repeat(64);

      await expect(
        manifest.handleWebhook(payload, badSignature)
      ).rejects.toThrow("Invalid webhook signature");
    });

    it("rejects empty signature", async () => {
      const payload = JSON.stringify({ type: "test", data: {} });

      await expect(
        manifest.handleWebhook(payload, "")
      ).rejects.toThrow("Invalid webhook signature");
    });

    it("rejects tampered payload", async () => {
      const originalPayload = JSON.stringify({ type: "payment.succeeded", data: { amount: 100 } });
      const signature = generateSignature(originalPayload, "whsec_test_secret");

      const tamperedPayload = JSON.stringify({ type: "payment.succeeded", data: { amount: 999999 } });

      await expect(
        manifest.handleWebhook(tamperedPayload, signature)
      ).rejects.toThrow("Invalid webhook signature");
    });

    it("throws when webhook secret is not configured", async () => {
      vi.resetModules();
      vi.doMock("@/lib/env", () => ({
        env: { MANIFEST_API_KEY: "key", MANIFEST_WEBHOOK_SECRET: undefined },
      }));
      vi.doMock("@/lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));
      vi.doMock("@/lib/messaging/notifications", () => ({
        notifySubscriptionActivated: vi.fn(),
        notifyEarningsAvailable: vi.fn(),
      }));

      const { manifest: noSecret } = await import("../manifest");

      await expect(
        noSecret.handleWebhook("{}", "sha256=abc")
      ).rejects.toThrow("Manifest webhook secret not configured");
    });
  });

  describe("processWebhookEvent", () => {
    it("handles subscription.created for airplay artists", async () => {
      const mockArtist = { id: "a1", email: "artist@test.com", name: "Test Artist" };
      vi.mocked(prisma.artist.findUnique).mockResolvedValue(mockArtist as any);

      await manifest.processWebhookEvent("subscription.created", {
        id: "sub_1",
        metadata: { type: "airplay", artistId: "a1", tier: "TIER_20" },
      });

      expect(notifySubscriptionActivated).toHaveBeenCalledWith({
        email: "artist@test.com",
        name: "Test Artist",
        tier: "TIER_20",
        amount: 20,
        shares: 25,
      });
    });

    it("handles subscription.cancelled by downgrading to FREE", async () => {
      await manifest.processWebhookEvent("subscription.cancelled", {
        id: "sub_1",
        metadata: { artistId: "a1" },
      });

      expect(prisma.artist.update).toHaveBeenCalledWith({
        where: { id: "a1" },
        data: { airplayTier: "FREE", airplayShares: 1 },
      });
    });

    it("handles subscription.updated by updating artist tier", async () => {
      await manifest.processWebhookEvent("subscription.updated", {
        id: "sub_1",
        metadata: { artistId: "a1", tier: "TIER_50" },
      });

      expect(prisma.artist.update).toHaveBeenCalledWith({
        where: { id: "a1" },
        data: { airplayTier: "TIER_50" },
      });
    });

    it("handles payout.paid by marking earnings as paid and notifying", async () => {
      const mockArtist = {
        id: "a1",
        email: "artist@test.com",
        name: "Paid Artist",
        airplayTier: "TIER_20",
        airplayShares: 25,
      };
      vi.mocked(prisma.artist.findUnique).mockResolvedValue(mockArtist as any);
      vi.mocked(prisma.radioEarnings.updateMany).mockResolvedValue({ count: 1 } as any);

      await manifest.processWebhookEvent("payout.paid", {
        id: "po_1",
        amount: 5000, // cents
        metadata: { artistId: "a1", period: "2025-01" },
      });

      expect(prisma.radioEarnings.updateMany).toHaveBeenCalledWith({
        where: { artistId: "a1", period: "2025-01" },
        data: { paid: true, paidAt: expect.any(Date) },
      });

      expect(notifyEarningsAvailable).toHaveBeenCalledWith({
        email: "artist@test.com",
        artistName: "Paid Artist",
        period: "2025-01",
        earnings: 50, // 5000 cents / 100
        tier: "TIER_20",
        shares: 25,
      });
    });

    it("skips notification when artist has no email on subscription.created", async () => {
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({ id: "a1", email: null } as any);

      await manifest.processWebhookEvent("subscription.created", {
        id: "sub_1",
        metadata: { type: "airplay", artistId: "a1", tier: "TIER_5" },
      });

      expect(notifySubscriptionActivated).not.toHaveBeenCalled();
    });

    it("does not crash on unknown event types", async () => {
      // Should just log a warning, not throw
      await expect(
        manifest.processWebhookEvent("unknown.event", { id: "x" })
      ).resolves.toBeUndefined();
    });

    it("handles subscription.cancelled without artistId metadata gracefully", async () => {
      // No artistId in metadata, so no update should be called
      await manifest.processWebhookEvent("subscription.cancelled", {
        id: "sub_1",
        metadata: {},
      });

      expect(prisma.artist.update).not.toHaveBeenCalled();
    });
  });

  describe("cancelSubscription", () => {
    it("sends DELETE request to correct endpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      vi.stubGlobal("fetch", mockFetch);

      await manifest.cancelSubscription("sub_cancel_123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.manifest.fin/v1/subscriptions/sub_cancel_123",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("getSubscription", () => {
    it("retrieves subscription by ID", async () => {
      const mockSub = { id: "sub_get_1", status: "active", amount: 2000 };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSub),
      });

      vi.stubGlobal("fetch", mockFetch);

      const result = await manifest.getSubscription("sub_get_1");
      expect(result).toEqual(mockSub);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.manifest.fin/v1/subscriptions/sub_get_1",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test_key_123",
          }),
        })
      );
    });
  });

  describe("Authorization header", () => {
    it("includes Bearer token in all API requests", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "cust_1" }),
      });

      vi.stubGlobal("fetch", mockFetch);

      await manifest.createCustomer({ email: "test@test.com" });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe("Bearer test_key_123");
      expect(headers["Content-Type"]).toBe("application/json");
    });
  });
});
