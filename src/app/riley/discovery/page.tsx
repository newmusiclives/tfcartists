"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Music,
  Users,
  ExternalLink,
  Play,
  Pause,
  Download,
  Loader2,
  Sparkles,
} from "lucide-react";

interface SpotifyArtist {
  id: string;
  name: string;
  followers: number;
  genres: string[];
  imageUrl: string | null;
  spotifyUrl: string | null;
  popularity: number;
}

const GENRE_OPTIONS = [
  "americana",
  "alt-country",
  "folk",
  "singer-songwriter",
  "roots-rock",
  "outlaw-country",
  "texas-country",
  "red-dirt",
  "bluegrass",
  "country",
  "indie folk",
  "indie rock",
];

export default function RileyDiscoveryPage() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const search = async (offset = 0) => {
    if (!query && !genre) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "20", offset: String(offset) });
      if (query) params.set("q", query);
      if (genre) params.set("genre", genre);

      const res = await fetch(`/api/discovery/spotify/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");

      if (offset === 0) {
        setArtists(data.artists);
      } else {
        setArtists((prev) => [...prev, ...data.artists]);
      }
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const importArtist = async (artist: SpotifyArtist) => {
    setImporting(artist.id);
    try {
      const res = await fetch("/api/discovery/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "spotify",
          keywords: [artist.name],
          limit: 1,
        }),
      });
      if (res.ok) {
        setImported((prev) => new Set(prev).add(artist.id));
      }
    } catch {
      // Silently fail
    } finally {
      setImporting(null);
    }
  };

  const togglePreview = (url: string) => {
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setPlayingUrl(null);
      audioRef.current = audio;
      setPlayingUrl(url);
    }
  };

  const formatFollowers = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/riley"
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-green-600" />
              Artist Discovery
            </h1>
            <p className="text-gray-500 text-sm">
              Search Spotify for indie artists to add to the pipeline
            </p>
          </div>
        </div>

        {/* Search Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="Search by artist name..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="border rounded-lg px-3 py-2.5 text-sm bg-white min-w-[180px]"
            >
              <option value="">All Genres</option>
              {GENRE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </option>
              ))}
            </select>
            <button
              onClick={() => search()}
              disabled={loading || (!query && !genre)}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </button>
          </div>

          {/* Quick Genre Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {["americana", "alt-country", "folk", "singer-songwriter", "bluegrass", "outlaw-country"].map(
              (g) => (
                <button
                  key={g}
                  onClick={() => {
                    setGenre(g);
                    setQuery("");
                    setTimeout(() => search(), 0);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    genre === g
                      ? "bg-green-100 border-green-300 text-green-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {g
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </button>
              )
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {artists.length > 0 && (
          <>
            <div className="text-sm text-gray-500 mb-4">
              Showing {artists.length} of {total.toLocaleString()} results
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Artist Image */}
                    <div className="flex-shrink-0">
                      {artist.imageUrl ? (
                        <img
                          src={artist.imageUrl}
                          alt={artist.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <Music className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Artist Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {artist.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {formatFollowers(artist.followers)}
                            </span>
                            <span>Pop: {artist.popularity}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {artist.spotifyUrl && (
                            <a
                              href={artist.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-green-600"
                              title="Open in Spotify"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {imported.has(artist.id) ? (
                            <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded">
                              Added
                            </span>
                          ) : (
                            <button
                              onClick={() => importArtist(artist)}
                              disabled={importing === artist.id}
                              className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                              title="Import to pipeline"
                            >
                              {importing === artist.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Genre Tags */}
                      {artist.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {artist.genres.slice(0, 4).map((g) => (
                            <span
                              key={g}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                            >
                              {g}
                            </span>
                          ))}
                          {artist.genres.length > 4 && (
                            <span className="text-xs text-gray-400">
                              +{artist.genres.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Follower Tier Indicator */}
                      <div className="mt-2">
                        {artist.followers < 1000 ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            Emerging
                          </span>
                        ) : artist.followers < 10000 ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Rising
                          </span>
                        ) : artist.followers < 50000 ? (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                            Established Indie
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            Mainstream
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {artists.length < total && (
              <div className="text-center mb-8">
                <button
                  onClick={() => search(artists.length)}
                  disabled={loading}
                  className="bg-white border px-6 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && artists.length === 0 && !error && (
          <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
            <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Discover Indie Artists
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Search by artist name or select a genre to find emerging indie
              artists on Spotify. Import them to Riley&apos;s outreach pipeline
              with one click.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
