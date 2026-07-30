import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

/**
 * Flags gate compliance behaviour (rights_gate decides what may go to air), so
 * the resolution order is worth proving rather than assuming.
 */

const findMany = vi.fn();
const upsert = vi.fn();
const deleteMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    config: {
      findMany: (...args: unknown[]) => findMany(...args),
      upsert: (...args: unknown[]) => upsert(...args),
      deleteMany: (...args: unknown[]) => deleteMany(...args),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { flag, setFlag, clearFlagCache, flagStates } from "@/lib/flags";

const STATION = "station-abc";

beforeEach(() => {
  findMany.mockReset().mockResolvedValue([]);
  upsert.mockReset().mockResolvedValue({});
  deleteMany.mockReset().mockResolvedValue({});
  clearFlagCache();
  delete process.env.FLAG_RIGHTS_GATE;
  delete process.env.FLAG_HQ_STREAM;
});

afterEach(() => {
  delete process.env.FLAG_RIGHTS_GATE;
  delete process.env.FLAG_HQ_STREAM;
});

describe("flag resolution order", () => {
  it("falls back to the registry default when nothing is configured", async () => {
    expect(await flag("rights_gate")).toBe(false);
  });

  it("uses the global value when set", async () => {
    findMany.mockResolvedValue([{ key: "flag:rights_gate", value: "true" }]);
    expect(await flag("rights_gate")).toBe(true);
  });

  it("prefers a station override over the global value", async () => {
    findMany.mockResolvedValue([
      { key: "flag:hq_stream", value: "false" },
      { key: `flag:hq_stream:station:${STATION}`, value: "true" },
    ]);
    expect(await flag("hq_stream", STATION)).toBe(true);
  });

  it("lets the environment override beat everything", async () => {
    findMany.mockResolvedValue([{ key: "flag:rights_gate", value: "false" }]);
    process.env.FLAG_RIGHTS_GATE = "true";
    expect(await flag("rights_gate")).toBe(true);
  });

  it("ignores a station override for a global-scoped flag", async () => {
    // rights_gate is global; a station row must not be able to weaken it
    findMany.mockResolvedValue([
      { key: "flag:rights_gate", value: "true" },
      { key: `flag:rights_gate:station:${STATION}`, value: "false" },
    ]);
    expect(await flag("rights_gate", STATION)).toBe(true);
  });

  it("uses the registry default when the database is unreachable", async () => {
    findMany.mockRejectedValue(new Error("connection refused"));
    // Must not throw, and must not silently turn a feature on
    expect(await flag("station_payments")).toBe(false);
  });

  it("accepts several truthy spellings", async () => {
    for (const raw of ["true", "1", "yes", "on", "TRUE", " On "]) {
      clearFlagCache();
      findMany.mockResolvedValue([{ key: "flag:rights_gate", value: raw }]);
      expect(await flag("rights_gate"), `value: ${raw}`).toBe(true);
    }
  });
});

describe("setFlag", () => {
  it("rejects a per-station write on a global flag", async () => {
    await expect(
      setFlag("rights_gate", true, { stationId: STATION })
    ).rejects.toThrow(/cannot be set per station/);
  });

  it("clears an override when passed null", async () => {
    await setFlag("hq_stream", null, { stationId: STATION });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { key: `flag:hq_stream:station:${STATION}` },
    });
  });

  it("writes the value and invalidates the cache", async () => {
    findMany.mockResolvedValue([]);
    expect(await flag("podcast_replays")).toBe(false); // caches false

    await setFlag("podcast_replays", true, { actor: "test" });
    expect(upsert).toHaveBeenCalled();

    findMany.mockResolvedValue([{ key: "flag:podcast_replays", value: "true" }]);
    expect(await flag("podcast_replays")).toBe(true); // not served from stale cache
  });
});

describe("flagStates", () => {
  it("reports where each value came from", async () => {
    findMany.mockResolvedValue([{ key: "flag:rights_gate", value: "true" }]);
    process.env.FLAG_HQ_STREAM = "true";

    const states = await flagStates();
    const rights = states.find((s) => s.key === "rights_gate")!;
    const hq = states.find((s) => s.key === "hq_stream")!;

    expect(rights.globalValue).toBe(true);
    expect(rights.effective).toBe(true);
    expect(rights.lockedByEnv).toBe(false);

    expect(hq.globalValue).toBeNull();
    expect(hq.effective).toBe(true);
    expect(hq.lockedByEnv).toBe(true); // admin UI must disable this toggle
  });
});
