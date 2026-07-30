/**
 * Music rights.
 *
 * The network runs only music it owns commercial rights to (AI-generated) or
 * holds written permission for. This module is the single place that decides
 * what "cleared" means, so the rule cannot drift between the licensing report,
 * the playout selection and the admin screens.
 *
 * Mirrors migration 021 in the playout database. Keep the two in step - see
 * docs/PLATFORM-AUDIT.md §4.2 on database reconciliation.
 */

import { prisma } from "@/lib/db";
import { flag } from "@/lib/flags";
import { logger } from "@/lib/logger";

export const RIGHTS_STATUSES = [
  "owned_ai",
  "direct_licence",
  "public_domain",
  "unclear",
  "rejected",
] as const;

export type RightsStatus = (typeof RIGHTS_STATUSES)[number];

/** Statuses that may go to air. Everything else is silence by default. */
export const CLEARED_STATUSES: RightsStatus[] = [
  "owned_ai",
  "direct_licence",
  "public_domain",
];

export function isRightsStatus(value: string): value is RightsStatus {
  return (RIGHTS_STATUSES as readonly string[]).includes(value);
}

/**
 * Whether a status carries a royalty obligation to a collecting society.
 *
 * Owned and directly-licensed recordings do not. This is the correction to the
 * previous hardcoded assumption that EVERY play owed $0.003, which overstated
 * liability for a catalogue that is deliberately royalty-free.
 */
export function incursSocietyRoyalty(status: string): boolean {
  return !CLEARED_STATUSES.includes(status as RightsStatus);
}

/**
 * Prisma filter for songs that may be broadcast.
 *
 * When the rights gate is off (transition period), only the historical
 * conditions apply. When on, rights clearance is mandatory. Returning a filter
 * rather than a boolean means callers cannot forget to apply it halfway.
 */
export async function playableSongFilter(stationId?: string | null) {
  const gateOn = await flag("rights_gate");

  const base = {
    isActive: true,
    retiredAt: null,
    ...(stationId ? { stationId } : {}),
  };

  if (!gateOn) return base;

  return { ...base, rightsStatus: { in: CLEARED_STATUSES } };
}

export interface RightsSummary {
  gateEnabled: boolean;
  total: number;
  playable: number;
  byStatus: Record<string, number>;
  /** Roughly how much unique music is cleared, at ~3.5 minutes a track */
  playableHours: number;
  /** Artists with a recording grant but no composition grant */
  compositionGaps: { artistId: string; artistName: string; proAffiliation: string | null }[];
  warnings: string[];
}

/**
 * Where the catalogue stands. Used by the admin rights screen and by anyone
 * about to turn the gate on, who needs to know how much silence that will cause.
 */
export async function rightsSummary(stationId?: string | null): Promise<RightsSummary> {
  const gateEnabled = await flag("rights_gate");
  const where = stationId ? { stationId } : {};

  const grouped = await prisma.song.groupBy({
    by: ["rightsStatus"],
    where,
    _count: { _all: true },
  });

  const byStatus: Record<string, number> = {};
  for (const row of grouped) byStatus[row.rightsStatus] = row._count._all;

  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

  const playable = await prisma.song.count({
    where: await playableSongFilter(stationId),
  });

  // Artists who granted the recording but not the composition still need a PRO
  // blanket licence, so surface them rather than letting them look cleared.
  const gapRows = await prisma.artistPermission.findMany({
    where: {
      grantsRecording: true,
      grantsComposition: false,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    select: {
      artistId: true,
      proAffiliation: true,
      artist: { select: { name: true } },
    },
    take: 100,
  });

  const compositionGaps = gapRows.map((r) => ({
    artistId: r.artistId,
    artistName: r.artist?.name ?? "(unknown)",
    proAffiliation: r.proAffiliation,
  }));

  const warnings: string[] = [];
  if (compositionGaps.length > 0) {
    warnings.push(
      `${compositionGaps.length} artist(s) granted recording rights but not composition rights. ` +
        `A PRO blanket licence may still be required for their songs.`
    );
  }
  if (!gateEnabled && (byStatus.unclear ?? 0) > 0) {
    warnings.push(
      `The rights gate is OFF, so ${byStatus.unclear} unreviewed song(s) can still be broadcast.`
    );
  }
  if (gateEnabled && playable === 0 && total > 0) {
    warnings.push(
      "The rights gate is ON and nothing is cleared, so the station has nothing it may legally play."
    );
  }

  const playableHours = Math.round((playable * 3.5) / 60 * 10) / 10;

  return { gateEnabled, total, playable, byStatus, playableHours, compositionGaps, warnings };
}

/** Clear a song for broadcast. Evidence is mandatory - see the guard below. */
export async function clearSong(params: {
  songId: string;
  status: RightsStatus;
  evidence: string;
  actor: string;
  notes?: string;
}): Promise<void> {
  const { songId, status, evidence, actor, notes } = params;

  if (!CLEARED_STATUSES.includes(status)) {
    throw new Error(`"${status}" is not a cleared status`);
  }
  // The playout database enforces this with a CHECK constraint. Prisma has no
  // equivalent, so it is enforced here - without evidence the gate is just a
  // flag someone flipped, and the rights position stops being provable.
  if (!evidence || !evidence.trim()) {
    throw new Error("Evidence is required to clear rights");
  }

  await prisma.song.update({
    where: { id: songId },
    data: {
      rightsStatus: status,
      rightsEvidence: evidence.trim(),
      rightsClearedAt: new Date(),
      rightsClearedBy: actor,
      ...(notes ? { rightsNotes: notes } : {}),
    },
  });

  logger.info("Song rights cleared", { songId, status, actor });
}

/** Retire a recording that cannot be used, e.g. major-label material. */
export async function retireSong(params: {
  songId: string;
  reason: string;
  actor: string;
}): Promise<void> {
  await prisma.song.update({
    where: { id: params.songId },
    data: {
      rightsStatus: "rejected",
      retiredAt: new Date(),
      retiredReason: params.reason,
      isActive: false,
    },
  });
  logger.info("Song retired", { songId: params.songId, reason: params.reason, actor: params.actor });
}
