"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  Share2,
  Heart,
  Headphones,
  Music,
  Send,
  X,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL || "/stream/americana-hq.mp3";
const POLL_INTERVAL = 10_000;

interface StationData {
  id: string;
  name: string;
  slug: string;
  genre: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  artistName: string;
  artistBio: string | null;
  artistImageUrl: string | null;
  streamUrl: string | null;
  isActive: boolean;
}

interface NowPlaying {
  title: string;
  artist_name: string;
  artwork_url: string | null;
  listener_count: number;
}

interface SimilarArtist {
  name: string;
  genre: string | null;
  imageUrl: string | null;
}

interface SongRequestItem {
  id: string;
  songTitle: string;
  artistName: string;
  listenerName: string | null;
  status: string;
  createdAt: string;
}

export default function ArtistStationPlayerPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [station, setStation] = useState<StationData | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [similarArtists, setSimilarArtists] = useState<SimilarArtist[]>([]);
  const [recentRequests, setRecentRequests] = useState<SongRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error" | "reconnecting">("idle");
  const [liked, setLiked] = useState(false);

  // Request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSongTitle, setRequestSongTitle] = useState("");
  const [requestArtistName, setRequestArtistName] = useState("");
  const [requestListenerName, setRequestListenerName] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Show sections
  const [showSimilar, setShowSimilar] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const userStoppedRef = useRef(false);

  // Fetch station data
  useEffect(() => {
    async function fetchStation() {
      try {
        const res = await fetch(`/api/artist-station?slug=${slug}`);
        if (!res.ok) {
          setError("Station not found");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.stations && data.stations.length > 0) {
          setStation(data.stations[0]);
          // Fetch similar artists and requests
          fetchSimilarArtists(data.stations[0].id);
          fetchRecentRequests(data.stations[0].id);
        } else {
          setError("Station not found");
        }
      } catch {
        setError("Failed to load station");
      }
      setLoading(false);
    }
    fetchStation();
  }, [slug]);

  async function fetchSimilarArtists(stationId: string) {
    try {
      const res = await fetch(`/api/station-songs?stationId=${stationId}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        // Extract unique artist names from station songs
        const artistMap = new Map<string, SimilarArtist>();
        const songs = data.songs || data.data || [];
        for (const song of songs) {
          if (song.artistName && !artistMap.has(song.artistName)) {
            artistMap.set(song.artistName, {
              name: song.artistName,
              genre: song.genre || null,
              imageUrl: song.artworkUrl || null,
            });
          }
        }
        setSimilarArtists(Array.from(artistMap.values()).slice(0, 8));
      }
    } catch {
      // Non-critical
    }
  }

  async function fetchRecentRequests(stationId: string) {
    try {
      const res = await fetch(`/api/artist-station/${slug}/request`);
      if (res.ok) {
        const data = await res.json();
        setRecentRequests(data.requests || []);
      }
    } catch {
      // Non-critical
    }
  }

  // Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch("/api/now-playing", { cache: "no-store" });
      if (res.ok) {
        const data: NowPlaying = await res.json();
        setNowPlaying(data);
        if ("mediaSession" in navigator && data.title) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: data.title,
            artist: data.artist_name,
            album: station?.name || "Artist Station",
            ...(data.artwork_url
              ? { artwork: [{ src: data.artwork_url, sizes: "512x512", type: "image/jpeg" }] }
              : {}),
          });
        }
      }
    } catch {
      // Non-critical
    }
  }, [station?.name]);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    fetchNowPlaying();
    pollRef.current = setInterval(fetchNowPlaying, POLL_INTERVAL);
  }, [fetchNowPlaying]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, []);

  const clearReconnect = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
  }, []);

  const reconnectStream = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || userStoppedRef.current) return;
    const attempt = reconnectAttemptRef.current;
    const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
    reconnectAttemptRef.current = attempt + 1;
    setStatus("reconnecting");
    reconnectRef.current = setTimeout(() => {
      if (userStoppedRef.current) return;
      const streamSrc = station?.streamUrl || STREAM_URL;
      audio.src = `${streamSrc}?_t=${Date.now()}`;
      audio.play().catch(() => {});
    }, delay);
  }, [station?.streamUrl]);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    userStoppedRef.current = false;
    reconnectAttemptRef.current = 0;
    clearReconnect();
    setStatus("loading");
    fetchNowPlaying();
    const streamSrc = station?.streamUrl || STREAM_URL;
    audio.src = `${streamSrc}?_t=${Date.now()}`;
    audio.play().catch(() => reconnectStream());
  }, [fetchNowPlaying, clearReconnect, reconnectStream, station?.streamUrl]);

  const handlePause = useCallback(() => {
    const audio = audioRef.current;
    userStoppedRef.current = true;
    clearReconnect();
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setIsPlaying(false);
    setStatus("idle");
    stopPolling();
  }, [stopPolling, clearReconnect]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying || status === "loading") {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, status, handlePlay, handlePause]);

  const onPlaying = useCallback(() => {
    setIsPlaying(true);
    setStatus("playing");
    reconnectAttemptRef.current = 0;
    clearReconnect();
    startPolling();
  }, [startPolling, clearReconnect]);

  const onError = useCallback(() => {
    if (userStoppedRef.current) return;
    setIsPlaying(false);
    reconnectStream();
  }, [reconnectStream]);

  const onEnded = useCallback(() => {
    if (userStoppedRef.current) return;
    setIsPlaying(false);
    reconnectStream();
  }, [reconnectStream]);

  // Share
  const handleShare = useCallback(async () => {
    const shareData = {
      title: station?.name || "Artist Station",
      text: nowPlaying
        ? `Listening to "${nowPlaying.title}" by ${nowPlaying.artist_name} on ${station?.name}`
        : `Listen to ${station?.name}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
      }
    } catch {
      // User cancelled
    }
  }, [nowPlaying, station?.name]);

  // Submit request
  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!station || !requestSongTitle.trim()) return;

    setRequestSubmitting(true);
    try {
      const res = await fetch(`/api/artist-station/${slug}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songTitle: requestSongTitle.trim(),
          artistName: requestArtistName.trim() || station.artistName,
          listenerName: requestListenerName.trim() || undefined,
          message: requestMessage.trim() || undefined,
        }),
      });

      if (res.ok) {
        setRequestSuccess(true);
        setRequestSongTitle("");
        setRequestArtistName("");
        setRequestMessage("");
        // Refresh requests
        fetchRecentRequests(station.id);
        setTimeout(() => {
          setRequestSuccess(false);
          setShowRequestModal(false);
        }, 2000);
      }
    } catch {
      // Failed
    }
    setRequestSubmitting(false);
  }

  // Dynamic colors
  const primary = station?.primaryColor || "#7c3aed";
  const secondary = station?.secondaryColor || "#a78bfa";

  const showActive = status === "playing";
  const showLoading = status === "loading" || status === "reconnecting";

  // Background styling
  useEffect(() => {
    document.documentElement.style.background = "#0f0a1e";
    document.body.style.background = "#0f0a1e";
    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#0f0a1e] via-[#1a1030] to-[#0f0a1e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-400/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-violet-300/60 text-sm">Loading station...</p>
        </div>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#0f0a1e] via-[#1a1030] to-[#0f0a1e] flex items-center justify-center">
        <div className="text-center px-6">
          <Music className="w-16 h-16 text-violet-400/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Station Not Found</h1>
          <p className="text-violet-300/60 mb-6">{error || "This artist station does not exist."}</p>
          <Link
            href="/artist-station"
            className="inline-flex items-center space-x-2 bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
          >
            <Music className="w-4 h-4" />
            <span>Browse Artist Stations</span>
          </Link>
        </div>
      </div>
    );
  }

  const trackTitle = nowPlaying?.title || station.name;
  const trackArtist = nowPlaying?.artist_name || station.artistName;
  const artworkUrl = nowPlaying?.artwork_url || station.artistImageUrl;
  const listenerCount = nowPlaying?.listener_count;

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-[#0f0a1e] via-[#1a1030] to-[#0f0a1e] text-white select-none overflow-y-auto">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        onPlaying={onPlaying}
        onError={onError}
        onEnded={onEnded}
        preload="none"
      />

      <div className="min-h-[100dvh] flex flex-col px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Station Header */}
        <div className="flex items-center justify-between pt-6 pb-2 flex-shrink-0">
          <Link href="/artist-station" className="text-violet-300/60 hover:text-violet-300 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            {station.logoUrl && (
              <Image src={station.logoUrl} alt={station.name} width={24} height={24} className="h-6 w-6 object-contain rounded-full" />
            )}
            <h1 className="text-sm font-bold tracking-wide text-violet-100 whitespace-nowrap">
              {station.name}
            </h1>
          </div>
          <button
            onClick={handleShare}
            className="text-violet-300/60 hover:text-violet-300 transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Status badge */}
        <div className="flex justify-center mb-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              showActive
                ? "bg-green-500/20 text-green-400"
                : showLoading
                  ? "bg-violet-500/20 text-violet-400"
                  : "bg-white/10 text-violet-300/60"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                showActive
                  ? "bg-green-400 animate-pulse"
                  : showLoading
                    ? "bg-violet-400 animate-pulse"
                    : "bg-violet-300/40"
              }`}
            />
            {showActive ? "LIVE" : status === "reconnecting" ? "RECONNECTING" : showLoading ? "CONNECTING" : "LISTEN"}
          </div>
        </div>

        {/* Listener count */}
        {showActive && listenerCount !== undefined && listenerCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-violet-300/50 mb-2 flex-shrink-0">
            <Headphones className="w-3 h-3" />
            <span>{listenerCount} listening</span>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4 min-h-0">
          {/* Album Artwork */}
          <div
            className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
            style={{ boxShadow: `0 25px 50px -12px ${primary}33` }}
          >
            {artworkUrl && (showActive || showLoading) ? (
              <Image
                src={artworkUrl}
                alt={trackTitle}
                fill
                className="object-cover"
                unoptimized
              />
            ) : station.artistImageUrl ? (
              <Image
                src={station.artistImageUrl}
                alt={station.artistName}
                fill
                className="object-cover opacity-60"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-800/30 to-purple-900/30 p-8">
                <Music className="w-20 h-20 text-violet-400/30" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="text-center w-full max-w-xs flex-shrink-0">
            <p className="text-lg font-bold text-white truncate">
              {showLoading ? "Connecting..." : trackTitle}
            </p>
            <p className="text-sm text-violet-300/70 mt-0.5 truncate">
              {showLoading ? "Buffering stream..." : trackArtist}
            </p>
          </div>

          {/* Equalizer */}
          <div className="flex items-end justify-center gap-1 h-5 flex-shrink-0">
            {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
              <div
                key={bar}
                className={`w-1 rounded-full ${
                  showActive ? "bg-violet-400 animate-equalizer" : "bg-violet-700/40 h-1"
                }`}
                style={
                  showActive
                    ? {
                        animationDelay: `${bar * 0.12}s`,
                        animationDuration: `${0.4 + bar * 0.08}s`,
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-3 pb-4 flex-shrink-0">
          {/* Action Buttons Row */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setLiked(!liked)}
              className={`transition-colors ${liked ? "text-red-400" : "text-violet-400/40 hover:text-violet-400"}`}
              aria-label={liked ? "Unlike" : "Like"}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
              style={{
                background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                boxShadow: `0 8px 24px ${primary}44`,
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying || showLoading ? (
                <Pause className="w-7 h-7 text-white" />
              ) : (
                <Play className="w-7 h-7 text-white ml-0.5" />
              )}
            </button>

            {/* Request Button */}
            <button
              onClick={() => setShowRequestModal(true)}
              className="text-violet-400/40 hover:text-violet-400 transition-colors"
              aria-label="Request a Song"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            <button
              onClick={() => setVolume((v) => (v > 0 ? 0 : 75))}
              className="text-violet-400 hover:text-violet-300 transition-colors"
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 h-1.5 accent-violet-400 bg-violet-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400"
              aria-label="Volume"
            />
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-3 text-[11px] text-violet-300/40">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-violet-300 transition-colors px-3 py-1 rounded-full border border-violet-400/15 hover:border-violet-400/40"
            >
              <Share2 className="w-3 h-3" />
              Share Station
            </button>
          </div>

          {/* Similar Artists Toggle */}
          <button
            onClick={() => setShowSimilar(!showSimilar)}
            className="flex items-center gap-1 text-[11px] text-violet-300/40 hover:text-violet-300 transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showSimilar ? "rotate-180" : ""}`} />
            {showSimilar ? "Hide" : "Show"} Similar Artists
          </button>
        </div>

        {/* Similar Artists Section */}
        {showSimilar && similarArtists.length > 0 && (
          <div className="pb-8 flex-shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-violet-300/50 mb-4 text-center">
              Also Playing on This Station
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              {similarArtists.map((artist) => (
                <div
                  key={artist.name}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-violet-800/30 flex-shrink-0">
                    {artist.imageUrl ? (
                      <Image
                        src={artist.imageUrl}
                        alt={artist.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-violet-400/30" />
                      </div>
                    )}
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <p className="text-xs font-medium text-white truncate">{artist.name}</p>
                    {artist.genre && (
                      <p className="text-[10px] text-violet-300/40 truncate">{artist.genre}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Requests */}
        {recentRequests.length > 0 && (
          <div className="pb-8 flex-shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-violet-300/50 mb-3 text-center">
              Recent Requests
            </h3>
            <div className="space-y-2 max-w-sm mx-auto">
              {recentRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
                  <Music className="w-4 h-4 text-violet-400/40 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{req.songTitle}</p>
                    <p className="text-[10px] text-violet-300/40 truncate">
                      {req.artistName}
                      {req.listenerName && ` — requested by ${req.listenerName}`}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      req.status === "played"
                        ? "bg-green-500/20 text-green-400"
                        : req.status === "queued"
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-white/10 text-violet-300/50"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Song Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1a1030] rounded-2xl border border-violet-500/20 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-violet-500/10">
              <h2 className="text-lg font-bold text-white">Request a Song</h2>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestSuccess(false);
                }}
                className="text-violet-300/40 hover:text-violet-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestSuccess ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-lg font-bold text-white mb-1">Request Submitted!</p>
                <p className="text-sm text-violet-300/60">We will try to play it soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-violet-300/60 uppercase tracking-wider">
                    Song Title *
                  </label>
                  <input
                    type="text"
                    value={requestSongTitle}
                    onChange={(e) => setRequestSongTitle(e.target.value)}
                    placeholder="Enter song title"
                    required
                    className="mt-1 w-full bg-white/5 border border-violet-500/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder-violet-300/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-violet-300/60 uppercase tracking-wider">
                    Artist Name
                  </label>
                  <input
                    type="text"
                    value={requestArtistName}
                    onChange={(e) => setRequestArtistName(e.target.value)}
                    placeholder={station.artistName}
                    className="mt-1 w-full bg-white/5 border border-violet-500/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder-violet-300/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-violet-300/60 uppercase tracking-wider">
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    value={requestListenerName}
                    onChange={(e) => setRequestListenerName(e.target.value)}
                    placeholder="Your name"
                    className="mt-1 w-full bg-white/5 border border-violet-500/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder-violet-300/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-violet-300/60 uppercase tracking-wider">
                    Dedication Message (optional)
                  </label>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Add a message..."
                    rows={2}
                    className="mt-1 w-full bg-white/5 border border-violet-500/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder-violet-300/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={requestSubmitting || !requestSongTitle.trim()}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-colors disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                  }}
                >
                  {requestSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
