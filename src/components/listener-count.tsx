"use client";

import { useState, useEffect, useRef } from "react";
import { Headphones, TrendingUp } from "lucide-react";

interface ListenerCountProps {
  /** "compact" for player bar, "full" for homepage/station page */
  mode?: "compact" | "full";
  className?: string;
}

const POLL_INTERVAL = 15_000; // 15 seconds

export function ListenerCount({ mode = "compact", className = "" }: ListenerCountProps) {
  const [count, setCount] = useState<number | null>(null);
  const [peak, setPeak] = useState<number | null>(null);
  const [changed, setChanged] = useState(false);
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchCount() {
      try {
        const res = await fetch("/api/listeners/count", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();

        if (!active) return;

        const newCount = typeof data.count === "number" ? data.count : 0;
        const newPeak = typeof data.peak === "number" ? data.peak : 0;

        // Trigger pulse animation when count changes
        if (prevCountRef.current !== null && prevCountRef.current !== newCount) {
          setChanged(true);
          setTimeout(() => {
            if (active) setChanged(false);
          }, 700);
        }

        prevCountRef.current = newCount;
        setCount(newCount);
        setPeak(newPeak);
      } catch {
        // Silently ignore fetch errors
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Don't render anything until we have data
  if (count === null) return null;

  if (mode === "compact") {
    return (
      <div
        className={`flex items-center space-x-1.5 text-sm transition-all duration-300 ${
          changed ? "scale-110" : "scale-100"
        } ${className}`}
      >
        <Headphones
          className={`w-4 h-4 transition-colors duration-300 ${
            changed ? "text-green-400" : "text-amber-300/80"
          }`}
        />
        <span
          className={`tabular-nums font-medium transition-colors duration-300 ${
            changed ? "text-green-400" : "text-amber-300/80"
          }`}
        >
          {count.toLocaleString()}
        </span>
        <span className="text-amber-300/50 hidden xl:inline">listening</span>
      </div>
    );
  }

  // Full mode for homepage / station page
  return (
    <div
      className={`inline-flex flex-col items-center gap-1 ${className}`}
    >
      <div
        className={`flex items-center gap-2 transition-all duration-300 ${
          changed ? "scale-105" : "scale-100"
        }`}
      >
        <div className="relative">
          <Headphones
            className={`w-5 h-5 transition-colors duration-300 ${
              changed ? "text-green-500" : "text-amber-600"
            }`}
          />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <span
          className={`text-2xl sm:text-3xl font-bold tabular-nums transition-colors duration-300 ${
            changed ? "text-green-600" : "text-gray-900"
          }`}
        >
          {count.toLocaleString()}
        </span>
        <span className="text-sm text-gray-500">listening now</span>
      </div>
      {peak != null && peak > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <TrendingUp className="w-3 h-3" />
          <span>Peak today: {peak.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
