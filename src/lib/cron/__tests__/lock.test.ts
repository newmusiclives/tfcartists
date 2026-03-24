import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/db", () => ({
  prisma: {
    config: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { acquireCronLock, releaseCronLock, withCronLock } from "../lock";
import { prisma } from "@/lib/db";

const mockPrisma = vi.mocked(prisma);

// ── Tests ──────────────────────────────────────────────────────────────────

describe("cron lock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("acquireCronLock", () => {
    it("acquires lock when no existing lock", async () => {
      mockPrisma.config.findUnique.mockResolvedValue(null);
      mockPrisma.config.upsert.mockResolvedValue({});

      const acquired = await acquireCronLock("generate-playlists");

      expect(acquired).toBe(true);
      expect(mockPrisma.config.upsert).toHaveBeenCalledTimes(1);
      const upsertCall = mockPrisma.config.upsert.mock.calls[0][0];
      expect(upsertCall.where.key).toBe("cron_lock:generate-playlists");
    });

    it("prevents double-lock when job is already running", async () => {
      // Lock was created recently (within 10-minute timeout)
      mockPrisma.config.findUnique.mockResolvedValue({
        key: "cron_lock:generate-playlists",
        value: String(Date.now() - 5000), // 5 seconds ago
      });

      const acquired = await acquireCronLock("generate-playlists");

      expect(acquired).toBe(false);
      expect(mockPrisma.config.upsert).not.toHaveBeenCalled();
    });

    it("re-acquires expired lock", async () => {
      // Lock was created 11 minutes ago (beyond 10-minute timeout)
      const elevenMinutesAgo = Date.now() - 11 * 60 * 1000;
      mockPrisma.config.findUnique.mockResolvedValue({
        key: "cron_lock:generate-playlists",
        value: String(elevenMinutesAgo),
      });
      mockPrisma.config.upsert.mockResolvedValue({});

      const acquired = await acquireCronLock("generate-playlists");

      expect(acquired).toBe(true);
      expect(mockPrisma.config.upsert).toHaveBeenCalledTimes(1);
    });

    it("returns true on database errors (does not block execution)", async () => {
      mockPrisma.config.findUnique.mockRejectedValue(new Error("DB connection lost"));

      const acquired = await acquireCronLock("generate-playlists");

      expect(acquired).toBe(true);
    });

    it("correctly checks boundary of lock timeout", async () => {
      // Lock created exactly at the timeout boundary (10 minutes ago)
      const exactlyTenMinutes = Date.now() - 10 * 60 * 1000;
      mockPrisma.config.findUnique.mockResolvedValue({
        key: "cron_lock:test-job",
        value: String(exactlyTenMinutes),
      });
      mockPrisma.config.upsert.mockResolvedValue({});

      // At exactly 10 minutes, Date.now() - lockTime === LOCK_TIMEOUT_MS,
      // so the condition (< LOCK_TIMEOUT_MS) is false, meaning lock IS expired
      const acquired = await acquireCronLock("test-job");
      expect(acquired).toBe(true);
    });
  });

  describe("releaseCronLock", () => {
    it("deletes the lock key", async () => {
      mockPrisma.config.deleteMany.mockResolvedValue({ count: 1 });

      await releaseCronLock("generate-playlists");

      expect(mockPrisma.config.deleteMany).toHaveBeenCalledWith({
        where: { key: "cron_lock:generate-playlists" },
      });
    });

    it("does not throw on database errors", async () => {
      mockPrisma.config.deleteMany.mockRejectedValue(new Error("DB error"));

      // Should not throw
      await expect(releaseCronLock("any-job")).resolves.toBeUndefined();
    });
  });

  describe("withCronLock", () => {
    it("acquires lock, runs handler, and releases lock", async () => {
      mockPrisma.config.findUnique.mockResolvedValue(null);
      mockPrisma.config.upsert.mockResolvedValue({});
      mockPrisma.config.deleteMany.mockResolvedValue({ count: 1 });

      const handler = vi.fn().mockResolvedValue(
        Response.json({ success: true })
      );

      const response = await withCronLock("test-job", handler);
      const body = await response.json();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(body.success).toBe(true);
      // Lock should be released
      expect(mockPrisma.config.deleteMany).toHaveBeenCalledWith({
        where: { key: "cron_lock:test-job" },
      });
    });

    it("returns skip response when lock cannot be acquired", async () => {
      // Lock is held
      mockPrisma.config.findUnique.mockResolvedValue({
        key: "cron_lock:test-job",
        value: String(Date.now()),
      });

      const handler = vi.fn();
      const response = await withCronLock("test-job", handler);
      const body = await response.json();

      expect(handler).not.toHaveBeenCalled();
      expect(body.success).toBe(false);
      expect(body.message).toContain("already running");
    });

    it("releases lock even when handler throws", async () => {
      mockPrisma.config.findUnique.mockResolvedValue(null);
      mockPrisma.config.upsert.mockResolvedValue({});
      mockPrisma.config.deleteMany.mockResolvedValue({ count: 1 });

      const handler = vi.fn().mockRejectedValue(new Error("Handler crashed"));

      await expect(
        withCronLock("test-job", handler)
      ).rejects.toThrow("Handler crashed");

      // Lock should still be released (finally block)
      expect(mockPrisma.config.deleteMany).toHaveBeenCalledWith({
        where: { key: "cron_lock:test-job" },
      });
    });
  });
});
