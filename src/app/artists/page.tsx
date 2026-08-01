import { flag } from "@/lib/flags";
import { SharedNav } from "@/components/shared-nav";
import {
  getRoster,
  formatDuration,
  RIGHTS_LABEL,
} from "@/lib/roster";
import Link from "next/link";
import Image from "next/image";
import { Music, Radio, ShieldCheck, Sparkles, MapPin } from "lucide-react";

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
export default async function ArtistsPage() {
  const enabled = await flag("artist_showcase");

  if (!enabled) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <SharedNav />
        <main className="max-w-3xl mx-auto px-4 py-24 text-center">
          <Music className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-zinc-50 mb-3">Artists</h1>
          <p className="text-zinc-300">Our artist showcase is coming soon.</p>
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

  const artists = await getRoster();
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
          <p className="text-lg text-zinc-200 max-w-2xl">
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
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-10 text-center">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-50 mb-2">
              The roster is being built
            </h2>
            <p className="text-zinc-200 max-w-lg mx-auto">
              We only list artists whose rights are cleared, so this page stays empty
              until the first of them is confirmed. That is deliberate.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {artists.map((a) => (
              <ArtistCard key={a.name} artist={a} />
            ))}
          </div>
        )}

        <section className="mt-14 rounded-xl border border-amber-700 bg-amber-950 p-6">
          <div className="flex items-start gap-3">
            <Radio className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-50 mb-1">
                Want your music on air?
              </h2>
              <p className="text-zinc-100 mb-4">
                We play independent artists who give us permission — and we pay from
                sponsor revenue rather than charging for airplay.
              </p>
              <Link
                href="/portal/artist"
                className="inline-block bg-amber-600 hover:bg-amber-500 text-zinc-950 font-semibold px-5 py-2.5 rounded-lg transition-colors"
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

function ArtistCard({
  artist: a,
}: {
  artist: Awaited<ReturnType<typeof getRoster>>[number];
}) {
  const body = (
    <>
      <div className="shrink-0">
        {a.artworkUrl ? (
          <Image
            src={a.artworkUrl}
            alt=""
            width={96}
            height={96}
            className="w-24 h-24 rounded-lg object-cover bg-zinc-800"
          />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-zinc-800 flex items-center justify-center">
            <Music className="w-8 h-8 text-zinc-400" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-zinc-50 truncate">{a.name}</h2>
        {a.genre && <p className="text-sm text-zinc-300 mt-0.5">{a.genre}</p>}
        {a.origin && (
          <p className="text-sm text-zinc-300 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {a.origin}
          </p>
        )}

        <p className="text-sm text-zinc-200 mt-2 tabular-nums">
          {a.trackCount} track{a.trackCount === 1 ? "" : "s"}
          {a.totalSeconds > 0 && ` · ${formatDuration(a.totalSeconds)}`}
        </p>

        <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-green-200 bg-green-900 border border-green-700 px-2 py-1 rounded">
          <ShieldCheck className="w-3.5 h-3.5" />
          {RIGHTS_LABEL[a.rightsStatus] ?? "Cleared"}
        </span>
      </div>
    </>
  );

  // Only artists with a profile get a detail page. Linking the rest would
  // promise a biography we do not have.
  if (a.slug) {
    return (
      <Link
        href={`/artists/${a.slug}`}
        className="flex gap-4 rounded-xl border border-zinc-700 bg-zinc-900 p-4 hover:border-amber-600 transition-colors"
      >
        {body}
      </Link>
    );
  }

  return (
    <article className="flex gap-4 rounded-xl border border-zinc-700 bg-zinc-900 p-4">
      {body}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
      <div className="text-3xl font-extrabold text-zinc-50 tabular-nums">{value}</div>
      <div className="text-sm text-zinc-200 mt-1 font-medium">{label}</div>
    </div>
  );
}
