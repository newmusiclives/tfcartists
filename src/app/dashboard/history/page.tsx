"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Clock,
  Music,
  Users,
  Heart,
  Star,
  Loader2,
  RefreshCw,
  Headphones,
  TrendingUp,
} from "lucide-react";

interface HistoryData {
  listener: any;
  stats: {
    totalListenTime: number;
    totalSessions: number;
    favoriteArtist: string | null;
    favoriteDJ: string | null;
  };
  recentTracks: Array<{
    id: string;
    trackTitle: string;
    artistName: string;
    playedAt: string;
    dj: { name: string; slug: string } | null;
    duration: number | null;
  }>;
  topArtists: Array<{ artistName: string; playCount: number }>;
  topDJs: Array<{ djName: string; djSlug: string; playCount: number }>;
}

export default function ListenerHistoryPage() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("tfr_favorite_artists");
        return new Set(stored ? JSON.parse(stored) : []);
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get listenerId from localStorage or use a demo one
      const listenerId =
        typeof window !== "undefined"
          ? localStorage.getItem("tfr_listener_id") || ""
          : "";

      if (!listenerId) {
        // Try first listener for demo
        const listRes = await fetch("/api/listeners?limit=1");
        if (listRes.ok) {
          const listData = await listRes.json();
          const firstListener = (listData.listeners || listData)?.[0];
          if (firstListener?.id) {
            const res = await fetch(
              `/api/listeners/history?listenerId=${firstListener.id}`
            );
            if (res.ok) setData(await res.json());
          }
        }
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/listeners/history?listenerId=${listenerId}`);
      if (res.ok) setData(await res.json());
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleFavorite = (artistName: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(artistName)) {
        next.delete(artistName);
      } else {
        next.add(artistName);
      }
      localStorage.setItem("tfr_favorite_artists", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Headphones className="w-6 h-6 text-purple-400" />
              Listening History
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Your stats, favorites, and recent plays
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : !data ? (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 text-center">
            <Headphones className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No listening history available yet.</p>
            <p className="text-zinc-500 text-sm mt-1">
              Start listening to build your history!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  Listen Time
                </div>
                <div className="text-2xl font-bold">
                  {formatMinutes(data.stats.totalListenTime)}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Sessions
                </div>
                <div className="text-2xl font-bold">{data.stats.totalSessions}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Top Artist
                </div>
                <div className="text-lg font-bold truncate">
                  {data.stats.favoriteArtist || "—"}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                  <Users className="w-4 h-4 text-blue-400" />
                  Fav DJ
                </div>
                <div className="text-lg font-bold truncate">
                  {data.stats.favoriteDJ || "—"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Tracks */}
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800">
                  <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Recent Tracks
                  </h2>
                </div>
                <div className="divide-y divide-zinc-800">
                  {data.recentTracks.length === 0 ? (
                    <div className="px-6 py-8 text-center text-zinc-500 text-sm">
                      No tracks played yet.
                    </div>
                  ) : (
                    data.recentTracks.map((track) => (
                      <div
                        key={track.id}
                        className="px-6 py-3 flex items-center justify-between hover:bg-zinc-800/30"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-200 truncate">
                            {track.trackTitle}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {track.artistName}
                            {track.dj && ` — via ${track.dj.name}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button
                            onClick={() => toggleFavorite(track.artistName)}
                            className={`p-1 rounded ${
                              favorites.has(track.artistName)
                                ? "text-red-400"
                                : "text-zinc-600 hover:text-zinc-400"
                            }`}
                          >
                            <Heart
                              className="w-4 h-4"
                              fill={favorites.has(track.artistName) ? "currentColor" : "none"}
                            />
                          </button>
                          <span className="text-xs text-zinc-600">
                            {new Date(track.playedAt).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sidebar: Top Artists & DJs */}
              <div className="space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-800">
                    <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      Top Artists
                    </h2>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {data.topArtists.map((a, i) => (
                      <div
                        key={a.artistName}
                        className="px-5 py-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-zinc-600 w-5">
                            {i + 1}
                          </span>
                          <span className="text-sm text-zinc-200">{a.artistName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">{a.playCount} plays</span>
                          <button
                            onClick={() => toggleFavorite(a.artistName)}
                            className={`p-1 rounded ${
                              favorites.has(a.artistName)
                                ? "text-red-400"
                                : "text-zinc-600 hover:text-zinc-400"
                            }`}
                          >
                            <Heart
                              className="w-3.5 h-3.5"
                              fill={favorites.has(a.artistName) ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-800">
                    <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      Top DJs
                    </h2>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {data.topDJs.map((d, i) => (
                      <div
                        key={d.djSlug || i}
                        className="px-5 py-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-zinc-600 w-5">
                            {i + 1}
                          </span>
                          <span className="text-sm text-zinc-200">{d.djName}</span>
                        </div>
                        <span className="text-xs text-zinc-500">{d.playCount} plays</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
