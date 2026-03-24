import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/db", () => ({
  prisma: {
    clockTemplate: { findUnique: vi.fn() },
    song: { findMany: vi.fn() },
    trackPlayback: { findMany: vi.fn() },
    hourPlaylist: { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() },
    voiceTrack: { deleteMany: vi.fn() },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { buildHourPlaylist, type BuildPlaylistOptions } from "../playlist-builder";
import { prisma } from "@/lib/db";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSong(overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id ?? `song_${Math.random().toString(36).slice(2, 8)}`,
    title: overrides.title ?? "Test Song",
    artistName: overrides.artistName ?? "Test Artist",
    rotationCategory: overrides.rotationCategory ?? "A",
    vocalGender: overrides.vocalGender ?? "male",
    tempoCategory: overrides.tempoCategory ?? "medium",
    playCount: overrides.playCount ?? 0,
    lastPlayedAt: overrides.lastPlayedAt ?? null,
    isFeatured: overrides.isFeatured ?? false,
  };
}

function makeClockSlot(position: number, category: string) {
  return {
    position,
    minute: position * 4,
    duration: 240,
    category,
    type: "song",
  };
}

function makeNonMusicSlot(position: number, category: string, type: string) {
  return { position, minute: position * 4, duration: 60, category, type };
}

const BASE_OPTS: BuildPlaylistOptions = {
  stationId: "station_1",
  djId: "dj_1",
  clockTemplateId: "clock_1",
  airDate: new Date("2026-03-24"),
  hourOfDay: 10,
};

