import type { Metadata } from "next";
import Link from "next/link";
import { Radio, Podcast, Rss, Headphones } from "lucide-react";
import { StationName } from "@/components/station-name";
import { prisma } from "@/lib/db";
import { EpisodeList } from "./episode-list";
import { CopyRssButton } from "./copy-rss-button";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app";

export const metadata: Metadata = {
  title: "Podcast Archive",
  description:
    "Listen to past shows, hourly replays, and best-of compilations from North Country Radio. Subscribe on Apple Podcasts, Spotify, or via RSS.",
  alternates: {
    types: {
      "application/rss+xml": `${SITE_URL}/api/podcast/feed`,
    },
  },
};

// Revalidate every 5 minutes
export const revalidate = 300;

async function getPodcastData() {
  try {
    const station = await prisma.station.findFirst({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, tagline: true, logoUrl: true },
    });

    if (!station) {
      return { station: null, episodes: [], djNames: [] };
    }

    const episodes = await prisma.podcastEpisode.findMany({
      where: {
        stationId: station.id,
        isPublished: true,
      },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        audioFilePath: true,
        duration: true,
        publishedAt: true,
        episodeType: true,
        djName: true,
        airDate: true,
      },
    });

    // Get unique DJ names
    const djNames = [
      ...new Set(
        episodes.map((ep) => ep.djName).filter((name): name is string => name !== null)
      ),
    ].sort();

    // Serialize dates for client component
    const serialized = episodes.map((ep) => ({
      ...ep,
      publishedAt: ep.publishedAt?.toISOString() ?? null,
    }));

    return { station, episodes: serialized, djNames };
  } catch {
    return { station: null, episodes: [], djNames: [] };
  }
}

export default async function PodcastsPage() {
  const { station, episodes, djNames } = await getPodcastData();

  const rssUrl = station
    ? `${SITE_URL}/api/podcast/feed?stationId=${station.id}`
    : `${SITE_URL}/api/podcast/feed`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Radio className="w-6 h-6 text-amber-500" />
              <StationName className="font-bold text-xl text-white" />
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/station"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Station
              </Link>
              <Link
                href="/schedule"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Schedule
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-amber-500/20">
          <Podcast className="w-4 h-4" />
          <span>Podcast Archive</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
          {station?.name || "North Country Radio"} Podcast
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          {station?.tagline || "Where the music finds you."} Catch up on past shows, replay your
          favorite hours, and discover best-of compilations.
        </p>

        {/* Subscribe Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://podcasts.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:from-purple-500 hover:to-purple-600 transition-all shadow-lg shadow-purple-900/30"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c3.87 0 7 3.13 7 7 0 1.93-.78 3.68-2.05 4.95l-.01-.01c-.17-.41-.43-.74-.78-.97-.35-.23-.75-.35-1.16-.35-.55 0-1.08.22-1.46.62-.38.39-.59.91-.59 1.46 0 .34.09.67.25.97H10.8c.16-.3.25-.63.25-.97 0-.55-.21-1.07-.59-1.46-.38-.4-.91-.62-1.46-.62-.41 0-.81.12-1.16.35-.35.23-.61.56-.78.97l-.01.01C5.78 15.68 5 13.93 5 12c0-3.87 3.13-7 7-7zm0 2a5 5 0 00-5 5c0 .73.16 1.43.44 2.05.36-.2.77-.3 1.18-.3.52 0 1.01.16 1.42.46.42-.3.91-.46 1.42-.46h1.08c.51 0 1 .16 1.42.46.41-.3.9-.46 1.42-.46.41 0 .82.1 1.18.3.28-.62.44-1.32.44-2.05a5 5 0 00-5-5zm-1 10.5c0 .28.1.53.27.71.18.18.43.29.73.29.28 0 .53-.1.71-.27l.02-.02c.18-.18.27-.43.27-.71v-1c0-.28-.1-.53-.27-.71a.99.99 0 00-.71-.29h-.04c-.28 0-.53.1-.71.27-.18.18-.27.43-.27.71v1.02z" />
            </svg>
            Apple Podcasts
          </a>
          <a
            href="https://open.spotify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:from-green-500 hover:to-green-600 transition-all shadow-lg shadow-green-900/30"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 11-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 01.207.857zm1.225-2.717a.78.78 0 01-1.072.257c-2.687-1.652-6.786-2.131-9.965-1.166a.78.78 0 01-.973-.519.781.781 0 01.52-.972c3.632-1.102 8.147-.568 11.234 1.328a.78.78 0 01.256 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.936.936 0 11-.543-1.791c3.532-1.072 9.404-.865 13.115 1.338a.936.936 0 01-.953 1.613z" />
            </svg>
            Spotify
          </a>
          <CopyRssButton rssUrl={rssUrl} />
        </div>
      </section>

      {/* Episode Count Summary */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{episodes.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Episodes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{djNames.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Hosts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {episodes.filter((e) => e.audioFilePath).length}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Playable</div>
          </div>
        </div>
      </section>

      {/* Episodes */}
      <section className="py-8">
        {episodes.length === 0 ? (
          <div className="max-w-5xl mx-auto px-4 text-center py-16">
            <Headphones className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              No episodes published yet. Check back soon!
            </p>
          </div>
        ) : (
          <EpisodeList episodes={episodes} djNames={djNames} />
        )}
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">
            Prefer Live Radio?
          </h2>
          <p className="text-gray-400 mb-8">
            Tune in to our 24/7 live stream for the full experience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/station"
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-8 py-3 rounded-lg text-base font-bold hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/30"
            >
              <Radio className="w-5 h-5" />
              Listen Live
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 border border-zinc-700 text-gray-300 px-8 py-3 rounded-lg text-base font-bold hover:bg-zinc-800 transition-colors"
            >
              View Schedule
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 text-gray-500 py-12 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4">
            <StationName className="text-2xl font-serif font-bold text-white" />
          </div>
          <p className="text-sm">
            Part of the{" "}
            <Link href="/network" className="text-amber-400 hover:text-amber-300">
              TrueFans RADIO Network
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
