"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL || "/stream/americana-hq.mp3";
const NOW_PLAYING_URL = "/api/now-playing";
const POLL_INTERVAL = 15_000;

interface NowPlaying {
  title: string;
  artist_name: string;
  artwork_url: string;
  listener_count: number;
  dj_name: string;
  station: string;
  status: string;
}

function useSearchParam(name: string, fallback: string): string {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(name) || fallback);
  }, [name, fallback]);
  return value;
}

function normalizeHex(hex: string): string {
  const clean = hex.replace("#", "");
  return clean.length === 6 ? `#${clean}` : "#1a1a2e";
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16) || 0,
    parseInt(clean.substring(2, 4), 16) || 0,
    parseInt(clean.substring(4, 6), 16) || 0,
  ];
}

function mix(hex: string, pct: number): string {
  const [r, g, b] = hexToRgb(hex);
  const adj = (c: number) => Math.round(pct < 0 ? c * (1 + pct) : c + (255 - c) * pct);
  return `#${[adj(r), adj(g), adj(b)].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

function hexAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function EmbedPlayerPage() {
  const theme = useSearchParam("theme", "dark");
  const accentColor = normalizeHex(useSearchParam("color", "f59e0b"));
  const bgColor = normalizeHex(useSearchParam("bg", theme === "light" ? "ffffff" : "1a1a2e"));
  const refCode = useSearchParam("ref", "");
  const shouldAutoplay = useSearchParam("autoplay", "0") === "1";

  const isDark = theme !== "light";

  const textPrimary = isDark ? "#ffffff" : "#0f172a";
  const textSecondary = isDark ? "rgba(255,255,255,0.72)" : "rgba(15,23,42,0.64)";
  const textMuted = isDark ? "rgba(255,255,255,0.48)" : "rgba(15,23,42,0.44)";
  const cardBg = isDark
    ? `linear-gradient(135deg, ${mix(bgColor, -0.25)} 0%, ${bgColor} 55%, ${mix(accentColor, -0.55)} 140%)`
    : `linear-gradient(135deg, ${bgColor} 0%, ${mix(accentColor, 0.85)} 140%)`;
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const volumeTrackBg = isDark ? "rgba(255,255,255,0.15)" : "rgba(15,23,42,0.12)";

  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [volume, setVolume] = useState(80);

  const audioRef = useRef<HTMLAudioElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const userStoppedRef = useRef(false);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch(NOW_PLAYING_URL, { cache: "no-store" });
      if (res.ok) setNowPlaying(await res.json());
    } catch { /* non-critical */ }
  }, []);

  const startSession = useCallback(async () => {
    try {
      const res = await fetch("/api/embed/listen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: refCode || undefined, device: "embed" }),
      });
      if (res.ok) {
        const data = await res.json();
        sessionIdRef.current = data.sessionId || null;
      }
    } catch { /* non-critical */ }
  }, [refCode]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    fetchNowPlaying();
    const poll = setInterval(fetchNowPlaying, POLL_INTERVAL);
    return () => {
      clearInterval(poll);
      if (pollRef.current) clearInterval(pollRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [fetchNowPlaying]);

  const clearReconnect = useCallback(() => {
    if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
  }, []);

  const reconnectStream = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || userStoppedRef.current) return;
    const delay = Math.min(2000 * Math.pow(2, reconnectAttemptRef.current), 30000);
    reconnectAttemptRef.current += 1;
    setStatus("loading");
    reconnectRef.current = setTimeout(() => {
      if (userStoppedRef.current) return;
      audio.src = `${STREAM_URL}?_t=${Date.now()}`;
      audio.play().catch(() => {});
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
    startSession();
    audio.src = `${STREAM_URL}?_t=${Date.now()}`;
    audio.play().catch(() => reconnectStream());
  }, [fetchNowPlaying, startSession, clearReconnect, reconnectStream]);

  const handlePause = useCallback(() => {
    const audio = audioRef.current;
    userStoppedRef.current = true;
    clearReconnect();
    if (audio) { audio.pause(); audio.src = ""; }
    setIsPlaying(false);
    setStatus("idle");
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (sessionIdRef.current) {
      fetch("/api/embed/listen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      }).catch(() => {});
      sessionIdRef.current = null;
    }
  }, [clearReconnect]);

  const togglePlay = useCallback(() => {
    if (isPlaying || status === "loading") handlePause();
    else handlePlay();
  }, [isPlaying, status, handlePlay, handlePause]);

  const onPlaying = useCallback(() => {
    setIsPlaying(true);
    setStatus("playing");
    reconnectAttemptRef.current = 0;
    clearReconnect();
    fetchNowPlaying();
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchNowPlaying, POLL_INTERVAL);
  }, [fetchNowPlaying, clearReconnect]);

  useEffect(() => {
    if (shouldAutoplay && audioRef.current) {
      const timer = setTimeout(() => handlePlay(), 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoplay]);

  const stationName = nowPlaying?.station || "TrueFans Radio";
  const trackTitle = nowPlaying?.title || "Tune in";
  const trackArtist = nowPlaying?.artist_name || "Press play to listen";
  const djName = nowPlaying?.dj_name;
  const artworkUrl = nowPlaying?.artwork_url;
  const isOnAir = nowPlaying?.status === "on-air";
  const showLoading = status === "loading";
  const showError = status === "error";

  return (
    <>
      <style>{`
        @keyframes pl-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes pl-eq-1 { 0%, 100% { height: 4px; } 50% { height: 14px; } }
        @keyframes pl-eq-2 { 0%, 100% { height: 10px; } 50% { height: 3px; } }
        @keyframes pl-eq-3 { 0%, 100% { height: 6px; } 50% { height: 16px; } }
        @keyframes pl-spin { to { transform: rotate(360deg); } }
        .pl-art-spin { animation: pl-spin 20s linear infinite; }
        body { margin: 0; background: transparent; }
        .pl-volume { -webkit-appearance: none; appearance: none; background: ${volumeTrackBg}; border-radius: 4px; outline: none; cursor: pointer; height: 4px; }
        .pl-volume::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; border-radius: 50%; background: ${accentColor}; cursor: pointer; box-shadow: 0 0 0 2px ${hexAlpha(accentColor, 0.25)}; }
        .pl-volume::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: ${accentColor}; border: none; cursor: pointer; }
        .pl-play-btn { transition: transform 0.12s ease, box-shadow 0.2s ease; }
        .pl-play-btn:active { transform: scale(0.93); }
      `}</style>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        onPlaying={onPlaying}
        onError={() => { if (!userStoppedRef.current) { setIsPlaying(false); reconnectStream(); } }}
        onEnded={() => { if (!userStoppedRef.current) { setIsPlaying(false); reconnectStream(); } }}
        onStalled={() => {
          if (userStoppedRef.current || !audioRef.current || audioRef.current.paused) return;
          reconnectRef.current = setTimeout(() => {
            if (userStoppedRef.current || !audioRef.current || audioRef.current.paused) return;
            reconnectAttemptRef.current = 0;
            audioRef.current.src = `${STREAM_URL}?_t=${Date.now()}`;
            audioRef.current.play().catch(() => {});
          }, 8000);
        }}
        preload="none"
      />

      <div style={{
        width: "100%", maxWidth: 400, boxSizing: "border-box",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{
          background: cardBg,
          borderRadius: 16,
          padding: "14px",
          color: textPrimary,
          boxShadow: isDark
            ? "0 14px 40px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 10px 30px -14px rgba(15,23,42,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
          border: `1px solid ${borderColor}`,
          position: "relative", overflow: "hidden",
        }}>
          {/* Station header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 10, gap: 8,
          }}>
            <div style={{
              fontSize: 9.5, fontWeight: 800, color: accentColor,
              textTransform: "uppercase", letterSpacing: "0.1em",
              display: "flex", alignItems: "center", gap: 6,
              minWidth: 0, flex: 1,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%", background: accentColor,
                boxShadow: `0 0 6px ${accentColor}`, flexShrink: 0,
              }} />
              <span style={{
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                minWidth: 0,
              }}>{stationName}</span>
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 8px", borderRadius: 999,
              background: isOnAir ? hexAlpha(accentColor, 0.15) : isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)",
              border: `1px solid ${isOnAir ? hexAlpha(accentColor, 0.35) : borderColor}`,
              flexShrink: 0,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: showLoading ? "#60a5fa" : isOnAir ? "#4ade80" : "#94a3b8",
                animation: (isOnAir || showLoading) ? "pl-pulse 1.6s ease-in-out infinite" : undefined,
                boxShadow: isOnAir ? "0 0 8px #4ade80" : undefined,
              }} />
              <span style={{
                fontSize: 8.5, fontWeight: 800, letterSpacing: "0.08em",
                color: showLoading ? "#60a5fa" : isOnAir ? "#4ade80" : textMuted,
              }}>
                {showLoading ? "CONNECTING" : isOnAir ? "LIVE" : "OFF AIR"}
              </span>
            </div>
          </div>

          {/* Main row: artwork + info + play */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Artwork */}
            <div style={{
              position: "relative", flexShrink: 0,
              width: 64, height: 64, borderRadius: "50%",
              background: `linear-gradient(135deg, ${mix(accentColor, -0.2)}, ${mix(accentColor, -0.55)})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 0 1px ${hexAlpha(accentColor, 0.3)}, 0 10px 24px -8px ${hexAlpha(accentColor, 0.45)}`,
            }}
            className={isPlaying ? "pl-art-spin" : ""}>
              {artworkUrl ? (
                <img src={artworkUrl} alt={trackTitle} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
              )}
              <div style={{
                position: "absolute", inset: "42%", borderRadius: "50%",
                background: isDark ? "#000" : "#fff",
                boxShadow: `0 0 0 2px ${accentColor}`,
              }} />
            </div>

            {/* Track info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14.5, fontWeight: 700, color: textPrimary, lineHeight: 1.25,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {showError ? "Stream unavailable" : showLoading ? "Connecting…" : trackTitle}
              </div>
              <div style={{
                fontSize: 12, color: textSecondary, lineHeight: 1.3, marginTop: 2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {showError ? "Tap play to retry" : trackArtist}
              </div>
              {djName && !showLoading && !showError && (
                <div style={{
                  fontSize: 10, color: textMuted, marginTop: 3,
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  {isPlaying && (
                    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 10 }}>
                      <span style={{ width: 2, background: accentColor, animation: "pl-eq-1 0.9s ease-in-out infinite" }} />
                      <span style={{ width: 2, background: accentColor, animation: "pl-eq-2 0.9s ease-in-out infinite 0.15s" }} />
                      <span style={{ width: 2, background: accentColor, animation: "pl-eq-3 0.9s ease-in-out infinite 0.3s" }} />
                    </span>
                  )}
                  <span>Hosted by {djName}</span>
                </div>
              )}
            </div>

            {/* Play button */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="pl-play-btn"
              style={{
                width: 48, height: 48, borderRadius: "50%",
                background: `linear-gradient(135deg, ${mix(accentColor, 0.15)}, ${accentColor})`,
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 6px 20px -4px ${hexAlpha(accentColor, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
              }}
            >
              {isPlaying || showLoading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                  <rect x="6" y="4" width="4" height="16" rx="1.5" />
                  <rect x="14" y="4" width="4" height="16" rx="1.5" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 3 }}>
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              )}
            </button>
          </div>

          {/* Volume row */}
          <div style={{
            marginTop: 12, paddingTop: 10,
            borderTop: `1px solid ${borderColor}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <button
              onClick={() => setVolume((v) => (v > 0 ? 0 : 80))}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: accentColor }}
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                </svg>
              )}
            </button>
            <input
              type="range" min="0" max="100" value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="pl-volume"
              style={{ flex: 1 }}
              aria-label="Volume"
            />
            <span style={{ fontSize: 10, color: textMuted, minWidth: 24, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {volume}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "6px 0 0" }}>
          <a href="https://truefans-radio.netlify.app" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 9, color: textMuted, textDecoration: "none", letterSpacing: "0.03em" }}>
            Powered by TrueFans
          </a>
        </div>
      </div>
    </>
  );
}
