"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  FileText,
  Download,
  Copy,
  Printer,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Calendar,
  Music,
  Megaphone,
  Mic,
  Radio,
  Clock,
  BarChart3,
  Users,
  CheckCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LogEntry {
  time: string;
  type: "song" | "ad" | "voicetrack" | "imaging";
  title: string;
  artist: string;
  duration: number | null;
  djOnDuty: string;
}

interface LogResponse {
  date: string;
  hour: number | "all";
  source: string;
  totalEntries: number;
  entries: LogEntry[];
}

interface DailySummary {
  totalAirtimeHours: number;
  songsPlayed: number;
  adSpotsAired: number;
  voiceTracksAired: number;
  uniqueArtists: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayString(): string {
  const now = new Date();
  return now.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function typeLabel(type: LogEntry["type"]): string {
  switch (type) {
    case "song":
      return "Song";
    case "ad":
      return "Ad Spot";
    case "voicetrack":
      return "Voice Track";
    case "imaging":
      return "Imaging";
    default:
      return type;
  }
}

function typeIcon(type: LogEntry["type"]) {
  switch (type) {
    case "song":
      return <Music className="w-3.5 h-3.5" />;
    case "ad":
      return <Megaphone className="w-3.5 h-3.5" />;
    case "voicetrack":
      return <Mic className="w-3.5 h-3.5" />;
    case "imaging":
      return <Radio className="w-3.5 h-3.5" />;
  }
}

function typeRowClasses(type: LogEntry["type"]): string {
  switch (type) {
    case "song":
      return "text-zinc-100";
    case "ad":
      return "text-amber-400 bg-amber-950/30";
    case "voicetrack":
      return "text-blue-400 bg-blue-950/30";
    case "imaging":
      return "text-purple-400 bg-purple-950/30";
    default:
      return "text-zinc-100";
  }
}

function computeSummary(entries: LogEntry[]): DailySummary {
  const songs = entries.filter((e) => e.type === "song");
  const ads = entries.filter((e) => e.type === "ad");
  const vts = entries.filter((e) => e.type === "voicetrack");
  const totalSeconds = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);
  const uniqueArtists = new Set(
    songs.map((s) => s.artist).filter(Boolean)
  ).size;

  return {
    totalAirtimeHours: parseFloat((totalSeconds / 3600).toFixed(1)),
    songsPlayed: songs.length,
    adSpotsAired: ads.length,
    voiceTracksAired: vts.length,
    uniqueArtists,
  };
}

function groupByHour(entries: LogEntry[]): Record<number, LogEntry[]> {
  const groups: Record<number, LogEntry[]> = {};
  for (const entry of entries) {
    // Extract hour from the time string
    const match = entry.time.match(/(\d{2}):(\d{2}):(\d{2})/);
    const hour = match ? parseInt(match[1], 10) : 0;
    if (!groups[hour]) groups[hour] = [];
    groups[hour].push(entry);
  }
  return groups;
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

function entriesToText(entries: LogEntry[], date: string): string {
  const lines = [
    `FCC-Style Compliance Log - ${date}`,
    `Generated: ${new Date().toLocaleString()}`,
    "=".repeat(80),
    "",
    "Time                    | Type        | Title                          | Artist               | Duration | DJ",
    "-".repeat(120),
  ];
  for (const e of entries) {
    lines.push(
      `${e.time.padEnd(24)}| ${typeLabel(e.type).padEnd(12)}| ${e.title.slice(0, 30).padEnd(31)}| ${(e.artist || "-").slice(0, 20).padEnd(21)}| ${formatDuration(e.duration).padEnd(9)}| ${e.djOnDuty}`
    );
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ComplianceDashboard() {
  const [date, setDate] = useState(todayString);
  const [data, setData] = useState<LogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedHours, setExpandedHours] = useState<Set<number>>(new Set());
  const [copySuccess, setCopySuccess] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/compliance/log?date=${date}`);
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
  }, [date]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const entries = data?.entries ?? [];
  const summary = computeSummary(entries);
  const hourGroups = groupByHour(entries);
  const sortedHours = Object.keys(hourGroups)
    .map(Number)
    .sort((a, b) => a - b);

  const toggleHour = (hour: number) => {
    setExpandedHours((prev) => {
      const next = new Set(prev);
      if (next.has(hour)) next.delete(hour);
      else next.add(hour);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedHours(new Set(sortedHours));
  };

  const collapseAll = () => {
    setExpandedHours(new Set());
  };

  const handleCSVDownload = () => {
    window.open(`/api/compliance/export?date=${date}&format=csv`, "_blank");
  };

  const handleCopyText = async () => {
    const text = entriesToText(entries, date);
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Compliance Log - ${date}</title>
          <style>
            body { font-family: monospace; font-size: 11px; margin: 20px; }
            h1 { font-size: 16px; margin-bottom: 4px; }
            h2 { font-size: 13px; color: #666; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
            th { background: #f0f0f0; font-weight: bold; }
            .song { }
            .ad { background: #fffbeb; }
            .voicetrack { background: #eff6ff; }
            .imaging { background: #faf5ff; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>FCC-Style Compliance Log</h1>
          <h2>Date: ${date} | Generated: ${new Date().toLocaleString()} | Source: ${data?.source ?? "N/A"}</h2>
          <table>
            <thead>
              <tr>
                <th>Time</th><th>Type</th><th>Title / Description</th><th>Artist</th><th>Duration</th><th>DJ</th>
              </tr>
            </thead>
            <tbody>
              ${entries
                .map(
                  (e) =>
                    `<tr class="${e.type}"><td>${e.time}</td><td>${typeLabel(e.type)}</td><td>${e.title}</td><td>${e.artist || "-"}</td><td>${formatDuration(e.duration)}</td><td>${e.djOnDuty}</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-500" />
              FCC Compliance Log
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Program log and broadcast records
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-zinc-100 text-sm border-none outline-none"
              />
            </div>

            <button
              onClick={fetchLog}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content - 3 cols */}
            <div className="lg:col-span-3 space-y-6">
              {/* Export Bar */}
              <div className="flex flex-wrap items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <span className="text-sm text-zinc-400 mr-auto">
                  {entries.length} entries | Source:{" "}
                  <span className="text-zinc-300 font-medium">
                    {data?.source === "playback"
                      ? "Live Playback"
                      : "Scheduled Playlist"}
                  </span>
                </span>

                <button
                  onClick={handleCSVDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>

                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-colors"
                >
                  {copySuccess ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copySuccess ? "Copied" : "Copy Text"}
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>

              {/* Program Log Table */}
              <div
                ref={printRef}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-300">
                    Program Log - {date}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-zinc-400" />
                      Song
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Ad
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Voice
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      Imaging
                    </span>
                  </div>
                </div>

                {entries.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">
                      No log entries for this date.
                    </p>
                    <p className="text-zinc-600 text-sm mt-1">
                      Select a date with broadcast activity.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-900/80 border-b border-zinc-800">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-medium text-zinc-500 w-44">
                            Time
                          </th>
                          <th className="text-left px-4 py-2.5 font-medium text-zinc-500 w-28">
                            Type
                          </th>
                          <th className="text-left px-4 py-2.5 font-medium text-zinc-500">
                            Title / Description
                          </th>
                          <th className="text-left px-4 py-2.5 font-medium text-zinc-500">
                            Artist
                          </th>
                          <th className="text-left px-4 py-2.5 font-medium text-zinc-500 w-20">
                            Duration
                          </th>
                          <th className="text-left px-4 py-2.5 font-medium text-zinc-500 w-32">
                            DJ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {entries.map((entry, i) => (
                          <tr
                            key={i}
                            className={`${typeRowClasses(entry.type)} hover:bg-zinc-800/40 transition-colors`}
                          >
                            <td className="px-4 py-2 font-mono text-xs">
                              {entry.time}
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                                {typeIcon(entry.type)}
                                {typeLabel(entry.type)}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-medium truncate max-w-xs">
                              {entry.title}
                            </td>
                            <td className="px-4 py-2 text-zinc-400 truncate max-w-[160px]">
                              {entry.artist || "-"}
                            </td>
                            <td className="px-4 py-2 font-mono text-xs text-zinc-400">
                              {formatDuration(entry.duration)}
                            </td>
                            <td className="px-4 py-2 text-zinc-400 text-xs">
                              {entry.djOnDuty}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Hour-by-Hour Breakdown */}
              {sortedHours.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      Hour-by-Hour Breakdown
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={expandAll}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        Expand All
                      </button>
                      <span className="text-zinc-700">|</span>
                      <button
                        onClick={collapseAll}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        Collapse All
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-zinc-800/50">
                    {sortedHours.map((hour) => {
                      const hourEntries = hourGroups[hour];
                      const isExpanded = expandedHours.has(hour);
                      const hourSongs = hourEntries.filter(
                        (e) => e.type === "song"
                      ).length;
                      const hourAds = hourEntries.filter(
                        (e) => e.type === "ad"
                      ).length;

                      return (
                        <div key={hour}>
                          <button
                            onClick={() => toggleHour(hour)}
                            className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-800/40 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-zinc-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-zinc-500" />
                              )}
                              <span className="text-sm font-medium text-zinc-200">
                                {formatHourLabel(hour)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                              <span>{hourEntries.length} items</span>
                              <span>{hourSongs} songs</span>
                              {hourAds > 0 && (
                                <span className="text-amber-500">
                                  {hourAds} ads
                                </span>
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="bg-zinc-950/50 border-t border-zinc-800/50">
                              <table className="w-full text-xs">
                                <tbody className="divide-y divide-zinc-800/30">
                                  {hourEntries.map((entry, i) => (
                                    <tr
                                      key={i}
                                      className={`${typeRowClasses(entry.type)}`}
                                    >
                                      <td className="px-5 py-1.5 font-mono w-44 pl-12">
                                        {entry.time}
                                      </td>
                                      <td className="px-3 py-1.5 w-28">
                                        <span className="inline-flex items-center gap-1">
                                          {typeIcon(entry.type)}
                                          {typeLabel(entry.type)}
                                        </span>
                                      </td>
                                      <td className="px-3 py-1.5 font-medium truncate max-w-xs">
                                        {entry.title}
                                      </td>
                                      <td className="px-3 py-1.5 text-zinc-500 truncate max-w-[140px]">
                                        {entry.artist || "-"}
                                      </td>
                                      <td className="px-3 py-1.5 font-mono text-zinc-500 w-16">
                                        {formatDuration(entry.duration)}
                                      </td>
                                      <td className="px-3 py-1.5 text-zinc-500 w-28">
                                        {entry.djOnDuty}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Daily Summary */}
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-zinc-500" />
                  Daily Summary
                </h3>

                <div className="space-y-4">
                  <SummaryCard
                    icon={<Clock className="w-4 h-4 text-emerald-500" />}
                    label="Total Airtime"
                    value={`${summary.totalAirtimeHours}h`}
                  />
                  <SummaryCard
                    icon={<Music className="w-4 h-4 text-zinc-400" />}
                    label="Songs Played"
                    value={String(summary.songsPlayed)}
                  />
                  <SummaryCard
                    icon={<Megaphone className="w-4 h-4 text-amber-400" />}
                    label="Ad Spots Aired"
                    value={String(summary.adSpotsAired)}
                  />
                  <SummaryCard
                    icon={<Mic className="w-4 h-4 text-blue-400" />}
                    label="Voice Tracks"
                    value={String(summary.voiceTracksAired)}
                  />
                  <SummaryCard
                    icon={<Users className="w-4 h-4 text-purple-400" />}
                    label="Unique Artists"
                    value={String(summary.uniqueArtists)}
                  />
                </div>
              </div>

              {/* Source Info */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                  Log Info
                </h3>
                <div className="text-xs text-zinc-500 space-y-2">
                  <div className="flex justify-between">
                    <span>Date</span>
                    <span className="text-zinc-300">{date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Source</span>
                    <span className="text-zinc-300">
                      {data?.source === "playback"
                        ? "Live Playback"
                        : "Scheduled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entries</span>
                    <span className="text-zinc-300">{entries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hours Active</span>
                    <span className="text-zinc-300">{sortedHours.length}</span>
                  </div>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                  Quick Dates
                </h3>
                <div className="space-y-1.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((daysAgo) => {
                    const d = new Date();
                    d.setDate(d.getDate() - daysAgo);
                    const ds = d.toLocaleDateString("en-CA");
                    const label =
                      daysAgo === 0
                        ? "Today"
                        : daysAgo === 1
                          ? "Yesterday"
                          : d.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            });
                    return (
                      <button
                        key={ds}
                        onClick={() => setDate(ds)}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          date === ds
                            ? "bg-emerald-600/20 text-emerald-400 font-medium"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        {icon}
        {label}
      </div>
      <span className="text-sm font-bold text-zinc-100">{value}</span>
    </div>
  );
}
