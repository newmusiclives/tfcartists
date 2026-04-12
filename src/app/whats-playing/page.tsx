"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio, Clock, CalendarDays, Music, ChevronRight } from "lucide-react";

/* ---------- Types ---------- */

interface Track {
  id?: string;
  title: string;
  artistName: string;
  artworkUrl: string | null;
  playedAt?: string;
}

interface ShowInfo {
  djName: string;
  showName: string;
  shiftStart: number;
  shiftEnd: number;
}

interface WhatsPlayingData {
  stationName: string;
  nowPlaying: Track | null;
  recentlyPlayed: Track[];
  upNext: Track[];
  currentShow: ShowInfo | null;
}

/* ---------- Helpers ---------- */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12:00am";
  if (h === 12) return "12:00pm";
  if (h < 12) return `${h}:00am`;
  return `${h - 12}:00pm`;
}

/* ---------- Sub-components ---------- */

function EqualizerBars() {
  return (
    <span className="inline-flex items-end space-x-0.5 h-4 ml-2" aria-hidden>
      <span className="w-1 bg-green-400 rounded-full animate-eq-1" />
      <span className="w-1 bg-green-400 rounded-full animate-eq-2" />
      <span className="w-1 bg-green-400 rounded-full animate-eq-3" />
      <span className="w-1 bg-green-400 rounded-full animate-eq-4" />
    </span>
  );
}

function ArtworkPlaceholder({ size = "lg" }: { size?: "lg" | "sm" }) {
  const cls =
    size === "lg"
      ? "w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72"
      : "w-12 h-12";
  return (
    <div
      className={`${cls} rounded-xl bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center flex-shrink-0`}
    >
      <Music className={size === "lg" ? "w-16 h-16 text-amber-700/50" : "w-6 h-6 text-amber-700/50"} />
    </div>
  );
}

