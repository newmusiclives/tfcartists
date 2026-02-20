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

const STREAM_URL = "https://tfc-radio.netlify.app/stream/americana-hq.mp3";
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
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [liked, setLiked] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    };
  }, []);

  // Setup Media Session API handlers
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => handlePlay());
      navigator.mediaSession.setActionHandler("pause", () => handlePause());
    }
  }, []);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setStatus("loading");
    fetchNowPlaying();
    audio.src = `${STREAM_URL}?_t=${Date.now()}`;
    audio.play().catch(() => {
      setStatus("error");
    });
  }, [fetchNowPlaying]);

  const handlePause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setIsPlaying(false);
    setStatus("idle");
    stopPolling();
  }, [stopPolling]);

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
    startPolling();
  }, [startPolling]);

  const onError = useCallback(() => {
    setStatus("error");
    setIsPlaying(false);
  }, []);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
    setStatus("idle");
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
  const showLoading = status === "loading";
  const showError = status === "error";

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-b from-amber-950 via-amber-900 to-orange-950 text-white select-none">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        onPlaying={onPlaying}
        onError={onError}
        onEnded={onEnded}
      />

      <div className="min-h-[100dvh] flex flex-col px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Station Branding */}
        <div className="flex items-center justify-center gap-2.5 pt-6 pb-2 flex-shrink-0">
          <Image src="/logos/ncr-logo.png" alt="NCR" width={32} height={32} className="h-8 w-auto object-contain" />
          <h1 className="text-base font-bold tracking-wide text-amber-100">
            {currentStation.name}
          </h1>
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              showActive
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : showLoading
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                showActive
                  ? "bg-green-400 animate-pulse"
                  : showLoading
                    ? "bg-blue-400 animate-pulse"
                    : "bg-gray-500"
              }`}
            />
            {showActive ? "ON AIR" : showLoading ? "LOADING" : "OFFLINE"}
          </div>
        </div>

        {/* Listener count */}
        {showActive && listenerCount !== undefined && listenerCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300/60 flex-shrink-0">
            <Headphones className="w-3 h-3" />
            <span>{listenerCount} listening</span>
          </div>
        )}

        {/* Main Content — fills available space, centers children */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4 min-h-0">
          {/* Album Artwork — scales with available space, max 256px */}
          <div className="relative w-full max-w-[16rem] aspect-square flex-shrink rounded-2xl overflow-hidden shadow-2xl shadow-black/50 bg-amber-800/50">
            {artworkUrl && (showActive || showLoading) ? (
              <Image
                src={artworkUrl}
                alt={trackTitle}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-6">
                <Image src="/logos/ncr-logo.png" alt="North Country Radio" width={192} height={192} className="w-full h-full object-contain opacity-50" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="text-center w-full max-w-sm flex-shrink-0">
            <p className="text-lg font-bold text-white truncate">
              {showError
                ? "Stream Unavailable"
                : showLoading
                  ? "Connecting..."
                  : trackTitle}
            </p>
            <p className="text-sm text-amber-300/80 mt-0.5 truncate">
              {showError
                ? "Tap play to retry"
                : showLoading
                  ? "Buffering stream..."
                  : trackArtist}
            </p>
          </div>

          {/* DJ name */}
          {showActive && djName && (
            <p className="text-xs text-amber-300/70 flex-shrink-0">DJ {djName}</p>
          )}

          {/* Equalizer */}
          <div className="flex items-end justify-center gap-1 h-6 flex-shrink-0">
            {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
              <div
                key={bar}
                className={`w-1 rounded-full ${
                  showActive
                    ? "bg-green-400 animate-equalizer"
                    : "bg-amber-700/50 h-1"
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
        <div className="flex flex-col items-center gap-4 pb-4 flex-shrink-0">
          {/* Action Buttons Row */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setLiked(!liked)}
              className={`transition-colors ${liked ? "text-red-400" : "text-amber-400/50 hover:text-amber-400"}`}
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
              className="text-amber-400/50 hover:text-amber-400 transition-colors"
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
          <div className="flex items-center gap-3 text-xs">
            {sleepTimer ? (
              <button
                onClick={cancelSleepTimer}
                className="text-amber-400 hover:text-amber-300 px-3 py-1 rounded-full border border-amber-400/30"
              >
                Sleep timer: {sleepTimer}min (cancel)
              </button>
            ) : (
              <div className="flex items-center gap-2 text-amber-400/40">
                <span>Sleep:</span>
                {[15, 30, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => startSleepTimer(m)}
                    className="hover:text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/20 hover:border-amber-400/40 transition-colors"
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
            className="flex items-center gap-1.5 text-xs text-amber-400/60 hover:text-amber-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open Full Site
          </Link>
        </div>
      </div>
    </div>
  );
}
