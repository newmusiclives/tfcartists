"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Share2,
  Heart,
  SkipForward,
  Headphones,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useStation } from "@/contexts/StationContext";

const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL || "/stream/americana-hq.mp3";
const NOW_PLAYING_URL = "/api/now-playing";
const POLL_INTERVAL = 10_000;

interface NowPlaying {
  title: string;
  artist_name: string;
  artwork_url: string;
  listener_count: number;
  dj_name: string;
}

export default function PlayerPage() {
  const { currentStation } = useStation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error" | "reconnecting">("idle");
  const [liked, setLiked] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const userStoppedRef = useRef(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch(NOW_PLAYING_URL, { cache: "no-store" });
      if (res.ok) {
        const data: NowPlaying = await res.json();
        setNowPlaying(data);

        // Update media session metadata
        if ("mediaSession" in navigator && data.title) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: data.title,
            artist: data.artist_name,
            album: currentStation.name,
            ...(data.artwork_url
              ? { artwork: [{ src: data.artwork_url, sizes: "512x512", type: "image/jpeg" }] }
              : {}),
          });
        }
      }
    } catch {
      // Non-critical
    }
  }, [currentStation.name]);

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
      if (sleepRef.current) clearTimeout(sleepRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, []);

  // Setup Media Session API handlers
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => handlePlay());
      navigator.mediaSession.setActionHandler("pause", () => handlePause());
    }
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
    // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
    reconnectAttemptRef.current = attempt + 1;

    setStatus("reconnecting");
    reconnectRef.current = setTimeout(() => {
      if (userStoppedRef.current) return;
      audio.src = `${STREAM_URL}?_t=${Date.now()}`;
      audio.play().catch(() => {
        // Will trigger onError → reconnect again
      });
    }, delay);
  }, []);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    userStoppedRef.current = false;
    reconnectAttemptRef.current = 0;
    clearReconnect();
    setStatus("loading");
    fetchNowPlaying();
    audio.src = `${STREAM_URL}?_t=${Date.now()}`;
    audio.play().catch(() => {
      reconnectStream();
    });
  }, [fetchNowPlaying, clearReconnect, reconnectStream]);

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

  const onStalled = useCallback(() => {
    // Stream stalled (no data for a while) — common on mobile networks
    if (userStoppedRef.current) return;
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      // Give it a few seconds, then force reconnect
      reconnectRef.current = setTimeout(() => {
        if (userStoppedRef.current || !audioRef.current) return;
        if (audioRef.current.paused) return;
        // Still stalled — reconnect
        reconnectAttemptRef.current = 0;
        audioRef.current.src = `${STREAM_URL}?_t=${Date.now()}`;
        audioRef.current.play().catch(() => {});
      }, 8000);
    }
  }, []);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: nowPlaying?.title || currentStation.name,
      text: nowPlaying
        ? `Listening to "${nowPlaying.title}" by ${nowPlaying.artist_name} on ${currentStation.name}`
        : `Listen to ${currentStation.name}`,
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
      }
    } catch {
      // User cancelled or not supported
    }
  }, [nowPlaying, currentStation.name]);

  const startSleepTimer = useCallback((minutes: number) => {
    if (sleepRef.current) clearTimeout(sleepRef.current);
    setSleepTimer(minutes);
    sleepRef.current = setTimeout(() => {
      handlePause();
      setSleepTimer(null);
    }, minutes * 60_000);
  }, [handlePause]);

  const cancelSleepTimer = useCallback(() => {
    if (sleepRef.current) clearTimeout(sleepRef.current);
    setSleepTimer(null);
  }, []);

  const trackTitle = nowPlaying?.title || currentStation.name;
  const trackArtist = nowPlaying?.artist_name || "Americana & Country";
  const djName = nowPlaying?.dj_name;
  const listenerCount = nowPlaying?.listener_count;
  const artworkUrl = nowPlaying?.artwork_url;

  const showActive = status === "playing";
  const showLoading = status === "loading" || status === "reconnecting";
  const showError = status === "error";

  // Set body background dark to prevent white flash on mobile
  useEffect(() => {
    document.documentElement.style.background = '#451a03';
    document.body.style.background = '#451a03';
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-amber-950 via-amber-900 to-orange-950 text-white select-none overflow-hidden">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        onPlaying={onPlaying}
        onError={onError}
        onEnded={onEnded}
        onStalled={onStalled}
        preload="none"
      />

      <div className="h-[100dvh] flex flex-col px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Station Branding — centered, single line */}
        <div className="flex flex-col items-center pt-6 pb-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Image src="/logos/ncr-logo.png" alt="NCR" width={24} height={24} className="h-6 w-6 object-contain" />
            <h1 className="text-sm font-bold tracking-wide text-amber-100 whitespace-nowrap">
              North Country Radio
            </h1>
          </div>
          {/* Status badge */}
          <div
            className={`mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              showActive
                ? "bg-green-500/20 text-green-400"
                : showError
                  ? "bg-red-500/20 text-red-400"
                  : showLoading
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-white/10 text-amber-300/60"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                showActive
                  ? "bg-green-400 animate-pulse"
                  : showError
                    ? "bg-red-400"
                    : showLoading
                      ? "bg-amber-400 animate-pulse"
                      : "bg-amber-300/40"
              }`}
            />
            {showActive ? "LIVE" : showError ? "OFFLINE" : status === "reconnecting" ? "RECONNECTING" : showLoading ? "CONNECTING" : "LISTEN LIVE"}
          </div>
        </div>

        {/* Listener count */}
        {showActive && listenerCount !== undefined && listenerCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-300/50 mt-1 flex-shrink-0">
            <Headphones className="w-3 h-3" />
            <span>{listenerCount} listening</span>
          </div>
        )}

        {/* Main Content — fills available space, centers children */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-3 min-h-0">
          {/* Album Artwork — smaller on mobile */}
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 bg-amber-800/30">
            {artworkUrl && (showActive || showLoading) ? (
              <Image
                src={artworkUrl}
                alt={trackTitle}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8">
                <Image src="/logos/ncr-logo.png" alt="North Country Radio" width={120} height={120} className="w-full h-full object-contain opacity-40" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="text-center w-full max-w-xs flex-shrink-0">
            <p className="text-base font-bold text-white truncate">
              {showError
                ? "Stream Unavailable"
                : showLoading
                  ? "Connecting..."
                  : trackTitle}
            </p>
            <p className="text-sm text-amber-300/70 mt-0.5 truncate">
              {showError
                ? "Tap play to retry"
                : showLoading
                  ? "Buffering stream..."
                  : trackArtist}
            </p>
          </div>

          {/* DJ name */}
          {showActive && djName && (
            <p className="text-[11px] text-amber-300/60 flex-shrink-0">with {djName}</p>
          )}

          {/* Equalizer */}
          <div className="flex items-end justify-center gap-1 h-5 flex-shrink-0">
            {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
              <div
                key={bar}
                className={`w-1 rounded-full ${
                  showActive
                    ? "bg-green-400 animate-equalizer"
                    : "bg-amber-700/40 h-1"
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

        {/* Controls — pinned to bottom */}
        <div className="flex flex-col items-center gap-3 pb-4 flex-shrink-0">
          {/* Action Buttons Row */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setLiked(!liked)}
              className={`transition-colors ${liked ? "text-red-400" : "text-amber-400/40 hover:text-amber-400"}`}
              aria-label={liked ? "Unlike" : "Like"}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-amber-900/50"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying || showLoading ? (
                <Pause className="w-7 h-7 text-amber-950" />
              ) : (
                <Play className="w-7 h-7 text-amber-950 ml-0.5" />
              )}
            </button>

            <button
              onClick={handleShare}
              className="text-amber-400/40 hover:text-amber-400 transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            <button
              onClick={() => setVolume((v) => (v > 0 ? 0 : 75))}
              className="text-amber-400 hover:text-amber-300 transition-colors"
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 h-1.5 accent-amber-400 bg-amber-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
              aria-label="Volume"
            />
          </div>

          {/* Sleep Timer */}
          <div className="flex items-center gap-2 text-[11px]">
            {sleepTimer ? (
              <button
                onClick={cancelSleepTimer}
                className="text-amber-400 hover:text-amber-300 px-3 py-1 rounded-full border border-amber-400/30"
              >
                Sleep: {sleepTimer}min (cancel)
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400/35">
                <span>Sleep:</span>
                {[15, 30, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => startSleepTimer(m)}
                    className="hover:text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/15 hover:border-amber-400/40 transition-colors"
                  >
                    {m}m
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Open Full Site Link */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[11px] text-amber-400/40 hover:text-amber-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open Full Site
          </Link>
        </div>
      </div>
    </div>
  );
}
