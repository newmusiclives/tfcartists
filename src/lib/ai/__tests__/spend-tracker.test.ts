import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/db", () => ({
  prisma: {
    config: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { trackAiSpend, isAiSpendLimitReached, getTodaySpend } from "../spend-tracker";
import { prisma } from "@/lib/db";

const mockPrisma = vi.mocked(prisma);

// ── Tests ──────────────────────────────────────────────────────────────────

describe("spend-tracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trackAiSpend", () => {
    it("creates a new spend entry when none exists for today", async () => {
      mockPrisma.config.findUnique.mockResolvedValue(null);
      mockPrisma.config.upsert.mockResolvedValue({});

      await trackAiSpend({
        provider: "openai",
        operation: "tts",
        cost: 0.05,
      });

      expect(mockPrisma.config.upsert).toHaveBeenCalledTimes(1);
      const call = mockPrisma.config.upsert.mock.calls[0][0];
      expect(call.where.key).toMatch(/^ai_spend:\d{4}-\d{2}-\d{2}$/);
      expect(call.create.value).toBe("0.05");
    });

    it("accumulates spend on existing entry", async () => {
      // getSpendValue returns "1.50" (existing spend)
      mockPrisma.config.findUnique.mockResolvedValue({ value: "1.50" });
      mockPrisma.config.upsert.mockResolvedValue({});

      await trackAiSpend({
        provider: "anthropic",
        operation: "chat",
        cost: 0.25,
      });

      expect(mockPrisma.config.upsert).toHaveBeenCalledTimes(1);
      const call = mockPrisma.config.upsert.mock.calls[0][0];
      // Should be 1.50 + 0.25 = 1.75
      expect(parseFloat(call.update.value)).toBeCloseTo(1.75);
    });

    it("does not throw on database errors", async () => {
      mockPrisma.config.findUnique.mockRejectedValue(new Error("DB connection failed"));

      // Should not throw — tracking failures are silently swallowed
      await expect(
        trackAiSpend({ provider: "openai", operation: "tts", cost: 0.10 })
      ).resolves.toBeUndefined();
    });
  });

  describe("isAiSpendLimitReached", () => {
    it("returns false when spend is under limit", async () => {
      mockPrisma.config.findUnique.mockResolvedValue({ value: "5.00" });

      const result = await isAiSpendLimitReached();
      expect(result).toBe(false);
    });

    it("returns true when spend reaches the limit", async () => {
      // Default limit is $10
      mockPrisma.config.findUnique.mockResolvedValue({ value: "10.00" });

      const result = await isAiSpendLimitReached();
      expect(result).toBe(true);
    });

    it("returns true when spend exceeds the limit", async () => {
      mockPrisma.config.findUnique.mockResolvedValue({ value: "15.50" });

      const result = await isAiSpendLimitReached();
      expect(result).toBe(true);
    });

    it("returns false when no spend record exists", async () => {
      mockPrisma.config.findUnique.mockResolvedValue(null);

      const result = await isAiSpendLimitReached();
      expect(result).toBe(false);
    });

    it("returns false on database errors (does not block AI calls)", async () => {
      mockPrisma.config.findUnique.mockRejectedValue(new Error("DB timeout"));

      const result = await isAiSpendLimitReached();
      expect(result).toBe(false);
    });
  });

  describe("getTodaySpend", () => {
    it("returns parsed numeric spend value", async () => {
      mockPrisma.config.findUnique.mockResolvedValue({ value: "7.25" });

      const spend = await getTodaySpend();
      expect(spend).toBe(7.25);
    });

    it("returns 0 when no spend record exists", async () => {
      mockPrisma.config.findUnique.mockResolvedValue(null);

      const spend = await getTodaySpend();
      expect(spend).toBe(0);
    });
  });
});
