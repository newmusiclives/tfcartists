/**
 * Station tiers and addons.
 *
 * A basic station is 4 AI DJs. Everything beyond that is a paid addon, either
 * bundled into a higher tier or enabled individually per station.
 *
 * Tiers and flags are deliberately the same mechanism rather than two parallel
 * systems: a tier is simply a named bundle of flag defaults. That means an
 * operator can be sold "Plus", and can also have one extra capability switched
 * on for them without inventing a bespoke tier - a case that always arrives
 * eventually and otherwise ends in a tangle of special cases.
 *
 * Resolution order for any entitlement:
 *
 *   per-station flag override  ->  tier default  ->  registry default
 *
 * The flag layer already handles the first and last; this adds the middle.
 */

import { prisma } from "@/lib/db";
import { flagOverride, type FlagKey } from "@/lib/flags";
import { logger } from "@/lib/logger";

export type TierId = "basic" | "plus" | "pro";

export interface TierDefinition {
  id: TierId;
  label: string;
  description: string;
  /** Hard limits enforced regardless of flags */
  limits: {
    /** Maximum DJ personalities that may be active */
    djs: number;
    /** Maximum stations this operator may run */
    stations: number;
    /** Base stream bitrate; HQ is an addon */
    bitrateKbps: number;
  };
  /** Flags this tier turns on by default */
  includedFlags: FlagKey[];
}

export const TIERS: Record<TierId, TierDefinition> = {
  basic: {
    id: "basic",
    label: "Basic Station",
    description: "One station, 4 AI DJs, 128kbps stream.",
    limits: { djs: 4, stations: 1, bitrateKbps: 128 },
    includedFlags: [],
  },
  plus: {
    id: "plus",
    label: "Plus",
    description:
      "Everything in Basic, plus the full DJ roster, HQ audio, listener requests and podcast replays.",
    limits: { djs: 12, stations: 1, bitrateKbps: 320 },
    includedFlags: ["extra_djs", "hq_stream", "live_requests", "podcast_replays"],
  },
  pro: {
    id: "pro",
    label: "Pro Network",
    description:
      "Everything in Plus, plus multiple stations, sponsor self-serve, signature voices and automatic clock building.",
    limits: { djs: 12, stations: 10, bitrateKbps: 320 },
    includedFlags: [
      "extra_djs",
      "hq_stream",
      "live_requests",
      "podcast_replays",
      "multi_station",
      "sponsor_self_serve",
      "signature_voices",
      "smart_clocks",
      "ai_show_recaps",
    ],
  },
};

export const TIER_IDS = Object.keys(TIERS) as TierId[];

export function isTierId(value: string): value is TierId {
  return value in TIERS;
}

export function tierOf(value: string | null | undefined): TierDefinition {
  return value && isTierId(value) ? TIERS[value] : TIERS.basic;
}

export interface Entitlements {
  tier: TierDefinition;
  limits: TierDefinition["limits"];
  /** Whether a capability is available, after tier and per-station overrides */
  can: (key: FlagKey) => boolean;
}

/**
 * What this station is actually entitled to.
 *
 * A per-station flag override beats the tier in BOTH directions: it can grant a
 * capability the tier does not include (a one-off addon sale) and it can revoke
 * one the tier does include (a capability temporarily disabled for a station).
 * Anything else forces bespoke tiers for every exception.
 */
export async function entitlementsFor(stationId: string): Promise<Entitlements> {
  let tierValue: string | null = null;

  try {
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { tier: true },
    });
    tierValue = station?.tier ?? null;
  } catch (error) {
    logger.warn("Could not read station tier, defaulting to basic", {
      stationId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const tier = tierOf(tierValue);

  // Resolve every flag that ANY tier can grant, not just this tier's own.
  // Resolving only the tier's included flags broke the one-off addon sale this
  // design exists to support: a Basic station with extra_djs switched on
  // individually would report the capability as unavailable, because the flag
  // was never consulted.
  const resolved = new Map<FlagKey, boolean>();
  const addonFlags = new Set<FlagKey>(
    TIER_IDS.flatMap((id) => TIERS[id].includedFlags)
  );

  await Promise.all(
    [...addonFlags].map(async (key) => {
      // Override wins in BOTH directions; the tier only decides what happens
      // when nothing has been set explicitly for this station.
      const override = await flagOverride(key, stationId);
      resolved.set(key, override ?? tier.includedFlags.includes(key));
    })
  );

  return {
    tier,
    limits: tier.limits,
    can: (key: FlagKey) => resolved.get(key) ?? false,
  };
}

export interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  message?: string;
}

/**
 * Can this station activate another DJ?
 *
 * Checked before activation rather than reported afterwards, so an operator on
 * Basic is told why at the point of action instead of discovering later that a
 * fifth DJ silently never went on air.
 */
export async function canAddDj(stationId: string): Promise<LimitCheck> {
  const ent = await entitlementsFor(stationId);

  // The extra_djs addon lifts the cap without changing tier
  const limit = ent.can("extra_djs") ? TIERS.plus.limits.djs : ent.limits.djs;

  const current = await prisma.dJ.count({
    where: { stationId, isActive: true },
  });

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      message:
        `This station is on ${ent.tier.label} and already has ${current} active ` +
        `DJ${current === 1 ? "" : "s"} of ${limit}. Enable the "Extra DJ personalities" ` +
        `addon or move to a higher tier to add more.`,
    };
  }

  return { allowed: true, current, limit };
}

/** Can this operator create another station? */
export async function canAddStation(organizationId: string | null): Promise<LimitCheck> {
  if (!organizationId) {
    return { allowed: true, current: 0, limit: TIERS.basic.limits.stations };
  }

  const stations = await prisma.station.findMany({
    where: { organizationId },
    select: { id: true, tier: true },
  });

  // An operator's allowance is set by their most generous station tier
  const limit = stations.reduce(
    (max, s) => Math.max(max, tierOf(s.tier).limits.stations),
    TIERS.basic.limits.stations
  );

  if (stations.length >= limit) {
    return {
      allowed: false,
      current: stations.length,
      limit,
      message:
        `This account can run ${limit} station${limit === 1 ? "" : "s"} and already has ` +
        `${stations.length}. Upgrade to Pro Network to run more.`,
    };
  }

  return { allowed: true, current: stations.length, limit };
}

/** Stream bitrate this station is entitled to. */
export async function bitrateFor(stationId: string): Promise<number> {
  const ent = await entitlementsFor(stationId);
  return ent.can("hq_stream") ? 320 : ent.limits.bitrateKbps;
}
