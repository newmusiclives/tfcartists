import { prisma } from "@/lib/db";

/**
 * Station analytics derived from TrackPlayback.
 *
 * This only became possible once the play sync existed - before that the table
 * was empty and every figure here would have been zero, which is precisely why
 * the flag shipped switched off. The numbers are real airplay, not estimates.
 *
 * Everything is computed in SQL. Pulling months of plays into memory to reduce
 * them in JS would be slow and would silently cap at whatever page size someone
 * chose later.
 */

export type Totals = {
  plays: number;
  artists: number;
  tracks: number;
  /** Tracks in the cleared catalogue, for context against tracks PLAYED. */
  catalogueTracks: number;
  catalogueArtists: number;
  hoursOfMusic: number;
  firstPlay: Date | null;
  lastPlay: Date | null;
};

export type Row = { label: string; plays: number; share: number };
export type DayPoint = { day: string; plays: number };

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getTotals(sinceDays: number): Promise<Totals> {
  const since = new Date(Date.now() - sinceDays * DAY_MS);
  const rows = await prisma.$queryRaw<
    { plays: bigint; artists: bigint; tracks: bigint; seconds: bigint | null; first: Date | null; last: Date | null }[]
  >`
    SELECT COUNT(*)                              AS plays,
           COUNT(DISTINCT "artistName")          AS artists,
           COUNT(DISTINCT "trackTitle")          AS tracks,
           SUM(COALESCE("duration", 0))          AS seconds,
           MIN("playedAt")                       AS first,
           MAX("playedAt")                       AS last
    FROM "TrackPlayback"
    WHERE "playedAt" >= ${since}
  `;
  // "tracks" is how many DISTINCT tracks were played in the window, which is
  // not the same as how many exist. Reporting it alone reads as a catalogue
  // count and invites the reasonable conclusion that tracks are missing.
  const cat = await prisma.song.groupBy({
    by: ["artistName"],
    where: {
      rightsStatus: { in: ["owned_ai", "direct_licence", "public_domain"] },
      retiredAt: null,
      isActive: true,
    },
    _count: { _all: true },
  });
  const catalogueTracks = cat.reduce((n, c) => n + c._count._all, 0);

  const r = rows[0];
  return {
    catalogueTracks,
    catalogueArtists: cat.length,
    plays: Number(r?.plays ?? 0),
    artists: Number(r?.artists ?? 0),
    tracks: Number(r?.tracks ?? 0),
    hoursOfMusic: Math.round(Number(r?.seconds ?? 0) / 3600),
    firstPlay: r?.first ?? null,
    lastPlay: r?.last ?? null,
  };
}

export async function getTopArtists(sinceDays: number, limit = 10): Promise<Row[]> {
  const since = new Date(Date.now() - sinceDays * DAY_MS);
  const rows = await prisma.$queryRaw<{ label: string; plays: bigint }[]>`
    SELECT "artistName" AS label, COUNT(*) AS plays
    FROM "TrackPlayback"
    WHERE "playedAt" >= ${since}
    GROUP BY "artistName"
    ORDER BY plays DESC
    LIMIT ${limit}
  `;
  const total = rows.reduce((s, r) => s + Number(r.plays), 0);
  return rows.map((r) => ({
    label: r.label,
    plays: Number(r.plays),
    share: total ? (Number(r.plays) / total) * 100 : 0,
  }));
}

export async function getTopTracks(sinceDays: number, limit = 10): Promise<Row[]> {
  const since = new Date(Date.now() - sinceDays * DAY_MS);
  const rows = await prisma.$queryRaw<{ label: string; plays: bigint }[]>`
    SELECT "trackTitle" || ' — ' || "artistName" AS label, COUNT(*) AS plays
    FROM "TrackPlayback"
    WHERE "playedAt" >= ${since}
    GROUP BY "trackTitle", "artistName"
    ORDER BY plays DESC
    LIMIT ${limit}
  `;
  const total = rows.reduce((s, r) => s + Number(r.plays), 0);
  return rows.map((r) => ({
    label: r.label,
    plays: Number(r.plays),
    share: total ? (Number(r.plays) / total) * 100 : 0,
  }));
}

export async function getPlaysByDay(sinceDays: number): Promise<DayPoint[]> {
  const since = new Date(Date.now() - sinceDays * DAY_MS);
  const rows = await prisma.$queryRaw<{ day: Date; plays: bigint }[]>`
    SELECT date_trunc('day', "playedAt") AS day, COUNT(*) AS plays
    FROM "TrackPlayback"
    WHERE "playedAt" >= ${since}
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  return rows.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    plays: Number(r.plays),
  }));
}

export async function getTimeSlotSplit(sinceDays: number): Promise<Row[]> {
  const since = new Date(Date.now() - sinceDays * DAY_MS);
  const rows = await prisma.$queryRaw<{ label: string; plays: bigint }[]>`
    SELECT "timeSlot" AS label, COUNT(*) AS plays
    FROM "TrackPlayback"
    WHERE "playedAt" >= ${since}
    GROUP BY "timeSlot"
    ORDER BY plays DESC
  `;
  const total = rows.reduce((s, r) => s + Number(r.plays), 0);
  return rows.map((r) => ({
    label: r.label,
    plays: Number(r.plays),
    share: total ? (Number(r.plays) / total) * 100 : 0,
  }));
}

/**
 * Rotation health: how evenly airtime is spread.
 *
 * A station that plays its top artist 40% of the time sounds broken even if
 * every individual track is good, and the fairness protocol depends on this
 * staying flat. Reported as the top artist's share, which is the number a
 * listener actually perceives.
 */
export async function getRotationBalance(sinceDays: number) {
  const artists = await getTopArtists(sinceDays, 1000);
  const topShare = artists[0]?.share ?? 0;
  const evenShare = artists.length ? 100 / artists.length : 0;
  return {
    artistsInRotation: artists.length,
    topArtistShare: topShare,
    evenShare,
    // Above ~2x an even split, one artist is dominating the sound of the station.
    skewed: artists.length > 2 && topShare > evenShare * 2,
  };
}
