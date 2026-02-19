"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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

function useSearchParam(name: string, fallback: string): string {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(name) || fallback);
  }, [name, fallback]);
  return value;
}

export default function EmbedPlayerPage() {
  const size = useSearchParam("size", "compact");
  const refCode = useSearchParam("ref", "");

  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [volume, setVolume] = useState(80);

  const audioRef = useRef<HTMLAudioElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

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
    // Pre-fetch now playing on mount for artwork even before play
    fetchNowPlaying();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNowPlaying]);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setStatus("loading");
    fetchNowPlaying();
    startSession();
    audio.src = `${STREAM_URL}?_t=${Date.now()}`;
    audio.play().catch(() => setStatus("error"));
  }, [fetchNowPlaying, startSession]);

  const handlePause = useCallback(() => {
    const audio = audioRef.current;
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
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying || status === "loading") handlePause();
    else handlePlay();
  }, [isPlaying, status, handlePlay, handlePause]);

  const onPlaying = useCallback(() => {
    setIsPlaying(true);
    setStatus("playing");
    fetchNowPlaying();
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchNowPlaying, POLL_INTERVAL);
  }, [fetchNowPlaying]);

  const trackTitle = nowPlaying?.title || "North Country Radio";
  const trackArtist = nowPlaying?.artist_name || "Americana & Country";
  const djName = nowPlaying?.dj_name;
  const listenerCount = nowPlaying?.listener_count;
  const artworkUrl = nowPlaying?.artwork_url;
  const showActive = status === "playing";
  const showLoading = status === "loading";
  const showError = status === "error";

  // Audio element shared across all sizes
  const audioEl = (
    <>
      <style>{styles}</style>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        onPlaying={onPlaying}
        onError={() => { setStatus("error"); setIsPlaying(false); }}
        onEnded={() => { setIsPlaying(false); setStatus("idle"); }}
      />
    </>
  );

  // Status badge
  const statusBadge = (small = false) => (
    <div
      className={`embed-status-badge ${showActive ? "live" : showLoading ? "loading" : "offline"}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: small ? 4 : 5,
        padding: small ? "2px 6px" : "3px 8px",
        borderRadius: 20,
        fontSize: small ? 8 : 10, fontWeight: 700,
        textTransform: "uppercase" as const, letterSpacing: "0.05em",
      }}
    >
      <span
        style={{
          width: small ? 5 : 6, height: small ? 5 : 6, borderRadius: "50%",
          background: showActive ? "#4ade80" : showLoading ? "#60a5fa" : "#6b7280",
          animation: (showActive || showLoading) ? "pulse 2s infinite" : undefined,
        }}
      />
      {showActive ? "ON AIR" : showLoading ? "LOADING" : "OFFLINE"}
    </div>
  );

  // Equalizer bars
  const eqBars = (count = 7, height = 20) => (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2, height }}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            width: 2.5, borderRadius: 2,
            backgroundColor: showActive ? "#4ade80" : "rgba(120,53,15,0.3)",
            height: showActive ? undefined : 3,
            animation: showActive ? `eq ${0.4 + i * 0.08}s ease-in-out ${i * 0.12}s infinite alternate` : undefined,
          }}
        />
      ))}
    </div>
  );

  // Play/pause button
  const playBtn = (sz = 56) => (
    <button
      onClick={togglePlay}
      aria-label={isPlaying ? "Pause" : "Play"}
      style={{
        width: sz, height: sz, borderRadius: "50%",
        background: "#f59e0b", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 4px 14px rgba(120,53,15,0.4)",
        transition: "transform 0.1s, background 0.2s",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.93)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {isPlaying || showLoading ? (
        <svg width={sz * 0.38} height={sz * 0.38} viewBox="0 0 24 24" fill="#451a03">
          <rect x="5" y="3" width="4" height="18" rx="1" />
          <rect x="15" y="3" width="4" height="18" rx="1" />
        </svg>
      ) : (
        <svg width={sz * 0.38} height={sz * 0.38} viewBox="0 0 24 24" fill="#451a03" style={{ marginLeft: sz * 0.04 }}>
          <polygon points="6,3 20,12 6,21" />
        </svg>
      )}
    </button>
  );

  // Volume control
  const volumeControl = (width = 80) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button
        onClick={() => setVolume((v) => (v > 0 ? 0 : 80))}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
        aria-label={volume === 0 ? "Unmute" : "Mute"}
      >
        {volume === 0 ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
        )}
      </button>
      <input
        type="range" min="0" max="100" value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className="embed-volume"
        style={{ width, height: 4 }}
        aria-label="Volume"
      />
    </div>
  );

  // Artwork with fallback
  const artwork = (sz: number, radius = 12) => (
    <div style={{
      width: sz, height: sz, borderRadius: radius, overflow: "hidden", flexShrink: 0,
      background: "linear-gradient(135deg, #451a03 0%, #78350f 100%)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    }}>
      {artworkUrl ? (
        <img src={artworkUrl} alt={trackTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src="/logos/ncr-logo.png" alt="NCR" style={{ width: sz * 0.5, height: sz * 0.5, objectFit: "contain", opacity: 0.5 }} />
        </div>
      )}
    </div>
  );

  // ─── COMPACT: 320×80 ───
  if (size === "compact") {
    return (
      <div style={{
        width: 320, height: 80, borderRadius: 14, overflow: "hidden",
        background: "linear-gradient(135deg, #451a03 0%, #78350f 50%, #9a3412 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex", alignItems: "center", padding: "0 12px", gap: 10,
        color: "#fff",
      }}>
        {audioEl}

        {/* Mini artwork */}
        {artwork(48, 8)}

        {/* Track info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <img src="/logos/ncr-logo.png" alt="NCR" style={{ height: 16, width: "auto", objectFit: "contain" }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#fde68a", letterSpacing: "0.05em" }}>NORTH COUNTRY RADIO</span>
            {statusBadge(true)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fef3c7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {showError ? "Stream Unavailable" : showLoading ? "Connecting..." : trackTitle}
          </div>
          <div style={{ fontSize: 11, color: "rgba(253,230,138,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {showError ? "Tap play to retry" : showActive ? trackArtist : "Americana & Country"}
          </div>
        </div>

        {/* Play button */}
        {playBtn(40)}
      </div>
    );
  }

  // ─── CARD: 320×200 ───
  if (size === "card") {
    return (
      <div style={{
        width: 320, height: 200, borderRadius: 16, overflow: "hidden",
        background: "linear-gradient(180deg, #451a03 0%, #78350f 60%, #9a3412 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex", flexDirection: "column",
        color: "#fff",
      }}>
        {audioEl}

        {/* Station header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 16px 0" }}>
          <img src="/logos/ncr-logo.png" alt="NCR" style={{ height: 18, width: "auto", objectFit: "contain" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fde68a", letterSpacing: "0.04em" }}>NORTH COUNTRY RADIO</span>
          {statusBadge(true)}
        </div>

        {/* Main content: artwork + info */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "8px 16px", gap: 14 }}>
          {artwork(90, 12)}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {showError ? "Stream Unavailable" : showLoading ? "Connecting..." : trackTitle}
            </div>
            <div style={{ fontSize: 12, color: "rgba(253,230,138,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 3 }}>
              {showError ? "Tap play to retry" : showActive ? trackArtist : "Americana & Country"}
            </div>
            {showActive && djName && (
              <div style={{ fontSize: 11, color: "rgba(253,230,138,0.5)", marginTop: 3 }}>DJ {djName}</div>
            )}
            {showActive && listenerCount != null && (
              <div style={{ fontSize: 10, color: "rgba(253,230,138,0.4)", marginTop: 2 }}>
                {listenerCount.toLocaleString()} listener{listenerCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Controls bar */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 16px 12px", gap: 10 }}>
          {playBtn(42)}
          {eqBars(5, 16)}
          <div style={{ flex: 1 }} />
          {volumeControl(64)}
          <a
            href="https://truefans-radio.netlify.app"
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 8, color: "rgba(253,230,138,0.4)", textDecoration: "none", lineHeight: 1.2 }}
          >
            Powered by<br />TrueFans
          </a>
        </div>
      </div>
    );
  }

  // ─── FULL: 320×440 (matches /player layout) ───
  return (
    <div style={{
      width: 320, height: 440, borderRadius: 20, overflow: "hidden",
      background: "linear-gradient(180deg, #451a03 0%, #78350f 40%, #7c2d12 70%, #9a3412 100%)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      color: "#fff",
    }}>
      {audioEl}

      {/* Station branding */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 16, paddingBottom: 6 }}>
        <img src="/logos/ncr-logo.png" alt="NCR" style={{ height: 24, width: "auto", objectFit: "contain" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fde68a", letterSpacing: "0.04em" }}>North Country Radio</span>
        {statusBadge()}
      </div>

      {/* Album artwork — large, centered */}
      <div style={{ padding: "8px 0 12px", flexShrink: 0 }}>
        {artwork(180, 16)}
      </div>

      {/* Track info */}
      <div style={{ textAlign: "center", width: "100%", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {showError ? "Stream Unavailable" : showLoading ? "Connecting..." : trackTitle}
        </div>
        <div style={{ fontSize: 13, color: "rgba(253,230,138,0.75)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {showError ? "Tap play to retry" : showLoading ? "Buffering stream..." : trackArtist}
        </div>
      </div>

      {/* DJ + listener count */}
      {showActive && (djName || listenerCount != null) && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, fontSize: 11, color: "rgba(253,230,138,0.5)" }}>
          {djName && <span>DJ {djName}</span>}
          {listenerCount != null && (
            <span>{listenerCount.toLocaleString()} listener{listenerCount !== 1 ? "s" : ""}</span>
          )}
        </div>
      )}

      {/* Equalizer */}
      <div style={{ padding: "8px 0" }}>
        {eqBars(7, 20)}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Play button */}
      <div style={{ paddingBottom: 12 }}>
        {playBtn(60)}
      </div>

      {/* Volume */}
      <div style={{ paddingBottom: 8, width: "100%", display: "flex", justifyContent: "center" }}>
        {volumeControl(120)}
      </div>

      {/* Powered by link */}
      <a
        href="https://truefans-radio.netlify.app/listen/register"
        target="_blank" rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 10, color: "rgba(253,230,138,0.4)", textDecoration: "none",
          paddingBottom: 14, transition: "color 0.2s",
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Open Full Site
      </a>
    </div>
  );
}

const styles = `
@keyframes eq {
  0% { height: 3px; }
  100% { height: 18px; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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
  background: rgba(120,53,15,0.5);
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
  background: #fbbf24;
  cursor: pointer;
}
.embed-volume::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fbbf24;
  border: none;
  cursor: pointer;
}
`;