function TrackRow({ track, showTime = true }: { track: Track; showTime?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-white/60 transition-colors">
      {track.artworkUrl ? (
        <Image
          src={track.artworkUrl}
          alt={`${track.title} artwork`}
          width={48}
          height={48}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <ArtworkPlaceholder size="sm" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{track.title}</p>
        <p className="text-sm text-gray-600 truncate">{track.artistName}</p>
      </div>
      {showTime && track.playedAt && (
        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
          {timeAgo(track.playedAt)}
        </span>
      )}
    </div>
  );
}

/* ---------- Page ---------- */

export default function WhatsPlayingPage() {
  const [data, setData] = useState<WhatsPlayingData | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0); // forces re-render for timeAgo updates

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/whats-playing", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const json: WhatsPlayingData = await res.json();
      setData(json);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  // Initial fetch + 30-second auto-refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Suppress unused-var warning for tick
  void tick;

  return (
    <>
      {/* Inline keyframes for equalizer animation */}
      <style jsx global>{`
        @keyframes eq-bounce-1 {
          0%, 100% { height: 6px; }
          50% { height: 16px; }
        }
        @keyframes eq-bounce-2 {
          0%, 100% { height: 14px; }
          50% { height: 6px; }
        }
        @keyframes eq-bounce-3 {
          0%, 100% { height: 10px; }
          50% { height: 16px; }
        }
        @keyframes eq-bounce-4 {
          0%, 100% { height: 8px; }
          50% { height: 14px; }
        }
        .animate-eq-1 { animation: eq-bounce-1 0.8s ease-in-out infinite; }
        .animate-eq-2 { animation: eq-bounce-2 0.6s ease-in-out infinite; }
        .animate-eq-3 { animation: eq-bounce-3 0.9s ease-in-out infinite; }
        .animate-eq-4 { animation: eq-bounce-4 0.7s ease-in-out infinite; }
      `}</style>

      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        {/* Navigation */}
        <nav className="border-b bg-white/80 dark:bg-zinc-950/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <Radio className="w-6 h-6 text-amber-700" />
                <span className="font-bold text-xl text-gray-900 dark:text-white">
                  {data?.stationName || "TrueFans RADIO"}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Home
                </Link>
                <Link href="/schedule" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Schedule
                </Link>
                <Link href="/station" className="text-amber-700 hover:text-amber-800 font-medium transition-colors">
                  Station
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Loading state */}
        {!data && !error && (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-4 border-amber-300 border-t-amber-700 rounded-full animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && !data && (
          <div className="max-w-2xl mx-auto px-4 py-32 text-center">
            <p className="text-gray-500 text-lg mb-4">
              Unable to load what&apos;s playing right now.
            </p>
            <button
              onClick={fetchData}
              className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Hero — Now Playing */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Artwork */}
                <div className="relative">
                  {data.nowPlaying?.artworkUrl ? (
                    <Image
                      src={data.nowPlaying.artworkUrl}
                      alt={`${data.nowPlaying.title} artwork`}
                      width={288}
                      height={288}
                      className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-2xl shadow-2xl object-cover"
                      priority
                    />
                  ) : (
                    <ArtworkPlaceholder size="lg" />
                  )}
                  {/* Pulsing ring */}
                  <div className="absolute -inset-2 rounded-2xl border-2 border-amber-400/30 animate-pulse pointer-events-none" />
                </div>

                {/* Track Info */}
                <div className="text-center md:text-left flex-1">
                  <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
                    </span>
                    Now Playing
                    <EqualizerBars />
                  </div>

                  {data.nowPlaying ? (
                    <>
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                        {data.nowPlaying.title}
                      </h1>
                      <p className="text-xl sm:text-2xl text-gray-600 dark:text-zinc-400 mb-6">
                        {data.nowPlaying.artistName}
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">
                        Music
                      </h1>
                      <p className="text-xl text-gray-600 dark:text-zinc-400 mb-6">
                        {data.stationName}
                      </p>
                    </>
                  )}

                  {/* Current Show Info */}
                  {data.currentShow && (
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 inline-block shadow-sm">
                      <div className="flex items-center gap-2 text-amber-800 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {formatHour(data.currentShow.shiftStart)} &ndash;{" "}
                          {formatHour(data.currentShow.shiftEnd)}
                        </span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {data.currentShow.showName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-zinc-400">
                        with {data.currentShow.djName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Recently Played + Up Next grid */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Recently Played */}
                <div>
                  <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-700" />
                    Recently Played
                  </h2>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-white/80 shadow-sm divide-y divide-gray-100">
                    {data.recentlyPlayed.length > 0 ? (
                      data.recentlyPlayed.map((track, i) => (
                        <TrackRow key={track.id || i} track={track} />
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-8">
                        No recent tracks yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Up Next */}
                <div>
                  <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Music className="w-5 h-5 text-amber-700" />
                    Up Next
                  </h2>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-white/80 shadow-sm divide-y divide-gray-100">
                    {data.upNext.length > 0 ? (
                      data.upNext.map((track, i) => (
                        <TrackRow key={i} track={track} showTime={false} />
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-8">
                        Upcoming tracks will appear here.
                      </p>
                    )}
                  </div>

                  {/* Link to full schedule */}
                  <Link
                    href="/schedule"
                    className="mt-4 inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-medium transition-colors"
                  >
                    <CalendarDays className="w-4 h-4" />
                    View Full Schedule
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </section>

            {/* Auto-refresh indicator */}
            <div className="text-center pb-8">
              <p className="text-xs text-gray-400">
                Updates every 30 seconds
              </p>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-4">
              <span className="text-2xl font-serif font-bold text-white">
                {data?.stationName || "TrueFans RADIO"}
              </span>
            </div>
            <p className="text-sm">
              Part of the{" "}
              <Link
                href="/network"
                className="text-amber-400 hover:text-amber-300"
              >
                TrueFans RADIO Network
              </Link>
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
