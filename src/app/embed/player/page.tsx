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
}

function useSearchParam(name: string, fallback: string): string {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(name) || fallback);
  }, [name, fallback]);
  return value;
}

/** Parse a hex color (with or without #) into an rgba string with given alpha */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(120,53,15,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Darken a hex color by a percentage */
function darkenHex(hex: string, pct: number): string {
  const clean = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(clean.substring(0, 2), 16) * (1 - pct)));
  const g = Math.max(0, Math.round(parseInt(clean.substring(2, 4), 16) * (1 - pct)));
  const b = Math.max(0, Math.round(parseInt(clean.substring(4, 6), 16) * (1 - pct)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** Lighten a hex color by a percentage */
function lightenHex(hex: string, pct: number): string {
  const clean = hex.replace("#", "");
  const r = Math.min(255, Math.round(parseInt(clean.substring(0, 2), 16) + (255 - parseInt(clean.substring(0, 2), 16)) * pct));
  const g = Math.min(255, Math.round(parseInt(clean.substring(2, 4), 16) + (255 - parseInt(clean.substring(2, 4), 16)) * pct));
  const b = Math.min(255, Math.round(parseInt(clean.substring(4, 6), 16) + (255 - parseInt(clean.substring(4, 6), 16)) * pct));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default function EmbedPlayerPage() {
  const theme = useSearchParam("theme", "dark");
  const accentColor = useSearchParam("color", "#f59e0b");
  const bgColor = useSearchParam("bg", theme === "light" ? "#ffffff" : "#1a1a2e");
  const refCode = useSearchParam("ref", "");
  const sizeParam = useSearchParam("size", "compact");
  const showArtwork = useSearchParam("artwork", "1") !== "0";
  const showNowPlaying = useSearchParam("nowplaying", "1") !== "0";
  const showListeners = useSearchParam("listeners", "1") !== "0";
  const showStationName = useSearchParam("station", "1") !== "0";
  const showVolumeControl = useSearchParam("volume", "1") !== "0";
  const isRounded = useSearchParam("rounded", "1") !== "0";
  const shouldAutoplay = useSearchParam("autoplay", "0") === "1";
  const customCss = useSearchParam("css", "");

  const isDark = theme !== "light";

  // Derived theme colors
  const textPrimary = isDark ? "#ffffff" : "#111827";
  const textSecondary = isDark ? "rgba(255,255,255,0.7)" : "rgba(17,24,39,0.6)";
  const textMuted = isDark ? "rgba(255,255,255,0.4)" : "rgba(17,24,39,0.4)";
  const bgGradient = isDark
    ? `linear-gradient(135deg, ${darkenHex(bgColor, 0.2)} 0%, ${bgColor} 50%, ${lightenHex(bgColor, 0.1)} 100%)`
    : `linear-gradient(135deg, ${bgColor} 0%, ${darkenHex(bgColor, 0.03)} 100%)`;
  const artworkFallbackBg = isDark
    ? `linear-gradient(135deg, ${darkenHex(accentColor, 0.6)} 0%, ${darkenHex(accentColor, 0.3)} 100%)`
    : `linear-gradient(135deg, ${lightenHex(accentColor, 0.7)} 0%, ${lightenHex(accentColor, 0.5)} 100%)`;
  const volumeTrackBg = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
  const volumeIconColor = accentColor;

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
    return () => {
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

  // Autoplay on mount
  useEffect(() => {
    if (shouldAutoplay && audioRef.current) {
      const timer = setTimeout(() => handlePlay(), 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoplay]);

  const trackTitle = nowPlaying?.title || "TrueFans Radio";
  const trackArtist = nowPlaying?.artist_name || "Live Radio";
  const djName = nowPlaying?.dj_name;
  const artworkUrl = nowPlaying?.artwork_url;
  const listenerCount = nowPlaying?.listener_count;
  const stationName = nowPlaying?.station || "TrueFans Radio";
  const showActive = status === "playing";
  const showLoading = status === "loading";
  const showError = status === "error";

  const borderRadius = isRounded ? 12 : 0;
  const isCompact = sizeParam === "compact";
  const isStandard = sizeParam === "standard";
  const isFull = sizeParam === "full";

  const decodedCustomCss = customCss ? decodeURIComponent(customCss) : "";

  const dynamicStyles = `
@keyframes eq {
  0% { height: 3px; }
  100% { height: 16px; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.embed-status-badge.live {
  background: rgba(34,197,94,0.15);
  color: #4ade80;
  border: 1px solid rgba(34,197,94,0.3);
}
.embed-status-badge.loading {
  background: rgba(96,165,250,0.15);
  color: #60a5fa;
  border: 1px solid rgba(96,165,250,0.3);
}
.embed-status-badge.offline {
  background: rgba(107,114,128,0.15);
  color: #9ca3af;
  border: 1px solid rgba(107,114,128,0.3);
}
.embed-volume {
  -webkit-appearance: none;
  appearance: none;
  background: ${volumeTrackBg};
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}
.embed-volume::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${accentColor};
  cursor: pointer;
}
.embed-volume::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${accentColor};
  border: none;
  cursor: pointer;
}
${decodedCustomCss}
`;

  return (
    <>
      <style>{dynamicStyles}</style>
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

      {/* ==================== COMPACT LAYOUT ==================== */}
      {isCompact && (
        <>
          <div className="embed-player" style={{
            width: "100%",
            maxWidth: 400,
            height: 80,
            borderRadius,
            overflow: "hidden",
            background: bgGradient,
            fontFamily: "system-ui, -apple-system, sans-serif",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: 10,
            color: textPrimary,
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.08)",
            border: isDark ? "none" : "1px solid rgba(0,0,0,0.08)",
            boxSizing: "border-box",
          }}>
            {/* Artwork */}
            {showArtwork && (
              <div style={{
                width: 52, height: 52, borderRadius: 8, overflow: "hidden",
                flexShrink: 0, background: artworkFallbackBg,
              }}>
                {artworkUrl ? (
                  <img src={artworkUrl} alt={trackTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round">
                      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                    </svg>
                  </div>
                )}
              </div>
            )}

            {/* Track info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <div
                  className={`embed-status-badge ${showActive ? "live" : showLoading ? "loading" : "offline"}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "1px 6px", borderRadius: 20,
                    fontSize: 8, fontWeight: 700,
                    textTransform: "uppercase" as const, letterSpacing: "0.05em",
                  }}
                >
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: showActive ? "#4ade80" : showLoading ? "#60a5fa" : "#6b7280",
                    animation: (showActive || showLoading) ? "pulse 2s infinite" : undefined,
                  }} />
                  {showActive ? "LIVE" : showLoading ? "..." : "OFF"}
                </div>
                {djName && showActive && (
                  <span style={{ fontSize: 9, color: textMuted, fontWeight: 500 }}>DJ {djName}</span>
                )}
              </div>
              {showNowPlaying && (
                <div style={{
                  fontSize: 13, fontWeight: 700, color: textPrimary,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {showError ? "Stream Unavailable" : showLoading ? "Connecting..." : trackTitle}
                </div>
              )}
              <div style={{
                fontSize: 11, color: textSecondary,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {showError ? "Tap play to retry" : showActive ? trackArtist : (showStationName ? stationName : "")}
              </div>
            </div>

            {/* Play button */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: accentColor, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 2px 8px ${hexToRgba(accentColor, 0.4)}`,
                transition: "transform 0.1s",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.93)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isPlaying || showLoading ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isDark ? "#000" : "#fff"}>
                  <rect x="5" y="3" width="4" height="18" rx="1" />
                  <rect x="15" y="3" width="4" height="18" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isDark ? "#000" : "#fff"} style={{ marginLeft: 2 }}>
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              )}
            </button>

            {/* Volume */}
            {showVolumeControl && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <button
                  onClick={() => setVolume((v) => (v > 0 ? 0 : 80))}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
                  aria-label={volume === 0 ? "Unmute" : "Mute"}
                >
                  {volume === 0 ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={volumeIconColor} strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={volumeIconColor} strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
                  )}
                </button>
                <input
                  type="range" min="0" max="100" value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="embed-volume"
                  style={{ width: 48, height: 3 }}
                  aria-label="Volume"
                />
              </div>
            )}
          </div>

          {/* Powered by */}
          <div style={{ width: "100%", maxWidth: 400, textAlign: "center", padding: "4px 0" }}>
            <a href="https://truefans-radio.netlify.app" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 9, color: textMuted, textDecoration: "none", fontFamily: "system-ui, -apple-system, sans-serif" }}>
              Powered by TrueFans
            </a>
          </div>
        </>
      )}

      {/* ==================== STANDARD LAYOUT (card with artwork) ==================== */}
      {isStandard && (
        <div className="embed-player" style={{
          width: "100%", maxWidth: 350,
          borderRadius,
          overflow: "hidden",
          background: bgGradient,
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: textPrimary,
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.08)",
          border: isDark ? "none" : "1px solid rgba(0,0,0,0.08)",
          boxSizing: "border-box",
        }}>
          {/* Top section: artwork + info */}
          <div style={{ display: "flex", alignItems: "center", padding: "14px 14px 10px", gap: 12 }}>
            {showArtwork && (
              <div style={{
                width: 80, height: 80, borderRadius: isRounded ? 10 : 0, overflow: "hidden",
                flexShrink: 0, background: artworkFallbackBg,
              }}>
                {artworkUrl ? (
                  <img src={artworkUrl} alt={trackTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round">
                      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                    </svg>
                  </div>
                )}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              {showStationName && (
                <div style={{ fontSize: 10, color: textMuted, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 }}>
                  {stationName}
                </div>
              )}
              <div
                className={`embed-status-badge ${showActive ? "live" : showLoading ? "loading" : "offline"}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: 20,
                  fontSize: 9, fontWeight: 700,
                  textTransform: "uppercase" as const, letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: showActive ? "#4ade80" : showLoading ? "#60a5fa" : "#6b7280",
                  animation: (showActive || showLoading) ? "pulse 2s infinite" : undefined,
                }} />
                {showActive ? "LIVE" : showLoading ? "CONNECTING" : "OFF AIR"}
              </div>
              {showNowPlaying && (
                <>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: textPrimary,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {showError ? "Stream Unavailable" : showLoading ? "Connecting..." : trackTitle}
                  </div>
                  <div style={{
                    fontSize: 12, color: textSecondary, marginTop: 2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {showError ? "Tap play to retry" : trackArtist}
                  </div>
                </>
              )}
              {showListeners && showActive && listenerCount !== undefined && listenerCount > 0 && (
                <div style={{ fontSize: 10, color: textMuted, marginTop: 4 }}>
                  {listenerCount} listening now
                </div>
              )}
            </div>
          </div>

          {/* Controls row */}
          <div style={{ display: "flex", alignItems: "center", padding: "0 14px 14px", gap: 12 }}>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              style={{
                width: 42, height: 42, borderRadius: "50%",
                background: accentColor, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 2px 10px ${hexToRgba(accentColor, 0.4)}`,
                transition: "transform 0.1s",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.93)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isPlaying || showLoading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isDark ? "#000" : "#fff"}>
                  <rect x="5" y="3" width="4" height="18" rx="1" />
                  <rect x="15" y="3" width="4" height="18" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isDark ? "#000" : "#fff"} style={{ marginLeft: 2 }}>
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              )}
            </button>

            {showVolumeControl && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                <button
                  onClick={() => setVolume((v) => (v > 0 ? 0 : 80))}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
                  aria-label={volume === 0 ? "Unmute" : "Mute"}
                >
                  {volume === 0 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={volumeIconColor} strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={volumeIconColor} strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
                  )}
                </button>
                <input
                  type="range" min="0" max="100" value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="embed-volume"
                  style={{ flex: 1, height: 3 }}
                  aria-label="Volume"
                />
              </div>
            )}

            <a href="https://truefans-radio.netlify.app" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 9, color: textMuted, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}>
              Powered by TrueFans
            </a>
          </div>
        </div>
      )}

      {/* ==================== FULL LAYOUT (with playlist area) ==================== */}
      {isFull && (
        <div className="embed-player" style={{
          width: "100%", maxWidth: 350,
          borderRadius,
          overflow: "hidden",
          background: bgGradient,
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: textPrimary,
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.08)",
          border: isDark ? "none" : "1px solid rgba(0,0,0,0.08)",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Station name header */}
          {showStationName && (
            <div style={{
              padding: "12px 16px 0",
              fontSize: 11, fontWeight: 700, color: textMuted,
              textTransform: "uppercase" as const, letterSpacing: "0.08em",
              textAlign: "center",
            }}>
              {stationName}
            </div>
          )}

          {/* Large artwork */}
          {showArtwork && (
            <div style={{
              margin: "12px 16px", borderRadius: isRounded ? 12 : 0, overflow: "hidden",
              aspectRatio: "1", background: artworkFallbackBg,
            }}>
              {artworkUrl ? (
                <img src={artworkUrl} alt={trackTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* Status badge */}
          <div style={{ textAlign: "center", padding: "0 16px 4px" }}>
            <div
              className={`embed-status-badge ${showActive ? "live" : showLoading ? "loading" : "offline"}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 10px", borderRadius: 20,
                fontSize: 9, fontWeight: 700,
                textTransform: "uppercase" as const, letterSpacing: "0.06em",
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: showActive ? "#4ade80" : showLoading ? "#60a5fa" : "#6b7280",
                animation: (showActive || showLoading) ? "pulse 2s infinite" : undefined,
              }} />
              {showActive ? "LIVE" : showLoading ? "CONNECTING" : "OFF AIR"}
            </div>
          </div>

          {/* Track info */}
          {showNowPlaying && (
            <div style={{ textAlign: "center", padding: "6px 16px" }}>
              <div style={{
                fontSize: 16, fontWeight: 700, color: textPrimary,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {showError ? "Stream Unavailable" : showLoading ? "Connecting..." : trackTitle}
              </div>
              <div style={{
                fontSize: 13, color: textSecondary, marginTop: 3,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {showError ? "Tap play to retry" : trackArtist}
              </div>
              {djName && showActive && (
                <div style={{ fontSize: 11, color: textMuted, marginTop: 3 }}>with {djName}</div>
              )}
            </div>
          )}

          {/* Listener count */}
          {showListeners && showActive && listenerCount !== undefined && listenerCount > 0 && (
            <div style={{ textAlign: "center", fontSize: 10, color: textMuted, padding: "2px 0" }}>
              {listenerCount} listening now
            </div>
          )}

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 16px", gap: 16 }}>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              style={{
                width: 48, height: 48, borderRadius: "50%",
                background: accentColor, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 3px 12px ${hexToRgba(accentColor, 0.4)}`,
                transition: "transform 0.1s",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.93)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isPlaying || showLoading ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isDark ? "#000" : "#fff"}>
                  <rect x="5" y="3" width="4" height="18" rx="1" />
                  <rect x="15" y="3" width="4" height="18" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isDark ? "#000" : "#fff"} style={{ marginLeft: 2 }}>
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              )}
            </button>
          </div>

          {/* Volume */}
          {showVolumeControl && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 24px 8px" }}>
              <button
                onClick={() => setVolume((v) => (v > 0 ? 0 : 80))}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
                aria-label={volume === 0 ? "Unmute" : "Mute"}
              >
                {volume === 0 ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={volumeIconColor} strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={volumeIconColor} strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
                )}
              </button>
              <input
                type="range" min="0" max="100" value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="embed-volume"
                style={{ flex: 1, height: 3 }}
                aria-label="Volume"
              />
            </div>
          )}

          {/* Powered by */}
          <div style={{ textAlign: "center", padding: "6px 0 10px" }}>
            <a href="https://truefans-radio.netlify.app" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 9, color: textMuted, textDecoration: "none" }}>
              Powered by TrueFans
            </a>
          </div>
        </div>
      )}
    </>
  );
}
