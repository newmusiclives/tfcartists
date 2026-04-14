"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Scale,
  Download,
  Loader2,
  RefreshCw,
  Music,
  Users,
  DollarSign,
  Disc3,
  ExternalLink,
  FileSpreadsheet,
  TrendingUp,
  ChevronDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SongEntry {
  title: string;
  artist: string;
  album: string | null;
  plays: number;
  totalSeconds: number;
  estimatedRoyalty: number;
}

interface ArtistEntry {
  artist: string;
  plays: number;
  totalSeconds: number;
  estimatedRoyalty: number;
}

interface LicensingData {
  period: string;
  totalPlays: number;
  uniqueSongs: number;
  uniqueArtists: number;
  estimatedTotalRoyalty: number;
  songs: SongEntry[];
  artists: ArtistEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function generateMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    options.push({ value, label });
  }
  return options;
}

function formatSeconds(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// PRO Info
// ---------------------------------------------------------------------------

const PRO_INFO = [
  {
    name: "BMI",
    fullName: "Broadcast Music, Inc.",
    url: "https://www.bmi.com/digital_licensing",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    format: "bmi",
    description: "Largest US PRO. Represents 1.4M+ songwriters.",
  },
  {
    name: "ASCAP",
    fullName: "American Society of Composers, Authors and Publishers",
    url: "https://www.ascap.com/music-users",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    format: "ascap",
    description: "Oldest US PRO. Represents 900K+ members.",
  },
  {
    name: "SESAC",
    fullName: "Society of European Stage Authors and Composers",
    url: "https://www.sesac.com/#!/licensing",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    format: "csv",
    description: "Invitation-only PRO. Selective catalog.",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LicensingDashboard() {
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<LicensingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"songs" | "artists">("songs");
  const monthOptions = generateMonthOptions();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/compliance/licensing?period=month&month=${month}`
      );
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = (format: string) => {
    window.open(
      `/api/compliance/licensing/export?period=${month}&format=${format}`,
      "_blank"
    );
  };

  const songs = data?.songs ?? [];
  const artists = data?.artists ?? [];

  return (
    <div className="min-h-screen bg-zinc-950">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <Scale className="w-6 h-6 text-emerald-500" />
              Music Licensing
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Royalty tracking and PRO reporting
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Month Selector */}
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="appearance-none bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 pr-8 text-sm text-zinc-100 outline-none focus:border-zinc-700 transition-colors cursor-pointer"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              onClick={() => handleExport("csv")}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                icon={<Music className="w-5 h-5 text-blue-400" />}
                label="Total Plays"
                value={data?.totalPlays?.toLocaleString() ?? "0"}
                bgClass="bg-blue-500/10 border-blue-500/20"
              />
              <SummaryCard
                icon={<Disc3 className="w-5 h-5 text-purple-400" />}
                label="Unique Songs"
                value={data?.uniqueSongs?.toLocaleString() ?? "0"}
                bgClass="bg-purple-500/10 border-purple-500/20"
              />
              <SummaryCard
                icon={<Users className="w-5 h-5 text-amber-400" />}
                label="Unique Artists"
                value={data?.uniqueArtists?.toLocaleString() ?? "0"}
                bgClass="bg-amber-500/10 border-amber-500/20"
              />
              <SummaryCard
                icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                label="Est. Royalties"
                value={formatCurrency(data?.estimatedTotalRoyalty ?? 0)}
                bgClass="bg-emerald-500/10 border-emerald-500/20"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Songs / Artists Tables - 2 cols */}
              <div className="lg:col-span-2 space-y-6">
                {/* Tab Switcher */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="flex border-b border-zinc-800">
                    <button
                      onClick={() => setActiveTab("songs")}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === "songs"
                          ? "text-emerald-400 border-b-2 border-emerald-400 bg-zinc-900"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Top Songs
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab("artists")}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === "artists"
                          ? "text-emerald-400 border-b-2 border-emerald-400 bg-zinc-900"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Users className="w-4 h-4" />
                        Top Artists
                      </span>
                    </button>
                  </div>

                  {activeTab === "songs" ? (
                    <div className="overflow-x-auto">
                      {songs.length === 0 ? (
                        <div className="p-12 text-center">
                          <Music className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                          <p className="text-zinc-500">
                            No play data for this period.
                          </p>
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-900/80 border-b border-zinc-800">
                            <tr>
                              <th className="text-left px-4 py-2.5 font-medium text-zinc-500 w-12">
                                #
                              </th>
                              <th className="text-left px-4 py-2.5 font-medium text-zinc-500">
                                Title
                              </th>
                              <th className="text-left px-4 py-2.5 font-medium text-zinc-500">
                                Artist
                              </th>
                              <th className="text-left px-4 py-2.5 font-medium text-zinc-500">
                                Album
                              </th>
                              <th className="text-right px-4 py-2.5 font-medium text-zinc-500 w-20">
                                Plays
                              </th>
                              <th className="text-right px-4 py-2.5 font-medium text-zinc-500 w-28">
                                Est. Royalty
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50">
                            {songs.slice(0, 50).map((song, i) => (
                              <tr
                                key={`${song.title}-${song.artist}`}
                                className="text-zinc-100 hover:bg-zinc-800/40 transition-colors"
                              >
                                <td className="px-4 py-2.5 text-zinc-500 font-mono text-xs">
                                  {i + 1}
                                </td>
                                <td className="px-4 py-2.5 font-medium truncate max-w-[200px]">
                                  {song.title}
                                </td>
                                <td className="px-4 py-2.5 text-zinc-400 truncate max-w-[160px]">
                                  {song.artist}
                                </td>
                                <td className="px-4 py-2.5 text-zinc-500 truncate max-w-[140px]">
                                  {song.album || "-"}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-zinc-300">
                                  {song.plays.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-emerald-400">
                                  ${song.estimatedRoyalty.toFixed(3)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      {songs.length > 50 && (
                        <div className="px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500 text-center">
                          Showing top 50 of {songs.length} songs. Export CSV for
                          full list.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      {artists.length === 0 ? (
                        <div className="p-12 text-center">
                          <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                          <p className="text-zinc-500">
                            No play data for this period.
                          </p>
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-900/80 border-b border-zinc-800">
                            <tr>
                              <th className="text-left px-4 py-2.5 font-medium text-zinc-500 w-12">
                                #
                              </th>
                              <th className="text-left px-4 py-2.5 font-medium text-zinc-500">
                                Artist
                              </th>
                              <th className="text-right px-4 py-2.5 font-medium text-zinc-500 w-24">
                                Plays
                              </th>
                              <th className="text-right px-4 py-2.5 font-medium text-zinc-500 w-28">
                                Total Time
                              </th>
                              <th className="text-right px-4 py-2.5 font-medium text-zinc-500 w-28">
                                Est. Royalty
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50">
                            {artists.slice(0, 50).map((artist, i) => (
                              <tr
                                key={artist.artist}
                                className="text-zinc-100 hover:bg-zinc-800/40 transition-colors"
                              >
                                <td className="px-4 py-2.5 text-zinc-500 font-mono text-xs">
                                  {i + 1}
                                </td>
                                <td className="px-4 py-2.5 font-medium">
                                  {artist.artist}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-zinc-300">
                                  {artist.plays.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right text-zinc-400">
                                  {formatSeconds(artist.totalSeconds)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-emerald-400">
                                  ${artist.estimatedRoyalty.toFixed(3)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      {artists.length > 50 && (
                        <div className="px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500 text-center">
                          Showing top 50 of {artists.length} artists. Export CSV
                          for full list.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar - PRO Filing */}
              <div className="space-y-4">
                {/* PRO Filing Section */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2 mb-4">
                    <FileSpreadsheet className="w-4 h-4 text-zinc-500" />
                    PRO Report Filing
                  </h3>
                  <p className="text-xs text-zinc-500 mb-4">
                    Generate pre-formatted reports for Performance Rights
                    Organizations.
                  </p>

                  <div className="space-y-3">
                    {PRO_INFO.map((pro) => (
                      <div
                        key={pro.name}
                        className={`border rounded-lg p-3 ${pro.bgColor}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`text-sm font-bold ${pro.color}`}
                          >
                            {pro.name}
                          </span>
                          <a
                            href={pro.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <p className="text-xs text-zinc-500 mb-2">
                          {pro.description}
                        </p>
                        <button
                          onClick={() => handleExport(pro.format)}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Generate {pro.name} Report
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Period Summary */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                    Period Info
                  </h3>
                  <div className="text-xs text-zinc-500 space-y-2">
                    <div className="flex justify-between">
                      <span>Period</span>
                      <span className="text-zinc-300">
                        {data?.period ?? month}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Plays</span>
                      <span className="text-zinc-300">
                        {data?.totalPlays?.toLocaleString() ?? "0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unique Songs</span>
                      <span className="text-zinc-300">
                        {data?.uniqueSongs?.toLocaleString() ?? "0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unique Artists</span>
                      <span className="text-zinc-300">
                        {data?.uniqueArtists?.toLocaleString() ?? "0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate Per Play</span>
                      <span className="text-zinc-300">$0.003</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-800">
                      <span className="text-zinc-300 font-medium">
                        Est. Total
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {formatCurrency(data?.estimatedTotalRoyalty ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Licensing Notes */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                    Licensing Notes
                  </h3>
                  <div className="text-xs text-zinc-500 space-y-2">
                    <p>
                      Estimated royalties use $0.003/play, the industry
                      average for streaming radio. Actual rates vary by PRO
                      agreement.
                    </p>
                    <p>
                      File reports with each PRO quarterly or as required by
                      your license agreement. Keep CSV exports for your
                      records.
                    </p>
                    <p>
                      SoundExchange handles digital performance royalties
                      separately from BMI/ASCAP/SESAC composition royalties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({
  icon,
  label,
  value,
  bgClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgClass: string;
}) {
  return (
    <div
      className={`border rounded-xl p-4 ${bgClass}`}
    >
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}
