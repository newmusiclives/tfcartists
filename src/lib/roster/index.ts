import { prisma } from "@/lib/db";
import { CLEARED_STATUSES } from "@/lib/rights";

/**
 * The public roster: who is on air, and what we can say about them.
 *
 * Two sources, joined on name because the platform, the playout engine and
 * LABEL all have separate id spaces:
 *
 *   Song         - what actually plays, and therefore who appears at all
 *   RosterArtist - the profile (bio, origin, portrait) imported from LABEL
 *
 * Song is the authority on WHO appears. An artist with a profile but no
 * playable tracks is a dead link; an artist playing without a profile is
 * simply one we cannot say much about yet. Neither should break the page.
 */

export type RosterEntry = {
  name: string;
  slug: string | null;
  trackCount: number;
  totalSeconds: number;
  genre: string | null;
  artworkUrl: string | null;
  rightsStatus: string;
  bio: string | null;
  origin: string | null;
  hasProfile: boolean;
};

/** "indie rock" and "Indie Pop" both come out of the generator. */
export function titleCase(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .split(/[\s/]+/)
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export const RIGHTS_LABEL: Record<string, string> = {
  owned_ai: "Original AI artist",
  direct_licence: "Permission granted",
  public_domain: "Public domain",
};

export async function getRoster(): Promise<RosterEntry[]> {
  const grouped = await prisma.song.groupBy({
    by: ["artistName"],
    where: {
      rightsStatus: { in: CLEARED_STATUSES },
      retiredAt: null,
      isActive: true,
    },
    _count: { _all: true },
    _sum: { duration: true },
    orderBy: { _count: { artistName: "desc" } },
  });

  const names = grouped.map((g) => g.artistName);

  const details = await prisma.song.findMany({
    where: {
      artistName: { in: names },
      rightsStatus: { in: CLEARED_STATUSES },
      retiredAt: null,
      isActive: true,
    },
    select: {
      artistName: true,
      genre: true,
      artworkUrl: true,
      rightsStatus: true,
    },
  });

  // findMany + distinct returns whichever row the planner reaches first, which
  // can be one with a null artworkUrl even when a sibling has art - so an
  // artist would lose their portrait at random between requests. Fold instead,
  // preferring the first non-null of each field.
  const bySong = new Map<
    string,
    { genre: string | null; artworkUrl: string | null; rightsStatus: string }
  >();
  for (const d of details) {
    const seen = bySong.get(d.artistName);
    bySong.set(d.artistName, {
      genre: seen?.genre ?? d.genre,
      artworkUrl: seen?.artworkUrl ?? d.artworkUrl,
      rightsStatus: seen?.rightsStatus ?? d.rightsStatus ?? "owned_ai",
    });
  }

  const profiles = await prisma.rosterArtist.findMany({
    where: { name: { in: names }, isActive: true },
  });
  const byProfile = new Map(profiles.map((p) => [p.name, p]));

  return grouped.map((g) => {
    const song = bySong.get(g.artistName);
    const profile = byProfile.get(g.artistName);
    const origin = profile
      ? [profile.originCity, profile.originCountry].filter(Boolean).join(", ")
      : "";

    return {
      name: g.artistName,
      slug: profile?.slug ?? null,
      trackCount: g._count._all,
      totalSeconds: g._sum.duration ?? 0,
      // Prefer the roster's genre - it is curated per artist, where the song
      // genre is whatever the generator wrote on that particular track.
      genre: profile?.genre ?? titleCase(song?.genre ?? null),
      artworkUrl: profile?.imageUrl ?? song?.artworkUrl ?? null,
      rightsStatus: song?.rightsStatus ?? "owned_ai",
      bio: profile?.bio ?? null,
      origin: origin || null,
      hasProfile: Boolean(profile),
    };
  });
}

export async function getArtistBySlug(slug: string) {
  const profile = await prisma.rosterArtist.findUnique({ where: { slug } });
  if (!profile || !profile.isActive) return null;

  const tracks = await prisma.song.findMany({
    where: {
      artistName: profile.name,
      rightsStatus: { in: CLEARED_STATUSES },
      retiredAt: null,
      isActive: true,
    },
    select: { id: true, title: true, duration: true, artworkUrl: true },
    orderBy: { title: "asc" },
  });

  // A profile with nothing playable is a dead page, so treat it as absent
  // rather than rendering an artist with an empty discography.
  if (tracks.length === 0) return null;

  return { profile, tracks };
}
