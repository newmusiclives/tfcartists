"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, Headphones } from "lucide-react";
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

export function RadioPlayer() {
  const { currentStation } = useStation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [xpToast, setXpToast] = useState<{ amount: number; visible: boolean }>({ amount: 0, visible: false });

  const audioRef = useRef<HTMLAudioElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<number | null>(null);

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
    const handleBeforeUnload = () => {
      // Best-effort session end on page close
      if (sessionIdRef.current && sessionStartRef.current) {
        const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
        navigator.sendBeacon(
          "/api/listeners/sessions/end",
          new Blob(
            [JSON.stringify({ sessionId: sessionIdRef.current, duration })],
            { type: "application/json" }
          )
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startSession = useCallback(async () => {
    try {
      const listenerId = localStorage.getItem("listenerId");
      const res = await fetch("/api/listeners/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listenerId: listenerId || null }),
      });
      if (res.ok) {
        const data = await res.json();
        sessionIdRef.current = data.session?.id || null;
        sessionStartRef.current = Date.now();
      }
    } catch {
      // Non-critical
    }
  }, []);

  const endSession = useCallback(async () => {
    if (!sessionIdRef.current || !sessionStartRef.current) return;
    const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
    try {
      const res = await fetch("/api/listeners/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          duration,
        }),
      });

      // Show XP toast if XP was awarded
      if (res.ok) {
        const data = await res.json();
        if (data.xpAwarded && data.xpAwarded > 0 && localStorage.getItem("listenerId")) {
          setXpToast({ amount: data.xpAwarded, visible: true });
          setTimeout(() => setXpToast((t) => ({ ...t, visible: false })), 3000);
        }
      }
    } catch {
      // Non-critical
    }
    sessionIdRef.current = null;
    sessionStartRef.current = null;
  }, []);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setStatus("loading");
    fetchNowPlaying(); // Fetch metadata immediately on play
    startSession(); // Track listening session
    audio.src = `${STREAM_URL}?_t=${Date.now()}`;
    audio.play().catch(() => {
      setStatus("error");
    });
  }, [fetchNowPlaying, startSession]);

  const handlePause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setIsPlaying(false);
    setStatus("idle");
    stopPolling();
    endSession();
  }, [stopPolling, endSession]);

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

  const trackTitle = nowPlaying?.title || currentStation.name;
  const trackArtist = nowPlaying?.artist_name || currentStation.genre;
  const djName = nowPlaying?.dj_name;
  const listenerCount = nowPlaying?.listener_count;
  const artworkUrl = nowPlaying?.artwork_url;

  const showActive = status === "playing";
  const showLoading = status === "loading";
  const showError = status === "error";

  return (
    <>
      {/* XP Toast Notification */}
      {xpToast.visible && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold">
            +{xpToast.amount} XP
          </div>
        </div>
      )}
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-900 via-amber-800 to-orange-900 text-white shadow-[0_-6px_30px_rgba(0,0,0,0.4)] border-t border-amber-700/50">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        onPlaying={onPlaying}
        onError={onError}
        onEnded={onEnded}
      />

      {/* Top accent line */}
      <div className={`h-1 ${showActive ? "bg-green-500" : showLoading ? "bg-blue-500 animate-pulse" : "bg-amber-500/50"}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Left: Artwork + Track Info */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <button
              onClick={togglePlayPause}
              className="relative flex-shrink-0 group"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {artworkUrl ? (
                <div className={`w-14 h-14 rounded-lg overflow-hidden shadow-lg ${showActive ? "ring-2 ring-green-400/60" : ""}`}>
                  <img
                    src={artworkUrl}
                    alt={trackTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`w-14 h-14 rounded-lg bg-amber-700/50 flex items-center justify-center shadow-lg ${showActive ? "ring-2 ring-green-400/60" : ""}`}>
                  <Radio className="w-7 h-7 text-amber-400" />
                </div>
              )}
            </button>

            <div className="min-w-0">
              <div className="text-base font-bold text-white truncate">
                {showError
                  ? "Stream unavailable"
                  : showLoading
                    ? "Connecting..."
                    : trackTitle}
              </div>
              <div className="text-sm text-amber-300/80 truncate">
                {showError
                  ? "Tap play to retry"
                  : showLoading
                    ? "Buffering stream..."
                    : showActive
                      ? `${trackArtist}${djName ? ` · DJ ${djName}` : ""}`
                      : "Click play to listen"}
              </div>
            </div>
          </div>

          {/* Center: Equalizer + Play Button + Equalizer */}
          <div className="flex items-center space-x-4 px-4">
            <div className="hidden sm:flex items-end space-x-0.5 h-8">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div
                  key={bar}
                  className={`w-1.5 rounded-full ${
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
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 ${
                showActive
                  ? "bg-green-500 hover:bg-green-400"
                  : showLoading
                    ? "bg-blue-500 hover:bg-blue-400"
                    : "bg-amber-500 hover:bg-amber-400"
              }`}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying || showLoading ? (
                <Pause className="w-7 h-7 text-white" />
              ) : (
                <Play className="w-7 h-7 text-white ml-0.5" />
              )}
            </button>

            <div className="hidden sm:flex items-end space-x-0.5 h-8">
              {[6, 7, 8, 9, 10].map((bar) => (
                <div
                  key={bar}
                  className={`w-1.5 rounded-full ${
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

          {/* Right: Status + Listeners + Volume */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            <div
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                showActive
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : showLoading
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  showActive
                    ? "bg-green-400 animate-pulse"
                    : showLoading
                      ? "bg-blue-400 animate-pulse"
                      : "bg-gray-500"
                }`}
              />
              <span>
                {showActive
                  ? "ON AIR"
                  : showLoading
                    ? "LOADING"
                    : "OFFLINE"}
              </span>
            </div>

            {showActive && listenerCount != null && (
              <div className="hidden lg:flex items-center space-x-1.5 text-sm text-amber-300/80">
                <Headphones className="w-4 h-4" />
                <span>{listenerCount.toLocaleString()}</span>
              </div>
            )}

            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={() => setVolume((v) => (v > 0 ? 0 : 75))}
                className="text-amber-400 hover:text-amber-300 transition-colors"
                aria-label={volume === 0 ? "Unmute" : "Mute"}
              >
                {volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-24 h-1.5 accent-amber-400 bg-amber-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
