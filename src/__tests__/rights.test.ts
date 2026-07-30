import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Rights decide what may legally be broadcast and what royalty is owed. Both
 * failure directions are expensive: playing something uncleared, or paying a
 * society for music we own. Assert both.
 */

const flagMock = vi.fn();
const groupBy = vi.fn();
const count = vi.fn();
const update = vi.fn();
const permissionFindMany = vi.fn();

vi.mock("@/lib/flags", () => ({ flag: (...a: unknown[]) => flagMock(...a) }));
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    song: {
      groupBy: (...a: unknown[]) => groupBy(...a),
      count: (...a: unknown[]) => count(...a),
      update: (...a: unknown[]) => update(...a),
    },
    artistPermission: { findMany: (...a: unknown[]) => permissionFindMany(...a) },
  },
}));

import {
  playableSongFilter,
  incursSocietyRoyalty,
  rightsSummary,
  clearSong,
  CLEARED_STATUSES,
} from "@/lib/rights";

beforeEach(() => {
  flagMock.mockReset().mockResolvedValue(false);
  groupBy.mockReset().mockResolvedValue([]);
  count.mockReset().mockResolvedValue(0);
  update.mockReset().mockResolvedValue({});
  permissionFindMany.mockReset().mockResolvedValue([]);
});

describe("incursSocietyRoyalty", () => {
  it("owes nothing on owned or directly licensed recordings", () => {
    for (const s of CLEARED_STATUSES) {
      expect(incursSocietyRoyalty(s), s).toBe(false);
    }
  });

  it("owes a royalty on anything unreviewed", () => {
    // The safe default: an unmatched recording must never be assumed free
    expect(incursSocietyRoyalty("unclear")).toBe(true);
    expect(incursSocietyRoyalty("rejected")).toBe(true);
    expect(incursSocietyRoyalty("something_unexpected")).toBe(true);
  });
});

describe("playableSongFilter", () => {
  it("does not require clearance while the gate is off", async () => {
    flagMock.mockResolvedValue(false);
    const filter = await playableSongFilter();
    expect(filter).not.toHaveProperty("rightsStatus");
    expect(filter.isActive).toBe(true);
    expect(filter.retiredAt).toBeNull();
  });

  it("requires a cleared status once the gate is on", async () => {
    flagMock.mockResolvedValue(true);
    const filter = await playableSongFilter();
    expect(filter).toHaveProperty("rightsStatus");
    expect((filter as { rightsStatus: { in: string[] } }).rightsStatus.in).toEqual(
      CLEARED_STATUSES
    );
  });

  it("never includes retired songs, gate on or off", async () => {
    for (const gate of [true, false]) {
      flagMock.mockResolvedValue(gate);
      expect((await playableSongFilter()).retiredAt).toBeNull();
    }
  });

  it("scopes to a station when asked", async () => {
    flagMock.mockResolvedValue(true);
    const filter = await playableSongFilter("station-1");
    expect((filter as { stationId?: string }).stationId).toBe("station-1");
  });
});

describe("clearSong", () => {
  it("refuses to clear without evidence", async () => {
    await expect(
      clearSong({ songId: "s1", status: "owned_ai", evidence: "  ", actor: "me" })
    ).rejects.toThrow(/Evidence is required/);
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses a status that is not a cleared one", async () => {
    await expect(
      // @ts-expect-error deliberately invalid at runtime
      clearSong({ songId: "s1", status: "unclear", evidence: "x", actor: "me" })
    ).rejects.toThrow(/not a cleared status/);
    expect(update).not.toHaveBeenCalled();
  });

  it("records who cleared it and on what evidence", async () => {
    await clearSong({
      songId: "s1",
      status: "direct_licence",
      evidence: "agreements/callahan.pdf",
      actor: "paul",
    });
    const arg = update.mock.calls[0][0];
    expect(arg.data.rightsStatus).toBe("direct_licence");
    expect(arg.data.rightsEvidence).toBe("agreements/callahan.pdf");
    expect(arg.data.rightsClearedBy).toBe("paul");
    expect(arg.data.rightsClearedAt).toBeInstanceOf(Date);
  });
});

describe("rightsSummary", () => {
  it("warns when the gate is on and nothing is cleared", async () => {
    flagMock.mockResolvedValue(true);
    groupBy.mockResolvedValue([{ rightsStatus: "unclear", _count: { _all: 1200 } }]);
    count.mockResolvedValue(0);

    const s = await rightsSummary();
    expect(s.playable).toBe(0);
    expect(s.warnings.join(" ")).toMatch(/nothing it may legally play/i);
  });

  it("warns when the gate is off and unreviewed songs can still air", async () => {
    flagMock.mockResolvedValue(false);
    groupBy.mockResolvedValue([{ rightsStatus: "unclear", _count: { _all: 600 } }]);
    count.mockResolvedValue(600);

    const s = await rightsSummary();
    expect(s.warnings.join(" ")).toMatch(/gate is OFF/i);
  });

  it("surfaces artists missing composition rights", async () => {
    flagMock.mockResolvedValue(true);
    groupBy.mockResolvedValue([{ rightsStatus: "direct_licence", _count: { _all: 10 } }]);
    count.mockResolvedValue(10);
    permissionFindMany.mockResolvedValue([
      { artistId: "a1", proAffiliation: "BMI", artist: { name: "Lower 40" } },
    ]);

    const s = await rightsSummary();
    expect(s.compositionGaps).toHaveLength(1);
    expect(s.compositionGaps[0].artistName).toBe("Lower 40");
    expect(s.warnings.join(" ")).toMatch(/composition/i);
  });
});
