"use client";

import { useState, useEffect, useCallback } from "react";

const NOW_PLAYING_URL = "/api/now-playing";
const POLL_INTERVAL = 10_000;

interface NowPlaying {
  title: string;
  artist_name: string;
  artwork_url: string;
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

function darkenHex(hex: string, pct: number): string {
  const clean = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(clean.substring(0, 2), 16) * (1 - pct)));
  const g = Math.max(0, Math.round(parseInt(clean.substring(2, 4), 16) * (1 - pct)));
  const b = Math.max(0, Math.round(parseInt(clean.substring(4, 6), 16) * (1 - pct)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function lightenHex(hex: string, pct: number): string {
  const clean = hex.replace("#", "");
  const r = Math.min(255, Math.round(parseInt(clean.substring(0, 2), 16) + (255 - parseInt(clean.substring(0, 2), 16)) * pct));
  const g = Math.min(255, Math.round(parseInt(clean.substring(2, 4), 16) + (255 - parseInt(clean.substring(2, 4), 16)) * pct));
  const b = Math.min(255, Math.round(parseInt(clean.substring(4, 6), 16) + (255 - parseInt(clean.substring(4, 6), 16)) * pct));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default function EmbedNowPlayingPage() {
  const theme = useSearchParam("theme", "dark");
  const accentColor = useSearchParam("color", "#f59e0b");
  const bgColor = useSearchParam("bg", theme === "light" ? "#ffffff" : "#1a1a2e");

  const isDark = theme !== "light";

  const textPrimary = isDark ? "#ffffff" : "#111827";
  const textSecondary = isDark ? "rgba(255,255,255,0.65)" : "rgba(17,24,39,0.6)";
  const textMuted = isDark ? "rgba(255,255,255,0.35)" : "rgba(17,24,39,0.35)";
  const bgGradient = isDark
    ? `linear-gradient(135deg, ${darkenHex(bgColor, 0.15)} 0%, ${bgColor} 100%)`
    : `linear-gradient(135deg, ${bgColor} 0%, ${darkenHex(bgColor, 0.02)} 100%)`;
  const artworkFallbackBg = isDark
    ? `linear-gradient(135deg, ${darkenHex(accentColor, 0.6)} 0%, ${darkenHex(accentColor, 0.3)} 100%)`
    : `linear-gradient(135deg, ${lightenHex(accentColor, 0.7)} 0%, ${lightenHex(accentColor, 0.5)} 100%)`;

  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch(NOW_PLAYING_URL, { cache: "no-store" });
      if (res.ok) setNowPlaying(await res.json());
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  const trackTitle = nowPlaying?.title || "TrueFans Radio";
  const trackArtist = nowPlaying?.artist_name || "Live Radio";
  const djName = nowPlaying?.dj_name;
  const artworkUrl = nowPlaying?.artwork_url;
  const isOnAir = nowPlaying?.status === "on-air";

  return (
    <>
      <style>{`
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
      `}</style>
      <div style={{
        width: "100%",
        maxWidth: 400,
        height: 60,
        borderRadius: 10,
        overflow: "hidden",
        background: bgGradient,
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 10,
        color: textPrimary,
        boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.25)" : "0 1px 8px rgba(0,0,0,0.06)",
        border: isDark ? "none" : "1px solid rgba(0,0,0,0.08)",
        boxSizing: "border-box",
      }}>
        {/* Artwork */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          overflow: "hidden",
          flexShrink: 0,
          background: artworkFallbackBg,
        }}>
          {artworkUrl ? (
            <img src={artworkUrl} alt={trackTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
          )}
        </div>

        {/* Track info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: textPrimary,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            lineHeight: 1.3,
          }}>
            {trackTitle}
          </div>
          <div style={{
            fontSize: 11, color: textSecondary,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            lineHeight: 1.3,
          }}>
            {trackArtist}
            {djName && (
              <span style={{ color: textMuted }}> &middot; DJ {djName}</span>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          flexShrink: 0,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: isOnAir ? "#4ade80" : "#6b7280",
            animation: isOnAir ? "pulse 2s infinite" : undefined,
          }} />
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: isOnAir ? "#4ade80" : "#6b7280",
            textTransform: "uppercase" as const,
            letterSpacing: "0.05em",
          }}>
            {isOnAir ? "LIVE" : "OFF"}
          </span>
        </div>
      </div>

      {/* Powered by */}
      <div style={{
        width: "100%", maxWidth: 400,
        textAlign: "center", padding: "3px 0",
      }}>
        <a
          href="https://truefans-radio.netlify.app"
          target="_blank" rel="noopener noreferrer"
          style={{
            fontSize: 8, color: textMuted, textDecoration: "none",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          Powered by TrueFans
        </a>
      </div>
    </>
  );
}
