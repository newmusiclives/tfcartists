"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Radio } from "lucide-react";
import Image from "next/image";

const STREAM_URL = "/stream/americana-hq.mp3";
const NOW_PLAYING_URL =
  "https://tfc-radio-backend-production.up.railway.app/api/now_playing";
const POLL_INTERVAL = 10_000;

interface NowPlaying {
  title: string;
  artist_name: string;
  artwork_url: string;
  listener_count: number;
  dj_name: string;
}

export function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const audioRef = useRef<HTMLAudioElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync volume to audio element
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
      }
    } catch {
      // Non-critical
    }
  }, []);

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
    };
  }, []);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      setErrorMsg("No audio element");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    // Set src with cache-bust
    audio.src = `${STREAM_URL}?_t=${Date.now()}`;

    // Use play() — the "playing" event handler below will confirm success
    audio.play().catch((err: Error) => {
      setErrorMsg(`play(): ${err.name} - ${err.message}`);
      setStatus("error");
    });
  }, []);

  const handlePause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setIsPlaying(false);
    setStatus("idle");
    setErrorMsg("");
    stopPolling();
  }, [stopPolling]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying || status === "loading") {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, status, handlePlay, handlePause]);

  // Audio event: playback actually started
  const onPlaying = useCallback(() => {
    setIsPlaying(true);
    setStatus("playing");
    setErrorMsg("");
    startPolling();
  }, [startPolling]);

  // Audio event: error occurred
  const onError = useCallback(() => {
    const audio = audioRef.current;
    const mediaErr = audio?.error;
    const code = mediaErr?.code ?? "?";
    const msg = mediaErr?.message ?? "unknown";
    setErrorMsg(`MediaError ${code}: ${msg}`);
    setStatus("error");
    setIsPlaying(false);
  }, []);

  // Audio event: stream ended
  const onEnded = useCallback(() => {
    setIsPlaying(false);
    setStatus("idle");
  }, []);

  const trackTitle = nowPlaying?.title || "North Country Radio";
  const trackArtist = nowPlaying?.artist_name || "Americana & Country";
  const djName = nowPlaying?.dj_name;
  const listenerCount = nowPlaying?.listener_count;
  const artworkUrl = nowPlaying?.artwork_url;

  const showActive = status === "playing";
  const showLoading = status === "loading";
  const showError = status === "error";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-900 via-amber-800 to-orange-900 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border-t border-amber-700/50">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        onPlaying={onPlaying}
        onError={onError}
        onEnded={onEnded}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Artwork + Track Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {artworkUrl && showActive ? (
              <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden">
                <Image
                  src={artworkUrl}
                  alt={trackTitle}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <Radio className="w-5 h-5 text-amber-400 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-sm font-bold text-amber-100 truncate">
                {showError
                  ? "Stream Error"
                  : showLoading
                    ? "Connecting..."
                    : trackTitle}
              </div>
              <div className="text-xs text-amber-300/80 truncate">
                {showError
                  ? errorMsg
                  : showLoading
                    ? "Buffering stream..."
                    : showActive
                      ? `${trackArtist}${djName ? ` · DJ ${djName}` : ""}`
                      : "Click play to listen"}
              </div>
            </div>
          </div>

          {/* Center: Play Button + Equalizer */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-end space-x-0.5 h-6">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div
                  key={bar}
                  className={`w-1 rounded-full ${
                    showActive
                      ? "bg-green-400 animate-equalizer"
                      : "bg-amber-600 h-1"
                  }`}
                  style={
                    showActive
                      ? {
                          animationDelay: `${bar * 0.15}s`,
                          animationDuration: `${0.4 + bar * 0.1}s`,
                        }
                      : undefined
                  }
                />
              ))}
            </div>

            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 transition-colors flex items-center justify-center shadow-lg"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying || showLoading ? (
                <Pause className="w-5 h-5 text-amber-950" />
              ) : (
                <Play className="w-5 h-5 text-amber-950 ml-0.5" />
              )}
            </button>

            <div className="hidden sm:flex items-end space-x-0.5 h-6">
              {[6, 7, 8, 9, 10].map((bar) => (
                <div
                  key={bar}
                  className={`w-1 rounded-full ${
                    showActive
                      ? "bg-green-400 animate-equalizer"
                      : "bg-amber-600 h-1"
                  }`}
                  style={
                    showActive
                      ? {
                          animationDelay: `${bar * 0.12}s`,
                          animationDuration: `${0.5 + (bar - 5) * 0.08}s`,
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          {/* Right: Status + Volume */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            <div
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                showActive
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : showLoading
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : showError
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  showActive
                    ? "bg-green-400 animate-pulse"
                    : showLoading
                      ? "bg-blue-400 animate-pulse"
                      : showError
                        ? "bg-red-400"
                        : "bg-gray-500"
                }`}
              />
              <span>
                {showActive
                  ? "ON AIR"
                  : showLoading
                    ? "LOADING"
                    : showError
                      ? "ERROR"
                      : "OFFLINE"}
              </span>
            </div>

            <div className="hidden lg:block text-xs text-amber-300/70">
              {showActive && listenerCount != null
                ? `${listenerCount.toLocaleString()} listener${listenerCount !== 1 ? "s" : ""}`
                : "---"}
            </div>

            <div className="hidden sm:flex items-center space-x-2">
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
                className="w-20 h-1 accent-amber-400 bg-amber-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
