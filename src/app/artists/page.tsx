import { prisma } from "@/lib/db";
import { flag } from "@/lib/flags";
import { CLEARED_STATUSES } from "@/lib/rights";
import { SharedNav } from "@/components/shared-nav";
import Link from "next/link";
import { Music, Radio, ShieldCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Artists in Rotation | TrueFans RADIO",
  description:
    "Every artist whose music we own or hold written permission for. No major-label catalogue, no unlicensed plays.",
};

/**
 * Public artist showcase.
 *
 * Only artists with RIGHTS-CLEARED music appear. That is the point: the page
 * doubles as the public evidence of the catalogue policy and as recruitment for
 * the next artist, so listing anything unreviewed would undermine both.
 *
 * Gated behind the artist_showcase flag so it can be launched deliberately.
 */
async function getArtists() {
  const songs = await prisma.song.groupBy({
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

  // Genre and provenance come from any one of the artist's songs; they are
  // per-artist values in practice.
  const details = await prisma.song.findMany({
    where: {
      artistName: { in: songs.map((s) => s.artistName) },
      rightsStatus: { in: CLEARED_STATUSES },
    },
    select: { artistName: true, genre: true, sourceSystem: true, rightsStatus: true },
    distinct: ["artistName"],
  });
  const byName = new Map(details.map((d) => [d.artistName, d]));

  return songs.map((s) => ({
    name: s.artistName,
    trackCount: s._count._all,
    totalSeconds: s._sum.duration ?? 0,
    genre: byName.get(s.artistName)?.genre ?? null,
    rightsStatus: byName.get(s.artistName)?.rightsStatus ?? "owned_ai",
  }));
}

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

const RIGHTS_LABEL: Record<string, string> = {
  owned_ai: "Original AI artist",
  direct_licence: "Permission granted",
  public_domain: "Public domain",
};

export default async function ArtistsPage() {
  const enabled = await flag("artist_showcase");

  if (!enabled) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <SharedNav />
        <main className="max-w-3xl mx-auto px-4 py-24 text-center">
          <Music className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-zinc-50 mb-3">Artists</h1>
          <p className="text-zinc-300">
            Our artist showcase is coming soon.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 text-amber-300 hover:text-amber-200 underline"
          >
            Back to the station
          </Link>
        </main>
      </div>
    );
  }

  const artists = await getArtists();
  const totalTracks = artists.reduce((sum, a) => sum + a.trackCount, 0);
  const totalSeconds = artists.reduce((sum, a) => sum + a.totalSeconds, 0);

  return (
    <div className="min-h-screen bg-zinc-950">
      <SharedNav />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Music className="w-8 h-8 text-amber-400" />
            <h1 className="text-4xl font-bold text-zinc-50">Artists in Rotation</h1>
          </div>
          <p className="text-lg text-zinc-300 max-w-2xl">
            Every artist here is either an original AI artist we own outright, or an
            independent artist who gave us written permission. No major-label
            catalogue, no unlicensed plays.
          </p>
        </header>

        {artists.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <Stat label="Artists" value={artists.length.toLocaleString()} />
            <Stat label="Tracks" value={totalTracks.toLocaleString()} />
            <Stat label="Music" value={formatDuration(totalSeconds)} />
          </div>
        )}

        {artists.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-50 mb-2">
              The roster is being built
            </h2>
            <p className="text-zinc-300 max-w-lg mx-auto">
              We only list artists whose rights are cleared, so this page stays empty
              until the first of them is confirmed. That is deliberate.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {artists.map((a) => (
              <article
                key={a.name}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-zinc-50 truncate">
                      {a.name}
                    </h2>
                    {a.genre && (
                      <p className="text-sm text-zinc-300 mt-0.5">{a.genre}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 shrink-0 text-xs text-green-300 bg-green-950/60 border border-green-800 px-2 py-1 rounded">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {RIGHTS_LABEL[a.rightsStatus] ?? "Cleared"}
                  </span>
                </div>

                <p className="text-sm text-zinc-300 mt-4 tabular-nums">
                  {a.trackCount} track{a.trackCount === 1 ? "" : "s"}
                  {a.totalSeconds > 0 && ` · ${formatDuration(a.totalSeconds)}`}
                </p>
              </article>
            ))}
          </div>
        )}

        <section className="mt-14 rounded-xl border border-amber-800 bg-amber-950/30 p-6">
          <div className="flex items-start gap-3">
            <Radio className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-50 mb-1">
                Want your music on air?
              </h2>
              <p className="text-zinc-200 mb-4">
                We play independent artists who give us permission — and we pay from
                sponsor revenue rather than charging for airplay.
              </p>
              <Link
                href="/portal/artist"
                className="inline-block bg-amber-700 hover:bg-amber-800 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Submit your music
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="text-3xl font-extrabold text-zinc-50 tabular-nums">{value}</div>
      <div className="text-sm text-zinc-300 mt-1 font-medium">{label}</div>
    </div>
  );
}
