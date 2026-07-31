import { prisma } from "@/lib/db";

/**
 * Copy play history from the playout engine into the platform database.
 *
 * Nothing had ever written TrackPlayback. The playout engine records every play
 * in its own `plays` table and stops there, so analytics, royalty reporting and
 * the fairness protocol on this side were running on data that did not exist.
 *
 * Pull, not push. Having the playout API write here directly would mean giving
 * the streaming service platform credentials and a second schema to track, and
 * it would lose every play that happened while this side was deploying. Pulling
 * over the existing HTTP endpoint keeps each service owning its own store,
 * backfills history for free, and is safe to re-run after any outage.
 *
 * Idempotent on (playedAt, trackTitle, artistName): a station cannot play the
 * same track twice at the same instant, and playedAt is copied exactly.
 */

const DEFAULT_API = "https://tfc-radio-backend-production.up.railway.app";
const PAGE = 1000; // the endpoint's maximum
const STATION_TZ = process.env.STATION_TZ ?? "America/Denver";

export type PlayRow = {
  id: string;
  song_id: string | null;
  artist_id: string | null;
  played_at: string;
  dj_personality: string | null;
  title: string | null;
  artist_name: string | null;
  duration_seconds: number | null;
};

export type SyncResult = {
  fetched: number;
  unusable: number;
  alreadyHeld: number;
  inserted: number;
  toInsert: number;
  unmappedDjs: number;
  latestBefore: Date | null;
  latestAfter: Date | null;
  committed: boolean;
};

/**
 * The playout API returns naive timestamps ("2026-07-31T17:27:25.018489") that
 * are UTC. `new Date()` parses a string with no timezone designator as LOCAL
 * time, so anywhere that is not on UTC every play silently shifts by the local
 * offset - and shifts again in timeSlot, filing a mid-morning play as evening.
 * The wrong value still looks like a plausible timestamp, so nothing downstream
 * catches it; it has to be handled at the parse boundary.
 */
export function parsePlayedAt(value: string): Date {
  const hasZone = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

/**
 * TrackPlayback.timeSlot is required and drives scheduling reports, so it has
 * to reflect the STATION's local clock, not UTC. A play at 02:00 UTC is evening
 * programming in Mountain time; bucketing the raw timestamp would file most of
 * the evening show under late_night.
 */
export function timeSlotFor(d: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: STATION_TZ,
      hour: "2-digit",
      hour12: false,
    }).format(d),
  );
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "midday";
  if (hour >= 22 || hour < 6) return "late_night";
  return "evening";
}

const key = (playedAt: Date, title: string, artist: string) =>
  `${playedAt.toISOString()}|${title.toLowerCase()}|${artist.toLowerCase()}`;

/**
 * Page backwards through history, stopping once past the watermark.
 *
 * The endpoint's own start_date filter cannot be used: it passes the raw query
 * string into `played_at >= :start_date` and the driver refuses a string where
 * the column is a timestamp, so ANY value returns HTTP 500. Fixed in
 * ai_services/app/api/analytics.py but not yet deployed. Paging is an adequate
 * substitute because results are newest-first, so an incremental run normally
 * stops on the first page.
 */
async function fetchPlays(
  api: string,
  since: Date | null,
  all: boolean,
  onProgress?: (n: number, total: number | null) => void,
): Promise<PlayRow[]> {
  const rows: PlayRow[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const url = new URL(`${api}/api/analytics/plays`);
    url.searchParams.set("limit", String(PAGE));
    url.searchParams.set("offset", String(offset));

    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`playout API returned HTTP ${res.status}`);
    const body = await res.json();
    const page: PlayRow[] = body.plays ?? [];
    rows.push(...page);
    onProgress?.(rows.length, body.total ?? null);

    if (page.length < PAGE) break;
    if (!all && since) {
      const oldest = page[page.length - 1]?.played_at;
      if (oldest && parsePlayedAt(oldest) < since) break;
    }
  }
  return all || !since
    ? rows
    : rows.filter((r) => parsePlayedAt(r.played_at) >= since);
}

export async function syncPlays(opts: {
  commit: boolean;
  all?: boolean;
  api?: string;
  onProgress?: (n: number, total: number | null) => void;
}): Promise<SyncResult> {
  const api = opts.api ?? process.env.PLAYOUT_API_URL ?? DEFAULT_API;

  const before = await prisma.trackPlayback.findFirst({
    orderBy: { playedAt: "desc" },
    select: { playedAt: true },
  });
  // Overlap the watermark by an hour: a play can be written to the playout
  // database a moment after the timestamp it carries, so resuming exactly at
  // the watermark can skip the boundary row. Duplicates are impossible anyway.
  const since = before
    ? new Date(before.playedAt.getTime() - 60 * 60 * 1000)
    : null;

  const rows = await fetchPlays(api, since, opts.all ?? false, opts.onProgress);
  const usable = rows.filter((r) => r.title && r.artist_name && r.played_at);

  const earliest = usable.reduce<Date | null>((min, r) => {
    const d = parsePlayedAt(r.played_at);
    return !min || d < min ? d : min;
  }, null);
  const existing = earliest
    ? await prisma.trackPlayback.findMany({
        where: { playedAt: { gte: earliest } },
        select: { playedAt: true, trackTitle: true, artistName: true },
      })
    : [];
  const seen = new Set(
    existing.map((e) => key(e.playedAt, e.trackTitle, e.artistName)),
  );

  // dj_personality is "loretta_merrick"; the platform keys DJs by slug
  // "loretta-merrick". Unmatched personalities leave djId null rather than
  // guessing - the raw value is kept in metadata so nothing is lost.
  const djs = await prisma.dJ.findMany({ select: { id: true, slug: true } });
  const djBySlug = new Map(djs.map((d) => [d.slug, d.id]));

  const fresh = [];
  let unmappedDjs = 0;
  for (const r of usable) {
    const playedAt = parsePlayedAt(r.played_at);
    const k = key(playedAt, r.title!, r.artist_name!);
    if (seen.has(k)) continue;
    seen.add(k); // the source can contain duplicates too

    const djId = r.dj_personality
      ? (djBySlug.get(r.dj_personality.replace(/_/g, "-")) ?? null)
      : null;
    if (r.dj_personality && !djId) unmappedDjs++;

    fresh.push({
      playedAt,
      trackTitle: r.title!,
      artistName: r.artist_name!,
      duration: r.duration_seconds ?? null,
      djId,
      timeSlot: timeSlotFor(playedAt),
      wasScheduled: true,
      // Keep the playout ids so a play can be traced across the id-space
      // boundary without re-deriving it from artist and title.
      metadata: {
        source: "playout-sync",
        playoutPlayId: r.id,
        playoutSongId: r.song_id,
        playoutArtistId: r.artist_id,
        djPersonality: r.dj_personality,
      },
    });
  }

  let inserted = 0;
  if (opts.commit) {
    for (let i = 0; i < fresh.length; i += 500) {
      const r = await prisma.trackPlayback.createMany({
        data: fresh.slice(i, i + 500),
      });
      inserted += r.count;
    }
  }

  const after = await prisma.trackPlayback.findFirst({
    orderBy: { playedAt: "desc" },
    select: { playedAt: true },
  });

  return {
    fetched: rows.length,
    unusable: rows.length - usable.length,
    alreadyHeld: usable.length - fresh.length,
    toInsert: fresh.length,
    inserted,
    unmappedDjs,
    latestBefore: before?.playedAt ?? null,
    latestAfter: after?.playedAt ?? null,
    committed: opts.commit,
  };
}
