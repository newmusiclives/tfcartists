"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ---------- Types ---------- */
interface NowPlaying {
  title: string;
  artist_name: string;
  artwork_url: string | null;
  dj_name: string | null;
  station: string;
}

/* ---------- Constants ---------- */
const STREAM_URL = "/stream/americana-hq.mp3";
const NOW_PLAYING_URL = "/api/now-playing";
const POLL_MS = 15_000;

// Branding colors (amber-700 / amber-500 — matches DEFAULT_BRANDING)
const PRIMARY = "#78350f";
const SECONDARY = "#f59e0b";

/* ---------- Page ---------- */
export default function VisualizerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [prevNowPlaying, setPrevNowPlaying] = useState<NowPlaying | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [started, setStarted] = useState(false);

  /* ---------- Now-playing polling ---------- */
  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch(NOW_PLAYING_URL, { cache: "no-store" });
      if (!res.ok) return;
      const data: NowPlaying = await res.json();
      setNowPlaying((prev) => {
        const changed =
          !prev ||
          prev.title !== data.title ||
          prev.artist_name !== data.artist_name;
        if (changed && prev) {
          setPrevNowPlaying(prev);
          setTransitioning(true);
          setTimeout(() => setTransitioning(false), 600);
        }
        return data;
      });
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchNowPlaying();
    const id = setInterval(fetchNowPlaying, POLL_MS);
    return () => clearInterval(id);
  }, [fetchNowPlaying]);

  /* ---------- Audio + Web Audio API ---------- */
  const startAudio = useCallback(() => {
    if (started) return;
    setStarted(true);

    const audio = new Audio(STREAM_URL);
    audio.crossOrigin = "anonymous";
    audio.volume = 1;
    audioRef.current = audio;

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    audio.play().catch(() => {});
  }, [started]);

  /* ---------- Canvas render loop ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize handler
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Pre-compute gradient colors
    const primaryRGB = hexToRGB(PRIMARY);
    const secondaryRGB = hexToRGB(SECONDARY);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const { width, height } = canvas;

      // Dark background
      ctx.fillStyle = "#09090b"; // zinc-950
      ctx.fillRect(0, 0, width, height);

      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;

      if (!analyser || !dataArray) {
        // Draw idle bars
        drawIdleBars(ctx, width, height, primaryRGB, secondaryRGB);
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      const bufferLength = dataArray.length;

      // --- Frequency bars ---
      const barCount = Math.min(bufferLength, 128);
      const totalBarWidth = width * 0.85;
      const gap = 2;
      const barWidth = (totalBarWidth - gap * (barCount - 1)) / barCount;
      const startX = (width - totalBarWidth) / 2;
      const maxBarHeight = height * 0.55;
      const baseY = height * 0.65;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i] / 255;
        const barHeight = Math.max(val * maxBarHeight, 2);
        const x = startX + i * (barWidth + gap);
        const t = i / barCount;

        // Gradient color per bar from primary -> secondary
        const r = Math.round(primaryRGB.r + (secondaryRGB.r - primaryRGB.r) * t);
        const g = Math.round(primaryRGB.g + (secondaryRGB.g - primaryRGB.g) * t);
        const b = Math.round(primaryRGB.b + (secondaryRGB.b - primaryRGB.b) * t);
        const alpha = 0.6 + val * 0.4;

        // Glow effect
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
        ctx.shadowBlur = 8;

        // Bar gradient (bottom to top)
        const grad = ctx.createLinearGradient(x, baseY, x, baseY - barHeight);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`);
        ctx.fillStyle = grad;

        // Rounded top
        const radius = Math.min(barWidth / 2, 3);
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, baseY - barHeight + radius);
        ctx.quadraticCurveTo(x, baseY - barHeight, x + radius, baseY - barHeight);
        ctx.lineTo(x + barWidth - radius, baseY - barHeight);
        ctx.quadraticCurveTo(
          x + barWidth,
          baseY - barHeight,
          x + barWidth,
          baseY - barHeight + radius
        );
        ctx.lineTo(x + barWidth, baseY);
        ctx.closePath();
        ctx.fill();

        // Mirror reflection (subtle)
        ctx.shadowBlur = 0;
        const reflectionHeight = barHeight * 0.2;
        const reflGrad = ctx.createLinearGradient(x, baseY, x, baseY + reflectionHeight);
        reflGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
        reflGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = reflGrad;
        ctx.fillRect(x, baseY, barWidth, reflectionHeight);
      }

      ctx.shadowBlur = 0;
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* ---------- Cleanup audio on unmount ---------- */
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  /* ---------- Render ---------- */
  const displayTrack = transitioning ? prevNowPlaying : nowPlaying;
  const stationName = nowPlaying?.station || "TrueFans RADIO";

  return (
    <div
      className="fixed inset-0 bg-zinc-950 overflow-hidden cursor-none select-none"
      onClick={startAudio}
    >
      {/* Full-screen canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Click-to-start overlay */}
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center animate-pulse">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-600/20 flex items-center justify-center border border-amber-600/40">
              <svg
                className="w-8 h-8 text-amber-500 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-zinc-400 text-sm tracking-wide uppercase">
              Click anywhere to start
            </p>
          </div>
        </div>
      )}

      {/* Bottom overlay: now-playing info */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        {/* Gradient fade from transparent to dark */}
        <div className="h-40 bg-gradient-to-t from-zinc-950/95 to-transparent" />
        <div className="bg-zinc-950/95 px-10 pb-10 -mt-px">
          <div className="flex items-end gap-6 max-w-screen-xl mx-auto">
            {/* Mini EQ bars */}
            <div className="flex items-end gap-[3px] h-8 mb-1 flex-shrink-0">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full bg-amber-500"
                  style={{
                    animation: started
                      ? `eqBounce ${0.4 + i * 0.1}s ease-in-out infinite alternate`
                      : "none",
                    height: started ? undefined : "4px",
                  }}
                />
              ))}
            </div>

            {/* Track info */}
            <div
              className="flex-1 min-w-0 transition-opacity duration-500"
              style={{ opacity: transitioning ? 0 : 1 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white truncate leading-tight">
                {displayTrack?.title || "Waiting for stream..."}
              </h1>
              <p className="text-lg md:text-xl text-amber-400 truncate mt-1">
                {displayTrack?.artist_name || ""}
              </p>
            </div>

            {/* Station + DJ */}
            <div className="flex-shrink-0 text-right mb-1">
              <p className="text-sm font-semibold text-white/90 tracking-wide uppercase">
                {stationName}
              </p>
              {displayTrack?.dj_name && (
                <p className="text-xs text-zinc-400 mt-0.5">
                  DJ {displayTrack.dj_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EQ bounce keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes eqBounce {
          0% { height: 4px; }
          100% { height: 28px; }
        }
      `}} />
    </div>
  );
}

/* ---------- Helpers ---------- */

function hexToRGB(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function drawIdleBars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  primaryRGB: { r: number; g: number; b: number },
  secondaryRGB: { r: number; g: number; b: number }
) {
  const barCount = 128;
  const totalBarWidth = width * 0.85;
  const gap = 2;
  const barWidth = (totalBarWidth - gap * (barCount - 1)) / barCount;
  const startX = (width - totalBarWidth) / 2;
  const baseY = height * 0.65;
  const time = Date.now() / 1000;

  for (let i = 0; i < barCount; i++) {
    const t = i / barCount;
    const wave = Math.sin(time * 1.5 + i * 0.15) * 0.3 + 0.3;
    const barHeight = Math.max(wave * 20, 2);
    const x = startX + i * (barWidth + gap);

    const r = Math.round(primaryRGB.r + (secondaryRGB.r - primaryRGB.r) * t);
    const g = Math.round(primaryRGB.g + (secondaryRGB.g - primaryRGB.g) * t);
    const b = Math.round(primaryRGB.b + (secondaryRGB.b - primaryRGB.b) * t);

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
    ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
  }
}
