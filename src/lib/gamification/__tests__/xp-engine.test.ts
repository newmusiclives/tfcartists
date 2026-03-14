import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("@/lib/db", () => ({
  prisma: {
    xPTransaction: {
      create: vi.fn(),
    },
    listener: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    artist: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    badge: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  XP_ACTIONS,
  calculateLevel,
  xpToNextLevel,
  awardXP,
  checkBadges,
  getLeaderboard,
} from "../xp-engine";
import { prisma } from "@/lib/db";

describe("XP Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("XP_ACTIONS constants", () => {
    it("defines correct XP amounts for listener actions", () => {
      expect(XP_ACTIONS.listen_session).toBe(10);
      expect(XP_ACTIONS.daily_streak).toBe(5);
      expect(XP_ACTIONS.streak_7_day).toBe(50);
      expect(XP_ACTIONS.streak_30_day).toBe(200);
      expect(XP_ACTIONS.streak_90_day).toBe(500);
      expect(XP_ACTIONS.referral).toBe(100);
      expect(XP_ACTIONS.referral_listen_1hr).toBe(25);
    });

    it("defines correct XP amounts for embed actions", () => {
      expect(XP_ACTIONS.embed_play).toBe(5);
      expect(XP_ACTIONS.embed_100_plays).toBe(500);
      expect(XP_ACTIONS.embed_new_listener).toBe(50);
    });

    it("defines correct XP amounts for artist actions", () => {
      expect(XP_ACTIONS.tier_upgrade).toBe(200);
    });

    it("defines correct XP amounts for sponsor actions", () => {
      expect(XP_ACTIONS.sponsor_listener_referral).toBe(20);
      expect(XP_ACTIONS.sponsor_back_artist).toBe(100);
    });
  });

  describe("calculateLevel", () => {
    // Formula: xpForLevel(n) = 50 * n * (n - 1) for n >= 2, 0 for n <= 1
    // Level 1: 0 XP
    // Level 2: 50 * 2 * 1 = 100 XP
    // Level 3: 50 * 3 * 2 = 300 XP
    // Level 4: 50 * 4 * 3 = 600 XP
    // Level 5: 50 * 5 * 4 = 1000 XP

    it("returns level 1 for 0 XP", () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it("returns level 1 for 99 XP (just below level 2 threshold)", () => {
      expect(calculateLevel(99)).toBe(1);
    });

    it("returns level 2 at exactly 100 XP", () => {
      expect(calculateLevel(100)).toBe(2);
    });

    it("returns level 2 for 299 XP (just below level 3)", () => {
      expect(calculateLevel(299)).toBe(2);
    });

    it("returns level 3 at exactly 300 XP", () => {
      expect(calculateLevel(300)).toBe(3);
    });

    it("returns level 4 at exactly 600 XP", () => {
      expect(calculateLevel(600)).toBe(4);
    });

    it("returns level 5 at exactly 1000 XP", () => {
      expect(calculateLevel(1000)).toBe(5);
    });

    it("handles very large XP values", () => {
      // Level 10: 50 * 10 * 9 = 4500
      expect(calculateLevel(4500)).toBe(10);
      expect(calculateLevel(4499)).toBe(9);
    });

    it("returns level 1 for negative XP (defensive)", () => {
      expect(calculateLevel(-100)).toBe(1);
    });

    it("levels increase monotonically", () => {
      let prevLevel = 0;
      for (let xp = 0; xp <= 10000; xp += 50) {
        const level = calculateLevel(xp);
        expect(level).toBeGreaterThanOrEqual(prevLevel);
        prevLevel = level;
      }
    });
  });

  describe("xpToNextLevel", () => {
    it("returns correct progress for level 1 (0 XP)", () => {
      const result = xpToNextLevel(0);
      expect(result.currentLevel).toBe(1);
      expect(result.nextLevelXp).toBe(100); // Level 2 threshold
      expect(result.progress).toBe(0); // 0/100
    });

    it("returns correct progress halfway through level 1", () => {
      const result = xpToNextLevel(50);
      expect(result.currentLevel).toBe(1);
      expect(result.nextLevelXp).toBe(100);
      expect(result.progress).toBe(0.5); // 50/100
    });

    it("returns 0 progress at start of level 2", () => {
      const result = xpToNextLevel(100);
      expect(result.currentLevel).toBe(2);
      // Level 2 = 100, Level 3 = 300, so progress = 0/200 = 0
      expect(result.progress).toBe(0);
    });

    it("returns correct progress mid-level 2", () => {
      const result = xpToNextLevel(200);
      expect(result.currentLevel).toBe(2);
      // Level 2 = 100, Level 3 = 300, progress = (200-100)/(300-100) = 100/200 = 0.5
      expect(result.progress).toBe(0.5);
    });

    it("progress is always between 0 and 1", () => {
      for (const xp of [0, 1, 50, 99, 100, 150, 250, 300, 500, 1000, 5000]) {
        const result = xpToNextLevel(xp);
        expect(result.progress).toBeGreaterThanOrEqual(0);
        expect(result.progress).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("awardXP", () => {
    it("creates an XP transaction record", async () => {
      vi.mocked(prisma.xPTransaction.create).mockResolvedValue({} as any);
      vi.mocked(prisma.listener.update).mockResolvedValue({
        id: "l1",
        xpTotal: 110,
        xpLevel: 1,
      } as any);

      await awardXP("l1", "listener", "listen_session", 10);

      expect(prisma.xPTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: "l1",
          userType: "listener",
          action: "listen_session",
          xpAmount: 10,
          metadata: null,
        },
      });
    });

    it("stores metadata as JSON string when provided", async () => {
      vi.mocked(prisma.xPTransaction.create).mockResolvedValue({} as any);
      vi.mocked(prisma.listener.update).mockResolvedValue({
        id: "l1",
        xpTotal: 60,
        xpLevel: 1,
      } as any);

      const metadata = { sessionId: "sess_123", duration: 45 };
      await awardXP("l1", "listener", "listen_session", 10, metadata);

      expect(prisma.xPTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: JSON.stringify(metadata),
        }),
      });
    });

    it("increments listener XP total", async () => {
      vi.mocked(prisma.xPTransaction.create).mockResolvedValue({} as any);
      vi.mocked(prisma.listener.update).mockResolvedValue({
        id: "l1",
        xpTotal: 110,
        xpLevel: 2,
      } as any);

      await awardXP("l1", "listener", "listen_session", 10);

      expect(prisma.listener.update).toHaveBeenCalledWith({
        where: { id: "l1" },
        data: { xpTotal: { increment: 10 } },
      });
    });

    it("detects level up and updates listener xpLevel", async () => {
      vi.mocked(prisma.xPTransaction.create).mockResolvedValue({} as any);
      // After increment, xpTotal is 100 -> level 2, but current xpLevel is 1
      vi.mocked(prisma.listener.update)
        .mockResolvedValueOnce({
          id: "l1",
          xpTotal: 100,
          xpLevel: 1,
        } as any)
        .mockResolvedValueOnce({
          id: "l1",
          xpTotal: 100,
          xpLevel: 2,
        } as any);

      const result = await awardXP("l1", "listener", "referral", 100);

      expect(result.leveledUp).toBe(true);
      expect(result.xpLevel).toBe(2);
      // Should have been called twice: once to increment XP, once to update level
      expect(prisma.listener.update).toHaveBeenCalledTimes(2);
      expect(prisma.listener.update).toHaveBeenLastCalledWith({
        where: { id: "l1" },
        data: { xpLevel: 2 },
      });
    });

    it("does not update level when no level up occurs", async () => {
      vi.mocked(prisma.xPTransaction.create).mockResolvedValue({} as any);
      // xpTotal 50, level 1 -> calculateLevel(50) = 1, same as xpLevel
      vi.mocked(prisma.listener.update).mockResolvedValue({
        id: "l1",
        xpTotal: 50,
        xpLevel: 1,
      } as any);

      const result = await awardXP("l1", "listener", "listen_session", 10);

      expect(result.leveledUp).toBe(false);
      expect(prisma.listener.update).toHaveBeenCalledTimes(1); // Only the increment
    });

    it("increments artist XP total", async () => {
      vi.mocked(prisma.xPTransaction.create).mockResolvedValue({} as any);
      vi.mocked(prisma.artist.update).mockResolvedValue({
        id: "a1",
        xpTotal: 200,
        xpLevel: 2,
      } as any);

      const result = await awardXP("a1", "artist", "tier_upgrade", 200);

      expect(prisma.artist.update).toHaveBeenCalledWith({
        where: { id: "a1" },
        data: { xpTotal: { increment: 200 } },
      });
      expect(result.xpTotal).toBe(200);
    });

    it("detects artist level up", async () => {
      vi.mocked(prisma.xPTransaction.create).mockResolvedValue({} as any);
      vi.mocked(prisma.artist.update)
        .mockResolvedValueOnce({ id: "a1", xpTotal: 300, xpLevel: 2 } as any)
        .mockResolvedValueOnce({ id: "a1", xpTotal: 300, xpLevel: 3 } as any);

      const result = await awardXP("a1", "artist", "tier_upgrade", 200);

      expect(result.leveledUp).toBe(true);
      expect(result.xpLevel).toBe(3);
    });

    it("handles sponsor type without database updates", async () => {
      vi.mocked(prisma.xPTransaction.create).mockResolvedValue({} as any);

      const result = await awardXP("sp1", "sponsor", "sponsor_back_artist", 100);

      expect(result.xpTotal).toBe(100);
      expect(result.xpLevel).toBe(1);
      expect(result.leveledUp).toBe(false);
      // Should not call listener or artist update
      expect(prisma.listener.update).not.toHaveBeenCalled();
      expect(prisma.artist.update).not.toHaveBeenCalled();
    });
  });

  describe("checkBadges", () => {
    it("awards XP-based badges when threshold is met", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "badge_100xp", xpRequired: 100, condition: null },
        { id: "badge_500xp", xpRequired: 500, condition: null },
      ] as any);

      vi.mocked(prisma.listener.findUnique).mockResolvedValue({
        id: "l1",
        badges: "[]",
        xpTotal: 200,
        totalSessions: 0,
        listeningStreak: 0,
      } as any);

      vi.mocked(prisma.listener.update).mockResolvedValue({} as any);

      const result = await checkBadges("l1", "listener");

      // Should award badge_100xp (200 >= 100) but not badge_500xp (200 < 500)
      expect(result).toContain("badge_100xp");
      expect(result).not.toContain("badge_500xp");
    });

    it("does not re-award badges the user already has", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "badge_100xp", xpRequired: 100, condition: null },
      ] as any);

      vi.mocked(prisma.listener.findUnique).mockResolvedValue({
        id: "l1",
        badges: '["badge_100xp"]',
        xpTotal: 500,
        totalSessions: 0,
        listeningStreak: 0,
      } as any);

      const result = await checkBadges("l1", "listener");

      expect(result).not.toContain("badge_100xp");
    });

    it("awards first_listen badge when totalSessions >= 1", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "badge_first", xpRequired: null, condition: "first_listen" },
      ] as any);

      vi.mocked(prisma.listener.findUnique).mockResolvedValue({
        id: "l1",
        badges: "[]",
        xpTotal: 10,
        totalSessions: 1,
        listeningStreak: 0,
      } as any);

      vi.mocked(prisma.listener.update).mockResolvedValue({} as any);

      const result = await checkBadges("l1", "listener");

      expect(result).toContain("badge_first");
    });

    it("awards sessions_100 badge when totalSessions >= 100", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "badge_100sess", xpRequired: null, condition: "sessions_100" },
      ] as any);

      vi.mocked(prisma.listener.findUnique).mockResolvedValue({
        id: "l1",
        badges: "[]",
        xpTotal: 0,
        totalSessions: 150,
        listeningStreak: 0,
      } as any);

      vi.mocked(prisma.listener.update).mockResolvedValue({} as any);

      const result = await checkBadges("l1", "listener");
      expect(result).toContain("badge_100sess");
    });

    it("does not award sessions_100 badge when totalSessions < 100", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "badge_100sess", xpRequired: null, condition: "sessions_100" },
      ] as any);

      vi.mocked(prisma.listener.findUnique).mockResolvedValue({
        id: "l1",
        badges: "[]",
        xpTotal: 0,
        totalSessions: 99,
        listeningStreak: 0,
      } as any);

      const result = await checkBadges("l1", "listener");
      expect(result).not.toContain("badge_100sess");
    });

    it("awards streak badges at correct thresholds", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "streak7", xpRequired: null, condition: "streak_7" },
        { id: "streak30", xpRequired: null, condition: "streak_30" },
        { id: "streak90", xpRequired: null, condition: "streak_90" },
      ] as any);

      // Listener with 30-day streak
      vi.mocked(prisma.listener.findUnique).mockResolvedValue({
        id: "l1",
        badges: "[]",
        xpTotal: 0,
        totalSessions: 0,
        listeningStreak: 30,
      } as any);

      vi.mocked(prisma.listener.update).mockResolvedValue({} as any);

      const result = await checkBadges("l1", "listener");

      expect(result).toContain("streak7");  // 30 >= 7
      expect(result).toContain("streak30"); // 30 >= 30
      expect(result).not.toContain("streak90"); // 30 < 90
    });

    it("saves new badges as JSON to listener record", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "new_badge", xpRequired: 10, condition: null },
      ] as any);

      vi.mocked(prisma.listener.findUnique).mockResolvedValue({
        id: "l1",
        badges: '["old_badge"]',
        xpTotal: 100,
        totalSessions: 0,
        listeningStreak: 0,
      } as any);

      vi.mocked(prisma.listener.update).mockResolvedValue({} as any);

      await checkBadges("l1", "listener");

      expect(prisma.listener.update).toHaveBeenCalledWith({
        where: { id: "l1" },
        data: { badges: JSON.stringify(["old_badge", "new_badge"]) },
      });
    });

    it("returns empty array when listener not found for condition checks", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "badge_first", xpRequired: null, condition: "first_listen" },
      ] as any);

      // First call for XP check returns listener, subsequent calls return null
      vi.mocked(prisma.listener.findUnique)
        .mockResolvedValueOnce({ id: "l1", badges: "[]", xpTotal: 0 } as any)
        .mockResolvedValueOnce({ id: "l1", badges: "[]", xpTotal: 0 } as any)
        .mockResolvedValueOnce(null); // Third call for condition checks

      const result = await checkBadges("nonexistent", "listener");
      expect(result).toEqual([]);
    });

    it("handles corrupted badges JSON gracefully", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "b1", xpRequired: 10, condition: null },
      ] as any);

      vi.mocked(prisma.listener.findUnique).mockResolvedValue({
        id: "l1",
        badges: "not-valid-json",
        xpTotal: 100,
        totalSessions: 0,
        listeningStreak: 0,
      } as any);

      vi.mocked(prisma.listener.update).mockResolvedValue({} as any);

      // Should not throw, the catch block handles invalid JSON
      const result = await checkBadges("l1", "listener");
      expect(result).toContain("b1");
    });

    it("handles null badges field", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "b1", xpRequired: 10, condition: null },
      ] as any);

      vi.mocked(prisma.listener.findUnique).mockResolvedValue({
        id: "l1",
        badges: null,
        xpTotal: 100,
        totalSessions: 0,
        listeningStreak: 0,
      } as any);

      vi.mocked(prisma.listener.update).mockResolvedValue({} as any);

      const result = await checkBadges("l1", "listener");
      expect(result).toContain("b1");
    });

    it("returns empty array for artist type (no condition-based badges)", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "badge_first", xpRequired: null, condition: "first_listen" },
      ] as any);

      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        id: "a1",
        xpTotal: 0,
      } as any);

      const result = await checkBadges("a1", "artist");
      // Condition badges only apply to listeners
      expect(result).toEqual([]);
    });

    it("awards XP-based badges to artists", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "xp_badge", xpRequired: 50, condition: null },
      ] as any);

      vi.mocked(prisma.artist.findUnique).mockResolvedValue({
        id: "a1",
        xpTotal: 200,
      } as any);

      const result = await checkBadges("a1", "artist");
      expect(result).toContain("xp_badge");
    });

    it("awards multiple badges at once", async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "xp50", xpRequired: 50, condition: null },
        { id: "xp100", xpRequired: 100, condition: null },
        { id: "first_listen", xpRequired: null, condition: "first_listen" },
        { id: "streak7", xpRequired: null, condition: "streak_7" },
      ] as any);

      vi.mocked(prisma.listener.findUnique).mockResolvedValue({
        id: "l1",
        badges: "[]",
        xpTotal: 500,
        totalSessions: 10,
        listeningStreak: 10,
      } as any);

      vi.mocked(prisma.listener.update).mockResolvedValue({} as any);

      const result = await checkBadges("l1", "listener");

      expect(result).toContain("xp50");
      expect(result).toContain("xp100");
      expect(result).toContain("first_listen");
      expect(result).toContain("streak7");
      expect(result.length).toBe(4);
    });
  });

  describe("getLeaderboard", () => {
    it("returns listener leaderboard sorted by XP", async () => {
      vi.mocked(prisma.listener.findMany).mockResolvedValue([
        { id: "l1", name: "Alice", email: "alice@test.com", xpTotal: 500, xpLevel: 4, badges: '["b1"]' },
        { id: "l2", name: null, email: "bob@test.com", xpTotal: 300, xpLevel: 3, badges: null },
      ] as any);

      const result = await getLeaderboard("listener", 50);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Alice");
      expect(result[0].xpTotal).toBe(500);
      expect(result[0].badges).toEqual(["b1"]);
      // When name is null, uses email prefix
      expect(result[1].name).toBe("bob");
      expect(result[1].badges).toEqual([]);
    });

    it("uses 'Anonymous' when both name and email are missing", async () => {
      vi.mocked(prisma.listener.findMany).mockResolvedValue([
        { id: "l1", name: null, email: null, xpTotal: 100, xpLevel: 2, badges: null },
      ] as any);

      const result = await getLeaderboard("listener");

      expect(result[0].name).toBe("Anonymous");
    });

    it("returns artist leaderboard with empty badges array", async () => {
      vi.mocked(prisma.artist.findMany).mockResolvedValue([
        { id: "a1", name: "Artist One", xpTotal: 1000, xpLevel: 5 },
      ] as any);

      const result = await getLeaderboard("artist");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Artist One");
      expect(result[0].badges).toEqual([]);
    });

    it("handles corrupted badge JSON in leaderboard", async () => {
      vi.mocked(prisma.listener.findMany).mockResolvedValue([
        { id: "l1", name: "Test", email: null, xpTotal: 100, xpLevel: 2, badges: "invalid" },
      ] as any);

      const result = await getLeaderboard("listener");

      expect(result[0].badges).toEqual([]);
    });

    it("passes limit parameter to query", async () => {
      vi.mocked(prisma.listener.findMany).mockResolvedValue([]);

      await getLeaderboard("listener", 10);

      expect(prisma.listener.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });

    it("uses default limit of 50", async () => {
      vi.mocked(prisma.listener.findMany).mockResolvedValue([]);

      await getLeaderboard("listener");

      expect(prisma.listener.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });
  });

  describe("XP level progression math", () => {
    // Verify the quadratic formula: xpForLevel(n) = 50 * n * (n-1)
    const expectedThresholds = [
      { level: 1, xp: 0 },
      { level: 2, xp: 100 },
      { level: 3, xp: 300 },
      { level: 4, xp: 600 },
      { level: 5, xp: 1000 },
      { level: 6, xp: 1500 },
      { level: 7, xp: 2100 },
      { level: 8, xp: 2800 },
      { level: 9, xp: 3600 },
      { level: 10, xp: 4500 },
    ];

    for (const { level, xp } of expectedThresholds) {
      it(`level ${level} starts at ${xp} XP`, () => {
        expect(calculateLevel(xp)).toBe(level);
        if (xp > 0) {
          expect(calculateLevel(xp - 1)).toBe(level - 1);
        }
      });
    }

    it("each level requires more XP than the previous", () => {
      let prevDelta = 0;
      for (let l = 2; l <= 20; l++) {
        const thisThreshold = 50 * l * (l - 1);
        const prevThreshold = 50 * (l - 1) * (l - 2);
        const delta = thisThreshold - prevThreshold;
        expect(delta).toBeGreaterThan(prevDelta);
        prevDelta = delta;
      }
    });
  });

  describe("Integration: XP + Level + Badge flow", () => {
    it("awarding XP that triggers level up, then checking badges", async () => {
      // Simulate awarding 100 XP to reach level 2
      vi.mocked(prisma.xPTransaction.create).mockResolvedValue({} as any);
      vi.mocked(prisma.listener.update)
        .mockResolvedValueOnce({ id: "l1", xpTotal: 100, xpLevel: 1 } as any)
        .mockResolvedValueOnce({ id: "l1", xpTotal: 100, xpLevel: 2 } as any);

      const xpResult = await awardXP("l1", "listener", "referral", 100);
      expect(xpResult.leveledUp).toBe(true);
      expect(xpResult.xpLevel).toBe(2);

      // Now check badges
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        { id: "level2_badge", xpRequired: 100, condition: null },
        { id: "level5_badge", xpRequired: 1000, condition: null },
      ] as any);
      vi.mocked(prisma.listener.findUnique).mockResolvedValue({
        id: "l1", badges: "[]", xpTotal: 100, totalSessions: 0, listeningStreak: 0,
      } as any);
      vi.mocked(prisma.listener.update).mockResolvedValue({} as any);

      const badges = await checkBadges("l1", "listener");
      expect(badges).toContain("level2_badge");
      expect(badges).not.toContain("level5_badge");
    });
  });
});
