"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Loader2,
  Music,
  Lightbulb,
  BarChart3,
  Heart,
  AlertTriangle,
  CheckCircle,
  Search,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface GenreEntry {
  name: string;
  count: number;
  pct: number;
}

interface BpmRange {
  label: string;
  count: number;
}

interface EnergyBucket {
  label: string;
  count: number;
}

interface StationProfile {
  totalSongs: number;
  genres: GenreEntry[];
  avgBpm: number | null;
  bpmRanges: BpmRange[];
  avgEnergy: number | null;
  energyBuckets: EnergyBucket[];
  vocalGenders: GenreEntry[];
  tempos: GenreEntry[];
}

interface SimilarSong {
  id: string;
  title: string;
  artistName: string;
  genre: string | null;
  bpm: number | null;
  energy: number | null;
  playCount: number;
  rotationCategory: string;
  similarityScore: number;
}

interface ExpansionSuggestion {
  artistName: string;
  genre: string;
  reason: string;
  alreadyInLibrary: boolean;
}

interface TrendingSong {
  id: string;
  title: string;
  artistName: string;
  genre: string | null;
  rotationCategory: string;
  recentPlays: number;
  priorPlays: number;
  velocityPct: number;
  direction: "up" | "down" | "flat";
}

interface RotationCategory {
  category: string;
  label: string;
  count: number;
  pct: number;
  avgPlays: number;
  idealRange: string;
  status: "healthy" | "low" | "high";
}

interface RotationHealth {
  totalSongs: number;
  categories: RotationCategory[];
  overallHealthy: boolean;
}

// ─── Color palette for charts ───────────────────────────────────────────────

const GENRE_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#06b6d4", "#f97316", "#6366f1", "#14b8a6", "#e11d48",
  "#84cc16", "#a855f7",
];

const VOCAL_COLORS: Record<string, string> = {
  male: "#3b82f6",
  female: "#ec4899",
  mixed: "#8b5cf6",
  instrumental: "#10b981",
  unknown: "#71717a",
};

const ROTATION_COLORS: Record<string, string> = {
  A: "#ef4444",
  B: "#f59e0b",
  C: "#3b82f6",
  D: "#10b981",
  E: "#8b5cf6",
};

// ─── Helper: simple stationId ───────────────────────────────────────────────

function useStationId() {
  const [stationId, setStationId] = useState<string | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem("stationId") || localStorage.getItem("selectedStationId");
    setStationId(stored);
  }, []);
  return stationId;
}

// ─── Mini donut chart (SVG) ─────────────────────────────────────────────────

