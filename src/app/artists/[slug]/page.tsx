import { flag } from "@/lib/flags";
import { SharedNav } from "@/components/shared-nav";
import { getArtistBySlug, formatDuration, RIGHTS_LABEL } from "@/lib/roster";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Music, ShieldCheck, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getArtistBySlug(params.slug);
  if (!data) return { title: "Artist | TrueFans RADIO" };
  const { profile } = data;
  return {
    title: `${profile.name} | TrueFans RADIO`,
    // The bio is long-form prose; trim rather than dumping a paragraph into a
    // meta description where search engines will truncate it mid-sentence.
    description:
      profile.bio?.slice(0, 155).replace(/\s+\S*$/, "") ??
      `${profile.name} on TrueFans RADIO.`,
  };
}

export default async function ArtistPage({
  params,
}: {
  params: { slug: string };
}) {
  // The detail page lives behind the same flag as the index. Leaving it
  // reachable while the showcase is off would expose the roster through a
  // guessable URL, which defeats the point of gating the launch.
  const enabled = await flag("artist_showcase");
  if (!enabled) notFound();

  const data = await getArtistBySlug(params.slug);
  if (!data) notFound();

  const { profile, tracks } = data;
  const totalSeconds = tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0);
  const origin = [profile.originCity, profile.originCountry]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-zinc-950">
      <SharedNav />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/artists"
          className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          All artists
        </Link>

        <header className="flex flex-col sm:flex-row gap-6 mb-10">
          {profile.imageUrl ? (
            <Image
              src={profile.imageUrl}
              alt=""
              width={200}
              height={200}
              className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl object-cover bg-zinc-800 shrink-0"
              priority
            />
          ) : (
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
              <Music className="w-12 h-12 text-zinc-400" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-4xl font-bold text-zinc-50">{profile.name}</h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-zinc-300">
              {profile.genre && <span>{profile.genre}</span>}
              {profile.subGenre && profile.subGenre !== profile.genre && (
                <span className="text-zinc-400">{profile.subGenre}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-zinc-300">
              {origin && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {origin}
                </span>
              )}
              {profile.artistType && (
                <span className="inline-flex items-center gap-1.5 capitalize">
                  <Users className="w-4 h-4" />
                  {profile.artistType}
                </span>
              )}
            </div>

            <span className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-green-200 bg-green-900 border border-green-700 px-2.5 py-1 rounded">
              <ShieldCheck className="w-3.5 h-3.5" />
              {RIGHTS_LABEL[profile.rightsBasis] ?? "Cleared"}
            </span>
          </div>
        </header>

        {profile.bio && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-zinc-50 mb-3">About</h2>
            <div className="text-zinc-200 leading-relaxed space-y-4 max-w-2xl">
              {profile.bio.split(/\n\s*\n/).map((para, i) => (
                <p key={i}>{para.trim()}</p>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-semibold text-zinc-50">
              In rotation
            </h2>
            <span className="text-sm text-zinc-300 tabular-nums">
              {tracks.length} track{tracks.length === 1 ? "" : "s"} ·{" "}
              {formatDuration(totalSeconds)}
            </span>
          </div>

          <ol className="rounded-xl border border-zinc-700 bg-zinc-900 divide-y divide-zinc-800">
            {tracks.map((t, i) => (
              <li
                key={t.id}
                className="flex items-center gap-4 px-4 py-3"
              >
                <span className="text-sm text-zinc-400 tabular-nums w-6 shrink-0">
                  {i + 1}
                </span>
                <span className="text-zinc-100 flex-1 min-w-0 truncate">
                  {t.title}
                </span>
                {t.duration != null && (
                  <span className="text-sm text-zinc-300 tabular-nums shrink-0">
                    {Math.floor(t.duration / 60)}:
                    {String(t.duration % 60).padStart(2, "0")}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
