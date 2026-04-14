"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Radio,
  Music,
  Mic2,
  Users,
  Clock,
  Wifi,
  WifiOff,
  SkipForward,
  Volume2,
  ListMusic,
  Activity,
  RefreshCw,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NowPlaying {
  title: string;
  artist_name: string;
  artwork_url: string | null;
  listener_count: number;
  dj_name: string | null;
  station: string;
  status?: string;
  hourOfDay?: number;
}

interface PlayoutSlot {
  type: string;
  title?: string;
  artist?: string;
  artistName?: string;
  duration?: number;
  durationSec?: number;
  url?: string;
  groupId?: string;
}

interface PlayoutHour {
  slots: PlayoutSlot[];
  djName?: string;
  hourOfDay?: number;
  date?: string;
  stationId?: string;
}

interface RecentTrack {
  title: string;
  artist: string;
  playedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatClock(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

function slotTypeIcon(type: string) {
  switch (type) {
    case "song":
      return <Music className="w-4 h-4 text-emerald-400" />;
    case "voice_break":
    case "voice_track":
      return <Mic2 className="w-4 h-4 text-amber-400" />;
    case "feature":
      return <Activity className="w-4 h-4 text-purple-400" />;
    case "imaging":
    case "sweeper":
    case "station_id":
      return <Radio className="w-4 h-4 text-cyan-400" />;
    default:
      return <Volume2 className="w-4 h-4 text-zinc-500" />;
  }
}

function slotTypeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function hourLabel(hour: number): string {
  const labels: Record<number, string> = {
    6: "Morning Drive",
    7: "Morning Drive",
    8: "Morning Drive",
    9: "Mid-Morning",
    10: "Mid-Morning",
    11: "Mid-Morning",
    12: "Midday",
    13: "Midday",
    14: "Afternoon",
    15: "Afternoon",
    16: "Afternoon Drive",
    17: "Afternoon Drive",
    18: "Evening",
    19: "Evening",
    20: "Night",
    21: "Night",
    22: "Late Night",
    23: "Late Night",
    0: "Overnight",
    1: "Overnight",
    2: "Overnight",
    3: "Overnight",
    4: "Early Morning",
    5: "Early Morning",
  };
  const ampm = hour === 0 ? "12AM" : hour < 12 ? `${hour}AM` : hour === 12 ? "12PM" : `${hour - 12}PM`;
  return `${labels[hour] || "On Air"} ${ampm}`;
}

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function PulsingDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
    </span>
  );
}