function DonutChart({
  data,
  colors,
  size = 140,
}: {
  data: { name: string; pct: number }[];
  colors: Record<string, string> | string[];
  size?: number;
}) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const getColor = (name: string, index: number) => {
    if (Array.isArray(colors)) return colors[index % colors.length];
    return colors[name] || "#71717a";
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((entry, i) => {
        const strokeLen = (entry.pct / 100) * circumference;
        const segment = (
          <circle
            key={entry.name}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(entry.name, i)}
            strokeWidth={20}
            strokeDasharray={`${strokeLen} ${circumference - strokeLen}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all duration-700"
          />
        );
        offset += strokeLen;
        return segment;
      })}
      <circle cx={size / 2} cy={size / 2} r={radius - 15} fill="#09090b" />
    </svg>
  );
}

// ─── Section wrapper with refresh ───────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  loading,
  onRefresh,
  children,
  badge,
}: {
  title: string;
  icon: React.ElementType;
  loading: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
            {title}
          </h2>
          {badge}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
  const stationId = useStationId();

  const [profile, setProfile] = useState<StationProfile | null>(null);
  const [similar, setSimilar] = useState<SimilarSong[]>([]);
  const [suggestions, setSuggestions] = useState<ExpansionSuggestion[]>([]);
  const [trending, setTrending] = useState<TrendingSong[]>([]);
  const [rotationHealth, setRotationHealth] = useState<RotationHealth | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const [expandError, setExpandError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!stationId) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/recommendations?stationId=${stationId}&type=profile`);
      const data = await res.json();
      setProfile(data.profile || null);
    } catch { /* ignore */ }
    setLoadingProfile(false);
  }, [stationId]);

  const fetchSimilar = useCallback(async () => {
    if (!stationId) return;
    setLoadingSimilar(true);
    try {
      const res = await fetch(`/api/recommendations?stationId=${stationId}&type=similar`);
      const data = await res.json();
      setSimilar(data.recommendations || []);
    } catch { /* ignore */ }
    setLoadingSimilar(false);
  }, [stationId]);

  const fetchSuggestions = useCallback(async () => {
    if (!stationId) return;
    setLoadingSuggestions(true);
    setExpandError(null);
    try {
      const res = await fetch(`/api/recommendations?stationId=${stationId}&type=expand`);
      const data = await res.json();
      if (data.error) {
        setExpandError(data.error);
        setSuggestions([]);
      } else {
        setSuggestions(data.suggestions || []);
      }
    } catch { /* ignore */ }
    setLoadingSuggestions(false);
  }, [stationId]);

  const fetchTrending = useCallback(async () => {
    if (!stationId) return;
    setLoadingTrending(true);
    try {
      const res = await fetch(`/api/recommendations?stationId=${stationId}&type=trending`);
      const data = await res.json();
      setTrending(data.trending || []);
    } catch { /* ignore */ }
    setLoadingTrending(false);
  }, [stationId]);

  const fetchHealth = useCallback(async () => {
    if (!stationId) return;
    setLoadingHealth(true);
    try {
      const res = await fetch(`/api/recommendations?stationId=${stationId}&type=rotation-health`);
      const data = await res.json();
      setRotationHealth(data.health || null);
    } catch { /* ignore */ }
    setLoadingHealth(false);
  }, [stationId]);

  useEffect(() => {
    if (stationId) {
      fetchProfile();
      fetchSimilar();
      fetchTrending();
      fetchHealth();
      // Don't auto-fetch AI suggestions (costs API call)
    }
  }, [stationId, fetchProfile, fetchSimilar, fetchTrending, fetchHealth]);

  if (!stationId) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <SharedNav />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-zinc-200 mb-2">
            No Station Selected
          </h1>
          <p className="text-sm text-zinc-500">
            Select a station to view AI music recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">
              Music Discovery
            </h1>
          </div>
          <p className="text-sm text-zinc-400">
            AI-powered recommendations, hidden gems, and rotation analysis for
            your station.
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Station Profile ─────────────────────────────────────── */}
          <Section
            title="Station Profile"
            icon={BarChart3}
            loading={loadingProfile}
            onRefresh={fetchProfile}
          >
            {!profile ? (
              <EmptyMessage text="Loading station profile..." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Genre donut */}
                <div className="flex flex-col items-center">
                  <DonutChart
                    data={profile.genres.slice(0, 8)}
                    colors={GENRE_COLORS}
                  />
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mt-3 mb-2">
                    Genres ({profile.totalSongs} songs)
                  </h3>
                  <div className="space-y-1 w-full">
                    {profile.genres.slice(0, 6).map((g, i) => (
                      <div
                        key={g.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{
                              backgroundColor:
                                GENRE_COLORS[i % GENRE_COLORS.length],
                            }}
                          />
                          <span className="text-zinc-300 truncate max-w-[120px]">
                            {g.name}
                          </span>
                        </div>
                        <span className="text-zinc-500 font-mono">
                          {g.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Energy distribution */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                    Energy Distribution
                  </h3>
                  {profile.avgEnergy !== null && (
                    <div className="text-2xl font-bold text-white mb-3">
                      {profile.avgEnergy.toFixed(2)}{" "}
                      <span className="text-xs text-zinc-500 font-normal">
                        avg
                      </span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {profile.energyBuckets.map((b) => {
                      const maxCount = Math.max(
                        ...profile.energyBuckets.map((x) => x.count),
                        1
                      );
                      const pct = (b.count / maxCount) * 100;
                      return (
                        <div key={b.label}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-zinc-400">{b.label}</span>
                            <span className="text-zinc-500 font-mono">
                              {b.count}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BPM distribution */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                    BPM Distribution
                  </h3>
                  {profile.avgBpm !== null && (
                    <div className="text-2xl font-bold text-white mb-3">
                      {profile.avgBpm}{" "}
                      <span className="text-xs text-zinc-500 font-normal">
                        avg BPM
                      </span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {profile.bpmRanges.map((r) => {
                      const maxCount = Math.max(
                        ...profile.bpmRanges.map((x) => x.count),
                        1
                      );
                      const pct = (r.count / maxCount) * 100;
                      return (
                        <div key={r.label}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-zinc-400">{r.label}</span>
                            <span className="text-zinc-500 font-mono">
                              {r.count}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vocal gender donut */}
                <div className="flex flex-col items-center">
                  <DonutChart
                    data={profile.vocalGenders}
                    colors={VOCAL_COLORS}
                    size={120}
                  />
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mt-3 mb-2">
                    Vocal Gender
                  </h3>
                  <div className="space-y-1 w-full">
                    {profile.vocalGenders.map((v) => (
                      <div
                        key={v.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{
                              backgroundColor:
                                VOCAL_COLORS[v.name] || "#71717a",
                            }}
                          />
                          <span className="text-zinc-300 capitalize">
                            {v.name}
                          </span>
                        </div>
                        <span className="text-zinc-500 font-mono">
                          {v.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Two column layout for gems + expansion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Hidden Gems ────────────────────────────────────── */}
            <Section
              title="Hidden Gems"
              icon={Heart}
              loading={loadingSimilar}
              onRefresh={fetchSimilar}
              badge={
                similar.length > 0 ? (
                  <span className="ml-2 px-2 py-0.5 text-xs font-mono bg-purple-500/20 text-purple-400 rounded-full">
                    {similar.length}
                  </span>
                ) : null
              }
            >
              {similar.length === 0 ? (
                <EmptyMessage text="No hidden gems found yet. Add more songs to your library." />
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {similar.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-zinc-200 truncate">
                          {song.title}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {song.artistName}
                          {song.genre && (
                            <span className="ml-2 text-zinc-600">
                              {song.genre}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-xs font-mono text-zinc-500">
                          {song.playCount} plays
                        </span>
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span className="text-xs font-mono text-purple-400">
                            {song.similarityScore}
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${ROTATION_COLORS[song.rotationCategory] || "#71717a"}20`,
                            color:
                              ROTATION_COLORS[song.rotationCategory] ||
                              "#71717a",
                          }}
                        >
                          {song.rotationCategory}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* ── Expansion Suggestions (AI) ─────────────────────── */}
            <Section
              title="Expansion Suggestions"
              icon={Lightbulb}
              loading={loadingSuggestions}
              onRefresh={fetchSuggestions}
              badge={
                <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-400 rounded-full uppercase tracking-wide">
                  AI
                </span>
              }
            >
              {expandError ? (
                <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {expandError}
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-6">
                  <Lightbulb className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500 mb-3">
                    Get AI-powered suggestions for artists and genres to add to
                    your station.
                  </p>
                  <button
                    onClick={fetchSuggestions}
                    disabled={loadingSuggestions}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingSuggestions ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing...
                      </span>
                    ) : (
                      "Generate Suggestions"
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="text-sm font-medium text-zinc-200">
                            {s.artistName}
                          </span>
                          {s.alreadyInLibrary && (
                            <span className="ml-2 text-[10px] font-medium text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                              In Library
                            </span>
                          )}
                        </div>
                        <a
                          href={`/station-admin/music/import?search=${encodeURIComponent(s.artistName)}`}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors shrink-0"
                        >
                          <Search className="w-3 h-3" />
                          Import
                        </a>
                      </div>
                      <div className="text-xs text-zinc-500 mb-1">
                        {s.genre}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {s.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* ── Trending on Your Station ──────────────────────────── */}
          <Section
            title="Trending on Your Station"
            icon={TrendingUp}
            loading={loadingTrending}
            onRefresh={fetchTrending}
            badge={
              trending.length > 0 ? (
                <span className="ml-2 px-2 py-0.5 text-xs font-mono bg-emerald-500/20 text-emerald-400 rounded-full">
                  {trending.filter((t) => t.direction === "up").length} rising
                </span>
              ) : null
            }
          >
            {trending.length === 0 ? (
              <EmptyMessage text="No trending data yet. Play history is needed for velocity analysis." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-zinc-500 uppercase tracking-wide border-b border-zinc-800">
                      <th className="text-left py-2 px-2 font-medium">#</th>
                      <th className="text-left py-2 px-2 font-medium">Song</th>
                      <th className="text-left py-2 px-2 font-medium">
                        Artist
                      </th>
                      <th className="text-left py-2 px-2 font-medium">
                        Genre
                      </th>
                      <th className="text-right py-2 px-2 font-medium">
                        This Week
                      </th>
                      <th className="text-right py-2 px-2 font-medium">
                        Last Week
                      </th>
                      <th className="text-right py-2 px-2 font-medium">
                        Velocity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trending.slice(0, 15).map((song, i) => (
                      <tr
                        key={song.id}
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="py-2.5 px-2 text-xs font-mono text-zinc-500">
                          {i + 1}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="text-sm text-zinc-200 truncate block max-w-[200px]">
                            {song.title}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-sm text-zinc-400 truncate max-w-[150px]">
                          {song.artistName}
                        </td>
                        <td className="py-2.5 px-2">
                          {song.genre && (
                            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                              {song.genre}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right text-sm font-mono text-zinc-300">
                          {song.recentPlays}
                        </td>
                        <td className="py-2.5 px-2 text-right text-sm font-mono text-zinc-500">
                          {song.priorPlays}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <VelocityBadge
                            direction={song.direction}
                            pct={song.velocityPct}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* ── Rotation Health ───────────────────────────────────── */}
          <Section
            title="Rotation Health"
            icon={Music}
            loading={loadingHealth}
            onRefresh={fetchHealth}
            badge={
              rotationHealth ? (
                rotationHealth.overallHealthy ? (
                  <span className="ml-2 flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Healthy
                  </span>
                ) : (
                  <span className="ml-2 flex items-center gap-1 text-xs text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Needs Attention
                  </span>
                )
              ) : null
            }
          >
            {!rotationHealth ? (
              <EmptyMessage text="Loading rotation health..." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {rotationHealth.categories.map((cat) => (
                  <div
                    key={cat.category}
                    className={`rounded-lg border p-4 transition-colors ${
                      cat.status === "healthy"
                        ? "bg-zinc-800/30 border-zinc-700/50"
                        : cat.status === "low"
                          ? "bg-amber-500/5 border-amber-500/30"
                          : "bg-red-500/5 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: `${ROTATION_COLORS[cat.category]}20`,
                          color: ROTATION_COLORS[cat.category],
                        }}
                      >
                        {cat.category}
                      </span>
                      <div>
                        <div className="text-xs font-medium text-zinc-300">
                          {cat.label}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Ideal: {cat.idealRange}
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-white mb-0.5">
                      {cat.count}{" "}
                      <span className="text-xs text-zinc-500 font-normal">
                        songs
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono ${
                          cat.status === "healthy"
                            ? "text-emerald-400"
                            : cat.status === "low"
                              ? "text-amber-400"
                              : "text-red-400"
                        }`}
                      >
                        {cat.pct}%
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        ~{cat.avgPlays} avg plays
                      </span>
                    </div>
                    {cat.status !== "healthy" && (
                      <div
                        className={`mt-2 text-[10px] px-2 py-1 rounded ${
                          cat.status === "low"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {cat.status === "low"
                          ? "Needs more songs"
                          : "Over-represented"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─── Small components ───────────────────────────────────────────────────────

function VelocityBadge({
  direction,
  pct,
}: {
  direction: "up" | "down" | "flat";
  pct: number;
}) {
  const Icon =
    direction === "up"
      ? TrendingUp
      : direction === "down"
        ? TrendingDown
        : Minus;
  const color =
    direction === "up"
      ? "text-emerald-400"
      : direction === "down"
        ? "text-red-400"
        : "text-zinc-500";
  const bg =
    direction === "up"
      ? "bg-emerald-500/10"
      : direction === "down"
        ? "bg-red-500/10"
        : "bg-zinc-800";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${color} ${bg}`}
    >
      <Icon className="w-3 h-3" />
      {direction === "flat" ? "--" : `${pct > 0 ? "+" : ""}${pct}%`}
    </span>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-zinc-500">{text}</p>
    </div>
  );
}