function setupMocks(opts: {
  clockSlots: unknown[];
  songs: unknown[];
  recentPlays?: unknown[];
  lockedPlaylists?: unknown[];
  existingPlaylist?: unknown;
  templateOverrides?: Record<string, unknown>;
}) {
  vi.mocked(prisma.clockTemplate.findUnique).mockResolvedValue({
    id: "clock_1",
    clockPattern: JSON.stringify(opts.clockSlots),
    genderBalanceTarget: 0.5,
    tempo: null,
    ...opts.templateOverrides,
  } as any);
  vi.mocked(prisma.song.findMany).mockResolvedValue(opts.songs as any);
  vi.mocked(prisma.trackPlayback.findMany).mockResolvedValue((opts.recentPlays || []) as any);
  vi.mocked(prisma.hourPlaylist.findMany).mockResolvedValue((opts.lockedPlaylists || []) as any);
  vi.mocked(prisma.hourPlaylist.findUnique).mockResolvedValue((opts.existingPlaylist || null) as any);
  vi.mocked(prisma.hourPlaylist.upsert).mockResolvedValue({ id: "hp_1" } as any);
  vi.mocked(prisma.voiceTrack.deleteMany).mockResolvedValue({ count: 0 } as any);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("buildHourPlaylist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds playlist with correct number of slots", async () => {
    const clockSlots = [
      makeClockSlot(0, "A"),
      makeClockSlot(1, "B"),
      makeClockSlot(2, "C"),
      makeNonMusicSlot(3, "DJ", "voice_break"),
      makeClockSlot(4, "A"),
    ];

    const songs = [
      makeSong({ id: "s1", artistName: "Artist A", rotationCategory: "A" }),
      makeSong({ id: "s2", artistName: "Artist B", rotationCategory: "A" }),
      makeSong({ id: "s3", artistName: "Artist C", rotationCategory: "B" }),
      makeSong({ id: "s4", artistName: "Artist D", rotationCategory: "C" }),
    ];

    setupMocks({ clockSlots, songs });

    const result = await buildHourPlaylist(BASE_OPTS);

    expect(result.slots).toHaveLength(5);
    // 4 music slots (A, B, C, A), 1 non-music slot
    expect(result.songsAssigned).toBe(4);
    expect(result.hourPlaylistId).toBe("hp_1");
  });

  it("respects cooldown periods (no repeat within window)", async () => {
    const clockSlots = [makeClockSlot(0, "A"), makeClockSlot(1, "A")];

    const songs = [
      makeSong({ id: "s1", artistName: "Artist A", rotationCategory: "A" }),
      makeSong({ id: "s2", artistName: "Artist B", rotationCategory: "A" }),
    ];

    // s1 was played 2 hours ago — within A's 4-hour cooldown
    const twoHoursAgo = new Date("2026-03-24T08:00:00.000Z");
    const recentPlays = [{ trackId: "s1", playedAt: twoHoursAgo }];

    setupMocks({ clockSlots, songs, recentPlays });

    const result = await buildHourPlaylist(BASE_OPTS);

    // s1 should be excluded due to cooldown; both slots should use s2 or one slot unfilled
    const assignedSongIds = result.slots
      .filter((s) => s.songId)
      .map((s) => s.songId);

    expect(assignedSongIds).not.toContain("s1");
  });

  it("handles empty song library gracefully", async () => {
    const clockSlots = [makeClockSlot(0, "A"), makeClockSlot(1, "B")];

    setupMocks({ clockSlots, songs: [] });

    const result = await buildHourPlaylist(BASE_OPTS);

    expect(result.slots).toHaveLength(2);
    expect(result.songsAssigned).toBe(0);
    // Slots should exist but without songId
    expect(result.slots[0].songId).toBeUndefined();
    expect(result.slots[1].songId).toBeUndefined();
  });

  it("enforces artist separation (no same artist in 3 consecutive slots)", async () => {
    const clockSlots = [
      makeClockSlot(0, "A"),
      makeClockSlot(1, "A"),
      makeClockSlot(2, "A"),
      makeClockSlot(3, "A"),
    ];

    // Only 2 artists available — can't have 4 in a row from one
    const songs = [
      makeSong({ id: "s1", artistName: "Same Artist", rotationCategory: "A" }),
      makeSong({ id: "s2", artistName: "Same Artist", rotationCategory: "A" }),
      makeSong({ id: "s3", artistName: "Same Artist", rotationCategory: "A" }),
      makeSong({ id: "s4", artistName: "Different Artist", rotationCategory: "A" }),
      makeSong({ id: "s5", artistName: "Different Artist", rotationCategory: "A" }),
    ];

    setupMocks({ clockSlots, songs });

    const result = await buildHourPlaylist(BASE_OPTS);

    // Check that no artist appears more than 3 times consecutively
    const artists = result.slots
      .filter((s) => s.artistName)
      .map((s) => s.artistName);

    for (let i = 0; i < artists.length - 3; i++) {
      const window = artists.slice(i, i + 4);
      const allSame = window.every((a) => a === window[0]);
      expect(allSame).toBe(false);
    }
  });

  it("throws when clock template is not found", async () => {
    vi.mocked(prisma.clockTemplate.findUnique).mockResolvedValue(null);

    await expect(buildHourPlaylist(BASE_OPTS)).rejects.toThrow(
      "Clock template clock_1 not found or has no pattern"
    );
  });

  it("redistributes empty category slots to populated alternatives", async () => {
    // Only B category songs exist, no A songs
    const clockSlots = [makeClockSlot(0, "A"), makeClockSlot(1, "A")];

    const songs = [
      makeSong({ id: "s1", artistName: "Artist B1", rotationCategory: "B" }),
      makeSong({ id: "s2", artistName: "Artist B2", rotationCategory: "B" }),
    ];

    setupMocks({ clockSlots, songs });

    const result = await buildHourPlaylist(BASE_OPTS);

    // A slots should be remapped to B (fallback) and filled
    expect(result.songsAssigned).toBe(2);
  });

  it("uses excludeSongIds to prevent repeats across DJ shifts", async () => {
    const clockSlots = [makeClockSlot(0, "A")];

    const songs = [
      makeSong({ id: "s1", artistName: "Artist A", rotationCategory: "A" }),
      makeSong({ id: "s2", artistName: "Artist B", rotationCategory: "A" }),
    ];

    setupMocks({ clockSlots, songs });

    const result = await buildHourPlaylist({
      ...BASE_OPTS,
      excludeSongIds: new Set(["s1"]),
    });

    const assigned = result.slots.filter((s) => s.songId);
    expect(assigned).toHaveLength(1);
    expect(assigned[0].songId).toBe("s2");
  });

  it("saves playlist to database via upsert", async () => {
    const clockSlots = [makeClockSlot(0, "A")];
    const songs = [makeSong({ id: "s1", rotationCategory: "A" })];

    setupMocks({ clockSlots, songs });

    await buildHourPlaylist(BASE_OPTS);

    expect(prisma.hourPlaylist.upsert).toHaveBeenCalledTimes(1);
    const upsertCall = vi.mocked(prisma.hourPlaylist.upsert).mock.calls[0][0];
    expect(upsertCall.create.stationId).toBe("station_1");
    expect(upsertCall.create.djId).toBe("dj_1");
    expect(upsertCall.create.status).toBe("draft");
  });

  it("deletes stale voice tracks when rebuilding a draft playlist", async () => {
    const clockSlots = [makeClockSlot(0, "A")];
    const songs = [makeSong({ id: "s1", rotationCategory: "A" })];

    setupMocks({
      clockSlots,
      songs,
      existingPlaylist: { id: "hp_existing", status: "draft" },
    });

    await buildHourPlaylist(BASE_OPTS);

    expect(prisma.voiceTrack.deleteMany).toHaveBeenCalledWith({
      where: { hourPlaylistId: "hp_existing" },
    });
  });

  it("does not delete voice tracks for non-draft existing playlists", async () => {
    const clockSlots = [makeClockSlot(0, "A")];
    const songs = [makeSong({ id: "s1", rotationCategory: "A" })];

    setupMocks({
      clockSlots,
      songs,
      existingPlaylist: { id: "hp_existing", status: "locked" },
    });

    await buildHourPlaylist(BASE_OPTS);

    expect(prisma.voiceTrack.deleteMany).not.toHaveBeenCalled();
  });
});

