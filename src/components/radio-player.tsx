"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Radio } from "lucide-react";
import Image from "next/image";

const STREAM_URL = "https://tfc-radio.netlify.app/stream/americana-hq.mp3";
const NOW_PLAYING_URL =
  "https://tfc-radio-backend-production.up.railway.app/api/now_playing";
const POLL_INTERVAL = 10_000;
const FROZEN_THRESHOLD = 15_000;
const MAX_BACKOFF = 30_000;

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
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frozenRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTimeRef = useRef(0);
  const backoffRef = useRef(2000);
  const volumeRef = useRef(volume);
  const wantPlayRef = useRef(false);

  // Keep volume ref in sync and apply to audio element
  useEffect(() => {
    volumeRef.current = volume;
    if (audioElRef.current) {
      audioElRef.current.volume = volume / 100;
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
      // Silently ignore — metadata is non-critical
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

  const stopFrozenCheck = useCallback(() => {
    if (frozenRef.current) {
      clearInterval(frozenRef.current);
      frozenRef.current = null;
    }
  }, []);

  // Connect to the stream using a DOM audio element
  const connectStream = useCallback(() => {
    // Tear down any existing audio
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
      audioElRef.current.load();
      audioElRef.current.remove();
      audioElRef.current = null;
    }

    if (!wantPlayRef.current) return;

    // Create a real DOM element — more reliable for live streams than new Audio()
    const audio = document.createElement("audio");
    audio.crossOrigin = "anonymous";
    audio.volume = volumeRef.current / 100;
    audioElRef.current = audio;
    lastTimeRef.current = 0;

    audio.addEventListener("playing", () => {
      setIsReconnecting(false);
      setIsPlaying(true);
      backoffRef.current = 2000;
    });

    audio.addEventListener("error", () => {
      if (!wantPlayRef.current) return;
      setIsReconnecting(true);
      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
      reconnectRef.current = setTimeout(() => connectStream(), delay);
    });

    // Set src and play — cache-bust to avoid stale CDN responses
    audio.src = `${STREAM_URL}?_t=${Date.now()}`;
    audio.load();

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        if (!wantPlayRef.current) return;
        setIsReconnecting(true);
        const delay = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
        reconnectRef.current = setTimeout(() => connectStream(), delay);
      });
    }
  }, []);

  const startFrozenCheck = useCallback(() => {
    stopFrozenCheck();
    frozenRef.current = setInterval(() => {
      const audio = audioElRef.current;
      if (!audio || audio.paused || !wantPlayRef.current) return;
      if (audio.currentTime === lastTimeRef.current) {
        setIsReconnecting(true);
        const delay = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
        if (audioElRef.current) {
          audioElRef.current.pause();
          audioElRef.current.src = "";
          audioElRef.current.load();
          audioElRef.current.remove();
          audioElRef.current = null;
        }
        reconnectRef.current = setTimeout(() => connectStream(), delay);
      }
      lastTimeRef.current = audio.currentTime;
    }, FROZEN_THRESHOLD);
  }, [stopFrozenCheck, connectStream]);

  const handlePlay = useCallback(() => {
    wantPlayRef.current = true;
    backoffRef.current = 2000;
    connectStream();
    startPolling();
    startFrozenCheck();
  }, [connectStream, startPolling, startFrozenCheck]);

  const handlePause = useCallback(() => {
    wantPlayRef.current = false;
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
      audioElRef.current.load();
      audioElRef.current.remove();
      audioElRef.current = null;
    }
    setIsPlaying(false);
    setIsReconnecting(false);
    stopPolling();
    stopFrozenCheck();
  }, [stopPolling, stopFrozenCheck]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying || isReconnecting) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, isReconnecting, handlePlay, handlePause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wantPlayRef.current = false;
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.src = "";
        audioElRef.current.remove();
      }
      if (pollRef.current) clearInterval(pollRef.current);
      if (frozenRef.current) clearInterval(frozenRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, []);

  const trackTitle = nowPlaying?.title || "North Country Radio";
  const trackArtist = nowPlaying?.artist_name || "Americana & Country";
  const djName = nowPlaying?.dj_name;
  const listenerCount = nowPlaying?.listener_count;
  const artworkUrl = nowPlaying?.artwork_url;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-900 via-amber-800 to-orange-900 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border-t border-amber-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Artwork + Track Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {artworkUrl && isPlaying ? (
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
                {isReconnecting ? "Reconnecting..." : trackTitle}
              </div>
              <div className="text-xs text-amber-300/80 truncate">
                {isReconnecting
                  ? "Stream interrupted"
                  : isPlaying
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
                    isPlaying && !isReconnecting
                      ? "bg-green-400 animate-equalizer"
                      : "bg-amber-600 h-1"
                  }`}
                  style={
                    isPlaying && !isReconnecting
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
              {isPlaying || isReconnecting ? (
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
                    isPlaying && !isReconnecting
                      ? "bg-green-400 animate-equalizer"
                      : "bg-amber-600 h-1"
                  }`}
                  style={
                    isPlaying && !isReconnecting
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
                isPlaying && !isReconnecting
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : isReconnecting
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying && !isReconnecting
                    ? "bg-green-400 animate-pulse"
                    : isReconnecting
                      ? "bg-yellow-400 animate-pulse"
                      : "bg-gray-500"
                }`}
              />
              <span>
                {isPlaying && !isReconnecting
                  ? "ON AIR"
                  : isReconnecting
                    ? "RECONNECTING"
                    : "OFFLINE"}
              </span>
            </div>

            <div className="hidden lg:block text-xs text-amber-300/70">
              {isPlaying && listenerCount != null
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
