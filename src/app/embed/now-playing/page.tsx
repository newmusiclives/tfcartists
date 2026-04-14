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

export default function EmbedNowPlayingPage() {
  const theme = useSearchParam("theme", "dark");
  const accentColor = normalizeHex(useSearchParam("color", "f59e0b"));
  const bgColor = normalizeHex(useSearchParam("bg", theme === "light" ? "ffffff" : "1a1a2e"));
  const isDark = theme !== "light";

  const textPrimary = isDark ? "#ffffff" : "#0f172a";
  const textSecondary = isDark ? "rgba(255,255,255,0.72)" : "rgba(15,23,42,0.64)";
  const textMuted = isDark ? "rgba(255,255,255,0.48)" : "rgba(15,23,42,0.44)";
  const cardBg = isDark
    ? `linear-gradient(135deg, ${mix(bgColor, -0.25)} 0%, ${bgColor} 55%, ${mix(accentColor, -0.55)} 140%)`
    : `linear-gradient(135deg, ${bgColor} 0%, ${mix(accentColor, 0.85)} 140%)`;
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const accentGlow = `0 0 0 1px ${accentColor}33, 0 8px 24px -8px ${accentColor}55`;

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

  const stationName = nowPlaying?.station || "TrueFans Radio";
  const trackTitle = nowPlaying?.title || "Loading…";
  const trackArtist = nowPlaying?.artist_name || "";
  const djName = nowPlaying?.dj_name;
  const artworkUrl = nowPlaying?.artwork_url;
  const isOnAir = nowPlaying?.status === "on-air";

  return (
    <>
      <style>{`
        @keyframes np-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes np-eq-1 { 0%, 100% { height: 4px; } 50% { height: 14px; } }
        @keyframes np-eq-2 { 0%, 100% { height: 10px; } 50% { height: 3px; } }
        @keyframes np-eq-3 { 0%, 100% { height: 6px; } 50% { height: 16px; } }
        @keyframes np-spin { to { transform: rotate(360deg); } }
        .np-art-active { animation: np-spin 20s linear infinite; }
        body { margin: 0; background: transparent; }
      `}</style>
      <div style={{
        width: "100%", maxWidth: 400, boxSizing: "border-box",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{
          background: cardBg,
          borderRadius: 14,
          padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: isDark
            ? "0 10px 30px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 8px 24px -12px rgba(15,23,42,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
          border: `1px solid ${borderColor}`,
          position: "relative", overflow: "hidden",
        }}>
          {/* Artwork */}
          <div style={{
            position: "relative", flexShrink: 0,
            width: 56, height: 56, borderRadius: "50%",
            background: `linear-gradient(135deg, ${mix(accentColor, -0.2)}, ${mix(accentColor, -0.55)})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: accentGlow,
          }}
          className={isOnAir ? "np-art-active" : ""}>
            {artworkUrl ? (
              <img src={artworkUrl} alt={trackTitle} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            )}
            <div style={{
              position: "absolute", inset: "40%", borderRadius: "50%",
              background: isDark ? "#000" : "#fff",
              boxShadow: `0 0 0 2px ${accentColor}`,
            }} />
          </div>

          {/* Track info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: accentColor,
              textTransform: "uppercase", letterSpacing: "0.08em",
              marginBottom: 2, display: "flex", alignItems: "center", gap: 6,
              minWidth: 0,
            }}>
              <span style={{
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                minWidth: 0, flex: "0 1 auto",
              }}>{stationName}</span>
              {isOnAir && (
                <span style={{
                  display: "inline-flex", alignItems: "flex-end", gap: 2, height: 10,
                  flexShrink: 0,
                }}>
                  <span style={{ width: 2, background: accentColor, animation: "np-eq-1 0.9s ease-in-out infinite" }} />
                  <span style={{ width: 2, background: accentColor, animation: "np-eq-2 0.9s ease-in-out infinite 0.15s" }} />
                  <span style={{ width: 2, background: accentColor, animation: "np-eq-3 0.9s ease-in-out infinite 0.3s" }} />
                </span>
              )}
            </div>
            <div style={{
              fontSize: 13.5, fontWeight: 700, color: textPrimary, lineHeight: 1.25,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {trackTitle}
            </div>
            <div style={{
              fontSize: 11.5, color: textSecondary, lineHeight: 1.3, marginTop: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {trackArtist}
              {djName && <span style={{ color: textMuted }}> · {djName}</span>}
            </div>
          </div>

          {/* Live badge */}
          <div style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
            padding: "4px 8px", borderRadius: 999,
            background: isOnAir ? `${accentColor}22` : isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)",
            border: `1px solid ${isOnAir ? `${accentColor}55` : borderColor}`,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isOnAir ? "#4ade80" : "#94a3b8",
              animation: isOnAir ? "np-pulse 1.6s ease-in-out infinite" : undefined,
              boxShadow: isOnAir ? "0 0 8px #4ade80" : undefined,
            }} />
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
              color: isOnAir ? "#4ade80" : textMuted,
            }}>
              {isOnAir ? "LIVE" : "OFF"}
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
