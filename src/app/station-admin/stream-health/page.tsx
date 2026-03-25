"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Radio,
  Clock,
  Users,
  Zap,
  Wifi,
  WifiOff,
} from "lucide-react";

interface StreamHealthPoint {
  timestamp: string;
  online: boolean;
  responseTimeMs: number;
  bitrate?: number;
  listeners?: number;
  serverName?: string;
  mountPoint?: string;
}

interface Incident {
  start: string;
  end: string | null;
  durationMs: number;
}

interface StreamHealthData {
  current: StreamHealthPoint;
  history: StreamHealthPoint[];
  uptime: {
    last24h: number;
  };
  incidents: Incident[];
}

interface UptimeStats {
  totalChecks: number;
  onlineChecks: number;
  firstCheck: string;
  lastCheck: string;
  checks7d: { timestamp: string; online: boolean }[];
  checks30d: { timestamp: string; online: boolean }[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.round((ms % 3_600_000) / 60_000);
  return `${hours}h ${mins}m`;
}

function UptimeBar({ percent, label }: { percent: number; label: string }) {
  const color =
    percent >= 99.5
      ? "bg-green-500"
      : percent >= 95
        ? "bg-yellow-500"
        : "bg-red-500";
  const textColor =
    percent >= 99.5
      ? "text-green-400"
      : percent >= 95
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-400 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className={`text-sm font-mono font-bold w-20 text-right ${textColor}`}>
        {percent.toFixed(2)}%
      </span>
    </div>
  );
}

