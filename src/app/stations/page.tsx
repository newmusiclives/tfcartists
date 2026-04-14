import { prisma } from "@/lib/db";
import { SharedNav } from "@/components/shared-nav";
import Link from "next/link";
import { Radio, Music, Users, Search } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStations() {
  const stations = await prisma.station.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      callSign: true,
      genre: true,
      tagline: true,
      description: true,
      stationCode: true,
      logoUrl: true,
      streamUrl: true,
      _count: { select: { songs: true } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  const withDjCounts = await Promise.all(
    stations.map(async (station) => {
      const djCount = await prisma.dJ.count({
        where: { stationId: station.id },
      });
      return { ...station, djCount };
    })
  );

  const allGenres = new Set<string>();
  withDjCounts.forEach((s) =>
    s.genre
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean)
      .forEach((g) => allGenres.add(g))
  );

  return { stations: withDjCounts, genres: Array.from(allGenres).sort() };
}

export default async function StationsDirectoryPage() {
  const { stations, genres } = await getStations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 text-zinc-100">
      <SharedNav />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-zinc-950 to-purple-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="flex justify-center mb-4">
            <Radio className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            TrueFans RADIO Network
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Discover independent stations powered by real DJs and real artists.
            Find your new favorite sound.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Genre Filter Pills */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <span className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium">
              All
            </span>
            {genres.map((g) => (
              <span
                key={g}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-full text-sm hover:bg-zinc-700 cursor-pointer"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Station Grid */}
        {stations.length === 0 ? (
          <div className="text-center py-20">
            <Radio className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">No stations yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {stations.map((station) => (
              <div
                key={station.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition-all group"
              >
                <div className="flex items-start gap-4 mb-4">
                  {station.logoUrl ? (
                    <img
                      src={station.logoUrl}
                      alt={station.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <Radio className="w-7 h-7 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">
                      {station.name}
                    </h3>
                    {station.callSign && (
                      <span className="text-xs text-zinc-500 font-mono">
                        {station.callSign}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-zinc-500 mb-1">{station.genre}</p>
                {station.tagline && (
                  <p className="text-sm text-zinc-400 italic mb-4">
                    &ldquo;{station.tagline}&rdquo;
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {station.djCount} DJs
                  </span>
                  <span className="flex items-center gap-1">
                    <Music className="w-3.5 h-3.5" />
                    {station._count.songs} Songs
                  </span>
                </div>

                {station.streamUrl && (
                  <div className="mt-4">
                    <a
                      href={station.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      <Radio className="w-4 h-4" />
                      Listen Live
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-zinc-800 rounded-2xl p-12">
          <h2 className="text-2xl font-bold mb-3">Start Your Own Station</h2>
          <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
            Launch an AI-powered radio station with custom DJs, automated
            programming, and sponsor management.
          </p>
          <Link
            href="/operator/templates"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium"
          >
            <Radio className="w-5 h-5" />
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
