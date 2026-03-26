"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface CityDot {
  city: string;
  region: string;
  count: number;
  x: number;
  y: number;
  /** Animation phase: 0 = hidden, 1 = appearing, 2 = steady */
  phase: number;
}

interface HeatmapData {
  citiesWithCoords: {
    city: string;
    region: string;
    count: number;
    x: number;
    y: number;
  }[];
  stats: {
    totalListeners: number;
    totalCities: number;
    mappedCities: number;
  };
}

function useSearchParam(name: string, fallback: string): string {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(name) || fallback);
  }, [name, fallback]);
  return value;
}

export default function EmbedHeatmapPage() {
  const stationId = useSearchParam("stationId", "");
  const sponsor = useSearchParam("sponsor", "");

  const [data, setData] = useState<HeatmapData | null>(null);
  const [dots, setDots] = useState<CityDot[]>([]);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const animationPhaseRef = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ period: "week" });
      if (stationId) params.set("stationId", stationId);
      const res = await fetch(`/api/embed/heatmap?${params}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json: HeatmapData = await res.json();
        setData(json);
        // Initialize all dots as hidden for staggered animation
        setDots(
          json.citiesWithCoords.map((c) => ({
            ...c,
            phase: 0,
          }))
        );
        animationPhaseRef.current = 0;
      }
    } catch {
      /* non-critical */
    }
  }, [stationId]);

  // Initial fetch + auto-refresh every 60s
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Staggered dot appearance animation
  useEffect(() => {
    if (dots.length === 0) return;

    const revealNext = () => {
      setDots((prev) => {
        const hiddenIdx = prev.findIndex((d) => d.phase === 0);
        if (hiddenIdx === -1) return prev;
        const next = [...prev];
        next[hiddenIdx] = { ...next[hiddenIdx], phase: 1 };
        // Transition to steady after a beat
        setTimeout(() => {
          setDots((p) => {
            const updated = [...p];
            if (updated[hiddenIdx]) {
              updated[hiddenIdx] = { ...updated[hiddenIdx], phase: 2 };
            }
            return updated;
          });
        }, 600);
        return next;
      });
    };

    // Reveal dots one by one, fast for first batch then slower
    const timers: ReturnType<typeof setTimeout>[] = [];
    dots.forEach((_, i) => {
      const delay = i < 10 ? i * 120 : 1200 + (i - 10) * 200;
      timers.push(setTimeout(revealNext, delay));
    });

    return () => timers.forEach(clearTimeout);
    // Only run on data refresh (dots length change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dots.length]);

  const maxCount = Math.max(...(dots.map((d) => d.count) || [1]), 1);

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.3); opacity: 0.5; }
        }
        @keyframes dotAppear {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(3); opacity: 0; }
        }
        .heatmap-dot {
          position: absolute;
          border-radius: 50%;
          cursor: pointer;
          transition: box-shadow 0.3s ease;
        }
        .heatmap-dot.phase-0 {
          transform: scale(0);
          opacity: 0;
        }
        .heatmap-dot.phase-1 {
          animation: dotAppear 0.6s ease-out forwards;
        }
        .heatmap-dot.phase-2 {
          opacity: 1;
        }
        .heatmap-dot .glow {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .heatmap-dot .ripple {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(74, 222, 128, 0.3);
          animation: ripple 3s ease-out infinite;
        }
        .tooltip {
          position: absolute;
          background: rgba(0, 0, 0, 0.85);
          color: #fff;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 50;
          border: 1px solid rgba(74, 222, 128, 0.3);
          backdrop-filter: blur(4px);
          transform: translate(-50%, -100%);
          margin-top: -8px;
        }
      `}</style>
      <div
        style={{
          width: "100%",
          height: "100vh",
          background: "linear-gradient(180deg, #09090b 0%, #0c0c10 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 8px rgba(74,222,128,0.6)",
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255,255,255,0.9)",
                letterSpacing: "0.02em",
              }}
            >
              Listener Heatmap
            </span>
          </div>
          {sponsor && (
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {sponsor}
            </span>
          )}
        </div>

        {/* Map Container */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            margin: "8px 12px",
            borderRadius: 12,
            background:
              "radial-gradient(ellipse 80% 60% at 50% 45%, rgba(74,222,128,0.03) 0%, transparent 70%)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* Subtle grid lines */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: 0.04,
            }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <line
                key={`h${i}`}
                x1="0"
                y1={`${(i + 1) * 5}%`}
                x2="100%"
                y2={`${(i + 1) * 5}%`}
                stroke="white"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <line
                key={`v${i}`}
                x1={`${(i + 1) * 5}%`}
                y1="0"
                x2={`${(i + 1) * 5}%`}
                y2="100%"
                stroke="white"
                strokeWidth="0.5"
              />
            ))}
          </svg>

          {/* US outline hint - simple border shape */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: "5%",
              width: "90%",
              height: "90%",
              opacity: 0.06,
            }}
          >
            <path
              d="M5,25 L8,20 L12,18 L18,15 L22,18 L28,16 L32,18 L38,16 L42,14 L48,15 L52,12 L58,14 L62,16 L68,14 L72,16 L78,18 L82,16 L88,20 L92,24 L90,28 L88,32 L90,36 L88,40 L85,44 L82,48 L80,52 L78,56 L76,60 L78,64 L80,68 L78,72 L75,76 L70,74 L65,72 L60,74 L55,72 L50,74 L45,76 L40,74 L35,72 L30,74 L25,72 L20,70 L15,68 L10,64 L8,58 L6,52 L4,46 L3,40 L4,34 L5,28 Z"
              fill="none"
              stroke="rgba(74,222,128,0.5)"
              strokeWidth="0.5"
            />
          </svg>

          {/* Dots */}
          {dots.map((dot) => {
            const size = Math.max(6, Math.min(24, 6 + (dot.count / maxCount) * 18));
            const intensity = 0.4 + (dot.count / maxCount) * 0.6;
            return (
              <div
                key={dot.city}
                className={`heatmap-dot phase-${dot.phase}`}
                style={{
                  left: `${dot.x}%`,
                  top: `${dot.y}%`,
                  width: size,
                  height: size,
                  marginLeft: -size / 2,
                  marginTop: -size / 2,
                  background: `rgba(74, 222, 128, ${intensity})`,
                  boxShadow: `0 0 ${size}px rgba(74, 222, 128, ${intensity * 0.6})`,
                }}
                onMouseEnter={() => setHoveredCity(dot.city)}
                onMouseLeave={() => setHoveredCity(null)}
              >
                <div
                  className="glow"
                  style={{
                    background: `rgba(74, 222, 128, ${intensity * 0.15})`,
                  }}
                />
                {dot.count > maxCount * 0.5 && <div className="ripple" />}
                {hoveredCity === dot.city && (
                  <div className="tooltip">
                    <strong>{dot.city}</strong>
                    {dot.region !== "Unknown" && `, ${dot.region}`}
                    <br />
                    <span style={{ color: "#4ade80" }}>
                      {dot.count} listener{dot.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {data && dots.length === 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.3)",
                fontSize: 14,
              }}
            >
              No listener location data yet
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", gap: 20 }}>
            <div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#4ade80",
                }}
              >
                {data?.stats.totalListeners ?? "---"}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  marginLeft: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Listeners
              </span>
            </div>
            <div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                {data?.stats.totalCities ?? "---"}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  marginLeft: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Cities
              </span>
            </div>
          </div>
          <a
            href="https://truefans-radio.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              textDecoration: "none",
              letterSpacing: "0.03em",
            }}
          >
            Powered by TrueFans Radio
          </a>
        </div>
      </div>
    </>
  );
}