function ResponseTimeChart({ history }: { history: StreamHealthPoint[] }) {
  if (history.length === 0) {
    return (
      <div className="text-sm text-zinc-500 text-center py-8">
        No response time data yet
      </div>
    );
  }

  const maxTime = Math.max(...history.map((p) => p.responseTimeMs), 100);
  const barWidth = Math.max(2, Math.floor(100 / Math.max(history.length, 1)));

  return (
    <div className="flex items-end gap-px h-32 overflow-hidden">
      {history.map((point, i) => {
        const height = Math.max(2, (point.responseTimeMs / maxTime) * 100);
        const color = !point.online
          ? "bg-red-500"
          : point.responseTimeMs < 500
            ? "bg-green-500"
            : point.responseTimeMs < 1000
              ? "bg-yellow-500"
              : "bg-red-500";

        return (
          <div
            key={i}
            className="group relative flex-1 min-w-[2px] flex items-end"
          >
            <div
              className={`w-full rounded-t-sm ${color} transition-all hover:opacity-80`}
              style={{ height: `${height}%` }}
            />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 whitespace-nowrap shadow-lg">
              <div>{point.responseTimeMs}ms</div>
              <div className="text-zinc-500">
                {new Date(point.timestamp).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListenerChart({ history }: { history: StreamHealthPoint[] }) {
  const withListeners = history.filter(
    (p) => p.listeners != null && p.listeners !== undefined
  );

  if (withListeners.length === 0) {
    return (
      <div className="text-sm text-zinc-500 text-center py-8">
        No listener data available
      </div>
    );
  }

  const maxListeners = Math.max(...withListeners.map((p) => p.listeners!), 1);

  // Build SVG path for line chart
  const points = withListeners.map((p, i) => {
    const x = (i / Math.max(withListeners.length - 1, 1)) * 100;
    const y = 100 - (p.listeners! / maxListeners) * 90;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L 100,100 L 0,100 Z`;

  return (
    <div className="relative h-32">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-zinc-600 w-8">
        <span>{maxListeners}</span>
        <span>{Math.round(maxListeners / 2)}</span>
        <span>0</span>
      </div>
      <div className="ml-10 h-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="listenerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#listenerGrad)" />
          <path d={linePath} fill="none" stroke="rgb(59, 130, 246)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      {/* X-axis time labels */}
      <div className="ml-10 flex justify-between text-xs text-zinc-600 mt-1">
        {withListeners.length > 0 && (
          <>
            <span>
              {new Date(withListeners[0].timestamp).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
            <span>
              {new Date(
                withListeners[withListeners.length - 1].timestamp
              ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default function StreamHealthDashboard() {
  const [data, setData] = useState<StreamHealthData | null>(null);
  const [uptimeStats, setUptimeStats] = useState<UptimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/monitoring/stream");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefresh(new Date());
      }
    } catch {
      // Ignore fetch errors
    }

    // Also try to fetch extended uptime stats
    try {
      const res = await fetch("/api/monitoring/stream/uptime");
      if (res.ok) {
        const json = await res.json();
        setUptimeStats(json);
      }
    } catch {
      // Optional endpoint
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const current = data?.current;
  const history = data?.history ?? [];
  const incidents = data?.incidents ?? [];

  // Calculate 7d/30d from uptimeStats if available
  const uptime24h = data?.uptime?.last24h ?? 100;
  const uptime7d =
    uptimeStats && uptimeStats.checks7d.length > 0
      ? (uptimeStats.checks7d.filter((c) => c.online).length /
          uptimeStats.checks7d.length) *
        100
      : null;
  const uptime30d =
    uptimeStats && uptimeStats.checks30d.length > 0
      ? (uptimeStats.checks30d.filter((c) => c.online).length /
          uptimeStats.checks30d.length) *
        100
      : null;

  // Current listener count & peak
  const currentListeners = current?.listeners;
  const peakListeners =
    history.length > 0
      ? Math.max(...history.filter((p) => p.listeners != null).map((p) => p.listeners!), 0)
      : null;

  // Average response time
  const avgResponseTime =
    history.length > 0
      ? Math.round(
          history.reduce((sum, p) => sum + p.responseTimeMs, 0) / history.length
        )
      : null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <Radio className="w-6 h-6 text-blue-500" />
              Stream Health Monitor
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Real-time Icecast stream monitoring
              {lastRefresh && (
                <span className="ml-2 text-zinc-600">
                  -- Last updated{" "}
                  {lastRefresh.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 text-zinc-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading && !data ? (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Current Status Banner */}
            {current?.online ? (
              <div className="bg-green-950/50 border border-green-800/50 rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-900/50 flex items-center justify-center">
                  <Wifi className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-green-300 text-lg">
                    Stream Online
                  </div>
                  <div className="text-sm text-green-500">
                    Responding in {current.responseTimeMs}ms
                    {current.listeners != null && ` -- ${current.listeners} listener${current.listeners !== 1 ? "s" : ""}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                  </span>
                  <span className="text-sm font-medium text-green-400">LIVE</span>
                </div>
              </div>
            ) : (
              <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center">
                  <WifiOff className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-red-300 text-lg">
                    Stream Offline
                  </div>
                  <div className="text-sm text-red-500">
                    Last check timed out or failed ({current?.responseTimeMs}ms)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-400">DOWN</span>
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-2">
                  <Zap className="w-3.5 h-3.5" />
                  RESPONSE TIME
                </div>
                <div className="text-2xl font-bold text-zinc-100">
                  {current?.responseTimeMs ?? "--"}
                  <span className="text-sm text-zinc-500 ml-1">ms</span>
                </div>
                {avgResponseTime != null && (
                  <div className="text-xs text-zinc-600 mt-1">
                    avg {avgResponseTime}ms (24h)
                  </div>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-2">
                  <Users className="w-3.5 h-3.5" />
                  LISTENERS
                </div>
                <div className="text-2xl font-bold text-zinc-100">
                  {currentListeners ?? "--"}
                </div>
                {peakListeners != null && peakListeners > 0 && (
                  <div className="text-xs text-zinc-600 mt-1">
                    peak {peakListeners} (24h)
                  </div>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-2">
                  <Activity className="w-3.5 h-3.5" />
                  BITRATE
                </div>
                <div className="text-2xl font-bold text-zinc-100">
                  {current?.bitrate ?? "--"}
                  {current?.bitrate && (
                    <span className="text-sm text-zinc-500 ml-1">kbps</span>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  UPTIME (24H)
                </div>
                <div
                  className={`text-2xl font-bold ${
                    uptime24h >= 99.5
                      ? "text-green-400"
                      : uptime24h >= 95
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {uptime24h.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Uptime Percentages */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Uptime
              </h2>
              <div className="space-y-3">
                <UptimeBar percent={uptime24h} label="24 hours" />
                <UptimeBar
                  percent={uptime7d ?? uptime24h}
                  label="7 days"
                />
                <UptimeBar
                  percent={uptime30d ?? uptime7d ?? uptime24h}
                  label="30 days"
                />
              </div>
              {!uptime7d && (
                <p className="text-xs text-zinc-600 mt-3">
                  7-day and 30-day data will populate as the cron job collects more history.
                </p>
              )}
            </div>

            {/* Response Time Chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Response Time (24h)
                </h2>
                <div className="flex items-center gap-3 text-xs text-zinc-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    &lt;500ms
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    &lt;1000ms
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    &gt;1000ms
                  </span>
                </div>
              </div>
              <ResponseTimeChart history={history} />
            </div>

            {/* Listener History */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Listener History (24h)
              </h2>
              <ListenerChart history={history} />
            </div>

            {/* Incidents */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Incidents
                </h2>
              </div>
              {incidents.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">
                    No downtime incidents in the last 24 hours
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {incidents.map((incident, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          incident.end ? "bg-yellow-500" : "bg-red-500 animate-pulse"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-zinc-300">
                          {incident.end ? "Resolved" : "Ongoing"} outage
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          Started {formatTime(incident.start)}
                          {incident.end && ` -- Resolved ${formatTime(incident.end)}`}
                        </div>
                      </div>
                      <div className="text-sm font-mono text-zinc-400">
                        {formatDuration(incident.durationMs)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stream Details */}
            {current && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-purple-500" />
                  Stream Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      label: "Mount Point",
                      value: current.mountPoint || "/americana-hq.mp3",
                    },
                    {
                      label: "Bitrate",
                      value: current.bitrate
                        ? `${current.bitrate} kbps`
                        : "Unknown",
                    },
                    {
                      label: "Server",
                      value: current.serverName || "Icecast",
                    },
                    {
                      label: "Stream URL",
                      value: "http://89.167.23.152:8000/americana-hq.mp3",
                    },
                    {
                      label: "Status Endpoint",
                      value: "http://89.167.23.152:8000/status-json.xsl",
                    },
                    {
                      label: "Last Check",
                      value: formatTime(current.timestamp),
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col">
                      <span className="text-xs text-zinc-500 font-medium">
                        {item.label}
                      </span>
                      <span className="text-sm text-zinc-300 font-mono mt-0.5 truncate">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 text-center">
            <Radio className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">Could not load stream health data.</p>
            <p className="text-zinc-600 text-sm mt-1">
              Check the monitoring API and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