describe("eReplacementProbability (via integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("never replaces A slots regardless of E song count", async () => {
    // Create clock with only A slots, plus many E songs
    const clockSlots = Array.from({ length: 10 }, (_, i) => makeClockSlot(i, "A"));

    const songs = [
      // 200 E songs
      ...Array.from({ length: 200 }, (_, i) =>
        makeSong({ id: `e_${i}`, artistName: `E-Artist-${i}`, rotationCategory: "E" })
      ),
      // A few A songs
      ...Array.from({ length: 10 }, (_, i) =>
        makeSong({ id: `a_${i}`, artistName: `A-Artist-${i}`, rotationCategory: "A" })
      ),
    ];

    setupMocks({ clockSlots, songs });

    const result = await buildHourPlaylist(BASE_OPTS);

    // All assigned songs should be A category (or fallback, never E replacing A)
    const assignedSongs = result.slots.filter((s) => s.songId);
    for (const slot of assignedSongs) {
      const song = songs.find((s) => s.id === slot.songId);
      // A slots should never be replaced by E
      expect(song?.rotationCategory).not.toBe("E");
    }
  });

  it("D slots can be replaced by E when enough E songs exist (10+)", async () => {
    // This is probabilistic, so we run multiple times
    const clockSlots = Array.from({ length: 20 }, (_, i) => makeClockSlot(i, "D"));

    const songs = [
      ...Array.from({ length: 50 }, (_, i) =>
        makeSong({ id: `e_${i}`, artistName: `E-Artist-${i}`, rotationCategory: "E" })
      ),
      ...Array.from({ length: 20 }, (_, i) =>
        makeSong({ id: `d_${i}`, artistName: `D-Artist-${i}`, rotationCategory: "D" })
      ),
    ];

    setupMocks({ clockSlots, songs });

    // Run multiple times to check that E replacement can occur
    let anyEAssigned = false;
    for (let trial = 0; trial < 20; trial++) {
      vi.mocked(prisma.hourPlaylist.upsert).mockResolvedValue({ id: `hp_${trial}` } as any);
      const result = await buildHourPlaylist(BASE_OPTS);
      const eSongs = result.slots.filter(
        (s) => s.songId && songs.find((song) => song.id === s.songId)?.rotationCategory === "E"
      );
      if (eSongs.length > 0) {
        anyEAssigned = true;
        break;
      }
    }

    expect(anyEAssigned).toBe(true);
  });
});
