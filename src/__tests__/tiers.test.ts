import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Tiers decide what an operator has paid for. Both failure directions are
 * commercially real: giving away a paid capability, or blocking one someone
 * has bought. Assert both.
 */

const overrideMock = vi.fn();
const stationFindUnique = vi.fn();
const stationFindMany = vi.fn();
const djCount = vi.fn();

vi.mock("@/lib/flags", () => ({
  flagOverride: (...a: unknown[]) => overrideMock(...a),
}));
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    station: {
      findUnique: (...a: unknown[]) => stationFindUnique(...a),
      findMany: (...a: unknown[]) => stationFindMany(...a),
    },
    dJ: { count: (...a: unknown[]) => djCount(...a) },
  },
}));

import {
  TIERS,
  tierOf,
  entitlementsFor,
  canAddDj,
  canAddStation,
  bitrateFor,
} from "@/lib/tiers";

beforeEach(() => {
  overrideMock.mockReset().mockResolvedValue(null);
  stationFindUnique.mockReset().mockResolvedValue({ tier: "basic" });
  stationFindMany.mockReset().mockResolvedValue([]);
  djCount.mockReset().mockResolvedValue(0);
});

describe("tierOf", () => {
  it("falls back to basic for unknown or missing values", () => {
    expect(tierOf(null).id).toBe("basic");
    expect(tierOf("enterprise-platinum").id).toBe("basic");
    expect(tierOf("pro").id).toBe("pro");
  });
});

describe("entitlementsFor", () => {
  it("grants what the tier includes", async () => {
    stationFindUnique.mockResolvedValue({ tier: "plus" });
    // Nothing configured for this station: the TIER must grant its own flags.
    overrideMock.mockResolvedValue(null);

    const ent = await entitlementsFor("s1");
    expect(ent.tier.id).toBe("plus");
    expect(ent.can("hq_stream")).toBe(true);
    expect(ent.limits.djs).toBe(12);
  });

  it("grants tier flags with NO override configured", async () => {
    // The bug this catches: resolving via flag() collapsed "unset" into the
    // registry default, so a paying Plus station got none of its capabilities.
    stationFindUnique.mockResolvedValue({ tier: "plus" });
    overrideMock.mockResolvedValue(null);

    const ent = await entitlementsFor("s1");
    expect(ent.can("hq_stream")).toBe(true);
    expect(ent.can("podcast_replays")).toBe(true);
    expect(ent.can("multi_station")).toBe(false); // Pro only
  });

  it("does not grant capabilities outside the tier", async () => {
    stationFindUnique.mockResolvedValue({ tier: "basic" });
    const ent = await entitlementsFor("s1");
    expect(ent.can("hq_stream")).toBe(false);
    expect(ent.can("multi_station")).toBe(false);
  });

  it("lets a per-station override REVOKE a tier capability", async () => {
    // A capability disabled for one station must actually be off, otherwise the
    // only way to withdraw it is to invent a bespoke tier.
    stationFindUnique.mockResolvedValue({ tier: "pro" });
    overrideMock.mockImplementation(async (key: string) =>
      key === "signature_voices" ? false : null
    );

    const ent = await entitlementsFor("s1");
    expect(ent.can("signature_voices")).toBe(false);
    expect(ent.can("hq_stream")).toBe(true);
  });

  it("defaults to basic when the station cannot be read", async () => {
    stationFindUnique.mockRejectedValue(new Error("db down"));
    const ent = await entitlementsFor("s1");
    // A database blip must not hand out Pro capabilities
    expect(ent.tier.id).toBe("basic");
    expect(ent.limits.djs).toBe(4);
  });
});

describe("canAddDj", () => {
  it("allows up to the basic limit of 4", async () => {
    djCount.mockResolvedValue(3);
    const check = await canAddDj("s1");
    expect(check.allowed).toBe(true);
    expect(check.limit).toBe(4);
  });

  it("blocks the fifth DJ on basic, with an explanation", async () => {
    djCount.mockResolvedValue(4);
    const check = await canAddDj("s1");
    expect(check.allowed).toBe(false);
    expect(check.message).toMatch(/Extra DJ personalities|higher tier/i);
  });

  it("lifts the cap when the extra_djs addon is on, without changing tier", async () => {
    stationFindUnique.mockResolvedValue({ tier: "basic" });
    overrideMock.mockImplementation(async (key: string) =>
      key === "extra_djs" ? true : null
    );
    djCount.mockResolvedValue(4);

    const check = await canAddDj("s1");
    expect(check.allowed).toBe(true);
    expect(check.limit).toBe(12);
  });
});

describe("canAddStation", () => {
  it("allows a single station on basic", async () => {
    stationFindMany.mockResolvedValue([]);
    const check = await canAddStation("org-1");
    expect(check.allowed).toBe(true);
  });

  it("blocks a second station on basic", async () => {
    stationFindMany.mockResolvedValue([{ id: "a", tier: "basic" }]);
    const check = await canAddStation("org-1");
    expect(check.allowed).toBe(false);
    expect(check.limit).toBe(1);
  });

  it("uses the most generous tier the operator holds", async () => {
    stationFindMany.mockResolvedValue([
      { id: "a", tier: "basic" },
      { id: "b", tier: "pro" },
    ]);
    const check = await canAddStation("org-1");
    expect(check.allowed).toBe(true);
    expect(check.limit).toBe(TIERS.pro.limits.stations);
  });
});

describe("bitrateFor", () => {
  it("is 128k on basic and 320k with the HQ addon", async () => {
    expect(await bitrateFor("s1")).toBe(128);

    overrideMock.mockImplementation(async (key: string) =>
      key === "hq_stream" ? true : null
    );
    stationFindUnique.mockResolvedValue({ tier: "plus" });
    expect(await bitrateFor("s1")).toBe(320);
  });
});
