import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Radio, Music, Heart, TrendingUp, Clock, Headphones, Disc3 } from "lucide-react";
import { StationName } from "@/components/station-name";
import { ListenerCount } from "@/components/listener-count";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "North Country Radio | TrueFans RADIO Network",
  description: "North Country Radio — 24/7 Americana, Country, and Singer-Songwriter music. More music per hour, no filler. Part of the TrueFans RADIO Network.",
};

export const revalidate = 300;

async function getStationStats() {
  try {
    const station = await prisma.station.findFirst({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!station) return { songs: 0, artists: 0 };
    const [songs, artists] = await Promise.all([
      prisma.song.count({ where: { stationId: station.id, isActive: true } }),
      prisma.artist.count({ where: { deletedAt: null } }),
    ]);
    return { songs, artists };
  } catch {
    return { songs: 0, artists: 0 };
  }
}

export default async function StationPage() {
  const stats = await getStationStats();

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 text-gray-100">
      {/* Navigation — dark, minimal */}
      <nav className="border-b border-white/10 bg-gray-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Image src="/logos/ncr-logo.png" alt="North Country Radio" width={32} height={32} className="h-8 w-auto object-contain" />
              <StationName className="font-bold text-xl text-white" />
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/schedule" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                Schedule
              </Link>
              <Link href="/network" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                Network
              </Link>
              <Link
                href="/player"
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                Listen Live
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero — cinematic, dramatic */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-gray-950 to-gray-950" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <p className="text-amber-400 font-medium tracking-widest uppercase text-sm mb-8">
            Flagship Station &mdash; TrueFans RADIO Network
          </p>

          <Image
            src="/logos/ncr-logo.png"
            alt="North Country Radio"
            width={200}
            height={200}
            className="mx-auto w-32 sm:w-40 md:w-48 h-auto object-contain mb-8"
          />

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-bold text-white leading-none mb-6 tracking-tight">
            North Country<br />Radio
          </h1>

          <p className="text-2xl sm:text-3xl text-amber-400/90 font-serif italic mb-8">
            Where the music finds you.
          </p>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            24/7 Americana, Country, and Singer-Songwriter music. Curated for warmth,
            storytelling, and authenticity. More songs per hour. No filler. Just great music.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/player"
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-gray-950 px-8 py-4 rounded-lg text-lg font-bold transition-colors shadow-lg shadow-amber-500/20"
            >
              <Headphones className="w-5 h-5" />
              <span>Listen Now</span>
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center space-x-2 border border-white/20 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-white/5 transition-colors"
            >
              <Clock className="w-5 h-5" />
              <span>View Schedule</span>
            </Link>
          </div>

          <ListenerCount mode="full" />
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="border-t border-white/5 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center mb-16 text-white">
            Music First. Always.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-5">
                <Music className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">17 Songs Per Hour</h3>
              <p className="text-gray-400 leading-relaxed">
                No DJ monologues. No filler segments. Just expertly curated music
                with clean imaging between songs.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-5">
                <Heart className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Artist-First Economics</h3>
              <p className="text-gray-400 leading-relaxed">
                80% of sponsor revenue goes directly to the artists you hear.
                Every play means real money for real musicians.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-5">
                <Disc3 className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Curated, Not Algorithmic</h3>
              <p className="text-gray-400 leading-relaxed">
                Every song is hand-picked. Five rotation tiers from power hits
                to indie discoveries. Gender-balanced. Repeat-protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* By The Numbers */}
      <section className="bg-gray-900/50 border-y border-white/5 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center mb-14 text-white">
            By The Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <NumberCard value="17" label="Songs / Hour" sub="Daytime" />
            <NumberCard value="16" label="Songs / Hour" sub="After Hours" />
            <NumberCard value={stats.songs > 0 ? stats.songs.toLocaleString() : "1,200+"} label="Songs" sub="In rotation" />
            <NumberCard value={stats.artists > 0 ? stats.artists.toLocaleString() : "535+"} label="Artists" sub="Independent" />
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 border border-white/10 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-5 text-white">Station Capacity</h3>
              <div className="space-y-3 text-gray-300">
                <Row label="Tracks per month" value="8,640" />
                <Row label="Ad spots per month" value="17,280" />
                <Row label="Prime hours (6am-6pm)" value="360 hrs/mo" />
                <Row label="After hours (6pm-6am)" value="360 hrs/mo" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-600/90 to-orange-700/90 border border-amber-500/30 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-5 text-white">Revenue Model</h3>
              <div className="space-y-3 text-amber-50">
                <Row label="Artist Subscriptions" value="$3,900" />
                <Row label="Sponsor Revenue" value="$22,250" />
                <div className="text-amber-200/80">
                  <Row label="  Artist Pool (80%)" value="$17,800" />
                  <Row label="  Station Ops (20%)" value="$4,450" />
                </div>
                <div className="pt-3 border-t border-white/20 flex justify-between items-center text-lg font-bold text-white">
                  <span>Net Station Revenue</span>
                  <span>$8,350/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programming Philosophy */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-8 text-white">
            The Sound of the Open Road
          </h2>
          <div className="space-y-6 text-lg text-gray-400 leading-relaxed">
            <p>
              North Country Radio isn&apos;t a place on a map &mdash; it&apos;s the feeling of
              a long highway, an honest lyric, and a song that stays with you.
            </p>
            <p>
              We play Americana, country, singer-songwriter, and indie folk &mdash; blending
              legends with the next generation of independent voices.
            </p>
            <p className="text-amber-400 font-serif text-xl italic">
              Every hour has a soul. Every song has a story.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <Clock className="w-7 h-7 mx-auto mb-3 text-amber-400" />
              <h3 className="font-bold text-white mb-1">24/7 Music</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-500">Never stops. Never repeats.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <Music className="w-7 h-7 mx-auto mb-3 text-amber-400" />
              <h3 className="font-bold text-white mb-1">Five Genres</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-500">Americana, Country, Folk, Indie, Singer-Songwriter</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <TrendingUp className="w-7 h-7 mx-auto mb-3 text-amber-400" />
              <h3 className="font-bold text-white mb-1">Smart Rotation</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-500">Cooldown timers, gender balance, artist separation</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 bg-gradient-to-b from-gray-950 to-gray-900 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-serif font-bold mb-4 text-white">
            Ready to Listen?
          </h2>
          <p className="text-lg text-gray-400 mb-10">
            Tune in now. Great music is always playing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/player"
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-gray-950 px-8 py-4 rounded-lg text-lg font-bold transition-colors shadow-lg shadow-amber-500/20"
            >
              <Headphones className="w-5 h-5" />
              <span>Listen Now</span>
            </Link>
            <Link
              href="/listen/register"
              className="inline-flex items-center space-x-2 border border-white/20 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-white/5 transition-colors"
            >
              <span>Create Free Account</span>
            </Link>
            <Link
              href="/network"
              className="inline-flex items-center space-x-2 text-gray-500 hover:text-gray-300 px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              <Radio className="w-5 h-5" />
              <span>TrueFans Network</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-gray-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <StationName className="text-2xl font-serif font-bold text-white mb-2" />
          <p className="text-amber-400/80 italic mb-6">Where the music finds you.</p>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Part of the{" "}
            <Link href="/network" className="text-amber-400/60 hover:text-amber-400">
              TrueFans RADIO Network
            </Link>
          </p>
          <p className="text-xs text-gray-700 mt-4">&copy; 2026 TrueFans RADIO. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function NumberCard({ value, label, sub }: { value: string | number; label: string; sub: string }) {
  return (
    <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6 text-center">
      <div className="text-3xl sm:text-4xl font-bold text-amber-400 mb-1">{value}</div>
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">{sub}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