function OnAirBanner({ data }: { data: NowPlaying | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    const iv = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(iv);
  }, [data?.title, data?.artist_name]);

  if (!data) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex items-center justify-center min-h-[260px]">
        <div className="text-zinc-600 flex items-center gap-3">
          <WifiOff className="w-6 h-6" />
          <span className="text-lg">Connecting to stream...</span>
        </div>
      </div>
    );
  }

  const isOnAir = data.status !== "off-air";
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
      {/* Subtle glow effect */}
      {isOnAir && (
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Artwork */}
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-xl bg-zinc-800 border border-zinc-700 flex-shrink-0 overflow-hidden">
          {data.artwork_url ? (
            <img
              src={data.artwork_url}
              alt={`${data.title} artwork`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-16 h-16 text-zinc-700" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* ON AIR badge */}
          <div className="flex items-center gap-3 mb-4">
            {isOnAir ? (
              <span className="inline-flex items-center gap-2 bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full">
                <PulsingDot />
                ON AIR
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full">
                <WifiOff className="w-3 h-3" />
                OFF AIR
              </span>
            )}
            {data.listener_count > 0 && (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                <Users className="w-4 h-4" />
                {data.listener_count} {data.listener_count === 1 ? "listener" : "listeners"}
              </span>
            )}
          </div>

          {/* Title + Artist */}
          <h1 className="text-2xl md:text-3xl font-bold text-white truncate leading-tight">
            {data.title}
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mt-1 truncate">
            {data.artist_name}
          </p>

          {/* DJ */}
          {data.dj_name && (
            <p className="text-sm text-amber-400/80 mt-3 flex items-center gap-1.5">
              <Mic2 className="w-4 h-4" />
              with {data.dj_name}
            </p>
          )}

          {/* Elapsed */}
          <div className="mt-4 flex items-center gap-3">
            <span className="font-mono text-sm text-zinc-500 tabular-nums">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")} elapsed
            </span>
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden max-w-xs">
              <div
                className="h-full bg-emerald-500/60 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((elapsed / 240) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UpNextQueue({ slots }: { slots: PlayoutSlot[] }) {
  if (slots.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-4">
          <SkipForward className="w-4 h-4" />
          Up Next
        </h2>
        <p className="text-zinc-600 text-sm text-center py-8">No upcoming items</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-4">
        <SkipForward className="w-4 h-4 text-emerald-400" />
        Up Next
      </h2>
      <div className="space-y-1">
        {slots.map((slot, i) => {
          const dur = slot.durationSec || slot.duration || 0;
          const durStr = dur > 0
            ? `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, "0")}`
            : "";
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group"
            >
              <span className="text-zinc-600 font-mono text-xs w-5 text-right">{i + 1}</span>
              {slotTypeIcon(slot.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">
                  {slot.title || slotTypeLabel(slot.type)}
                </p>
                {(slot.artist || slot.artistName) && (
                  <p className="text-xs text-zinc-500 truncate">
                    {slot.artist || slot.artistName}
                  </p>
                )}
              </div>
              <span className="text-xs text-zinc-600 font-mono tabular-nums">{durStr}</span>
              <span className="text-[10px] text-zinc-700 uppercase tracking-wide w-16 text-right">
                {slotTypeLabel(slot.type)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentPlays({ tracks }: { tracks: RecentTrack[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-4">
        <ListMusic className="w-4 h-4 text-amber-400" />
        Recent Plays
      </h2>
      {tracks.length === 0 ? (
        <p className="text-zinc-600 text-sm text-center py-8">No recent plays</p>
      ) : (
        <div className="space-y-1">
          {tracks.map((t, i) => (
            <div
              key={`${t.title}-${t.playedAt}-${i}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <Music className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 truncate">{t.title}</p>
                <p className="text-xs text-zinc-500 truncate">{t.artist}</p>
              </div>
              <span className="text-xs text-zinc-600 font-mono tabular-nums flex-shrink-0">
                {formatTimeAgo(t.playedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StationVitals({
  np,
  totalSongs,
  streamOnline,
}: {
  np: NowPlaying | null;
  totalSongs: number;
  streamOnline: boolean;
}) {
  const stats = [
    {
      label: "Listeners",
      value: np?.listener_count ?? 0,
      icon: <Users className="w-5 h-5" />,
      color: "text-emerald-400",
    },
    {
      label: "Songs Today",
      value: totalSongs,
      icon: <Music className="w-5 h-5" />,
      color: "text-blue-400",
    },
    {
      label: "Active DJ",
      value: np?.dj_name || "AutoDJ",
      icon: <Mic2 className="w-5 h-5" />,
      color: "text-amber-400",
    },
    {
      label: "Stream",
      value: streamOnline ? "Online" : "Offline",
      icon: streamOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />,
      color: streamOnline ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "Current Slot",
      value: np?.hourOfDay !== undefined ? hourLabel(np.hourOfDay) : "--",
      icon: <Clock className="w-5 h-5" />,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <span className={s.color}>{s.icon}</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">{s.label}</span>
          </div>
          <span className="text-xl font-bold text-zinc-100 truncate">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function StudioDashboard() {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [upNext, setUpNext] = useState<PlayoutSlot[]>([]);
  const [recentPlays, setRecentPlays] = useState<RecentTrack[]>([]);
  const [totalSongs, setTotalSongs] = useState(0);
  const [streamOnline, setStreamOnline] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const recentPlaysRef = useRef<RecentTrack[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      // Fetch now-playing
      const npRes = await fetch("/api/now-playing", { cache: "no-store" });
      if (npRes.ok) {
        const np: NowPlaying = await npRes.json();
        setNowPlaying(np);
        setStreamOnline(np.status !== "off-air");

        // Build recent plays from successive now-playing polls
        // Add current track if it's new
        const prev = recentPlaysRef.current;
        if (
          np.title &&
          np.title !== "Music" &&
          (prev.length === 0 || prev[0].title !== np.title || prev[0].artist !== np.artist_name)
        ) {
          const updated = [
            { title: np.title, artist: np.artist_name, playedAt: new Date().toISOString() },
            ...prev,
          ].slice(0, 10);
          recentPlaysRef.current = updated;
          setRecentPlays(updated);
        }

        // Fetch hour playlist for up-next queue
        if (np.hourOfDay !== undefined) {
          try {
            const today = new Date().toISOString().split("T")[0];
            // We need stationId. Try fetching it from the playout endpoint.
            // Use a simple approach: fetch with station info from now-playing.
            const hourRes = await fetch(
              `/api/playout/hour?stationId=default&date=${today}&hour=${np.hourOfDay}`,
              { cache: "no-store" }
            );
            if (hourRes.ok) {
              const hourData: PlayoutHour = await hourRes.json();
              if (hourData.slots) {
                // Skip items that likely already played (rough heuristic: first few)
                // Show next 5 upcoming slots that are songs or voice breaks
                const upcoming = hourData.slots.slice(0, 8).slice(-5);
                setUpNext(upcoming);
                // Count songs for "songs today" stat
                const songCount = hourData.slots.filter((s) => s.type === "song").length;
                setTotalSongs((prev) => Math.max(prev, songCount));
              }
            }
          } catch {
            // Hour playlist not available
          }
        }
      } else {
        setStreamOnline(false);
      }
    } catch {
      setStreamOnline(false);
    }

    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const iv = setInterval(fetchAll, 10_000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // Clock tick every second
  useEffect(() => {
    const iv = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-red-500" />
            <div>
              <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Live Studio</h1>
              <p className="text-xs text-zinc-500">
                {nowPlaying?.station || "TrueFans Radio"} Control Room
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live clock */}
            <span className="font-mono text-sm text-emerald-400 tabular-nums tracking-wider">
              {formatClock(clock)}
            </span>

            {/* Stream status indicator */}
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                streamOnline
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              {streamOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {streamOnline ? "LIVE" : "OFFLINE"}
            </span>

            {/* Refresh button */}
            <button
              onClick={() => {
                setLoading(true);
                fetchAll();
              }}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
              title="Refresh now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            {lastRefresh && (
              <span className="text-[10px] text-zinc-700 font-mono">
                {formatClock(lastRefresh)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Station Vitals */}
        <StationVitals np={nowPlaying} totalSongs={totalSongs} streamOnline={streamOnline} />

        {/* On Air + Up Next */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <OnAirBanner data={nowPlaying} />
          </div>
          <div className="lg:col-span-1">
            <UpNextQueue slots={upNext} />
          </div>
        </div>

        {/* Recent Plays */}
        <RecentPlays tracks={recentPlays} />

        {/* Footer info */}
        <div className="text-center py-4">
          <p className="text-[10px] text-zinc-800 font-mono uppercase tracking-widest">
            Auto-refreshing every 10s
          </p>
        </div>
      </main>
    </div>
  );
}
