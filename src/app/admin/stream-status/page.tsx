"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Radio,
  Activity,
  Wifi,
  WifiOff,
  Volume2,
  Clock,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const STREAM_URL = "https://tfc-radio.netlify.app/stream/americana-hq.mp3";
const NOW_PLAYING_URL = "/api/now-playing";
const CHECK_INTERVAL = 15_000;

interface StreamCheck {
  timestamp: string;
  streamOnline: boolean;
  responseTime: number;
  statusCode: number;
  nowPlaying: {
    title: string;
    artist_name: string;
    dj_name: string;
    listener_count: number;
  } | null;
}

export default function StreamStatusPage() {
  const [checks, setChecks] = useState<StreamCheck[]>([]);
  const [checking, setChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runCheck = useCallback(async () => {
    setChecking(true);
    const start = Date.now();

    let streamOnline = false;
    let statusCode = 0;
    let nowPlaying = null;

    try {
      // Check stream endpoint (HEAD request)
      const streamRes = await fetch(STREAM_URL, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000),
      });
      statusCode = streamRes.status;
      streamOnline = streamRes.ok;
    } catch {
      statusCode = 0;
      streamOnline = false;
    }

    try {
      const npRes = await fetch(NOW_PLAYING_URL, { cache: "no-store" });
      if (npRes.ok) {
        nowPlaying = await npRes.json();
      }
    } catch {
      // Non-critical
    }

    const responseTime = Date.now() - start;

    const check: StreamCheck = {
      timestamp: new Date().toISOString(),
      streamOnline,
      responseTime,
      statusCode,
      nowPlaying,
    };

    setChecks((prev) => [check, ...prev].slice(0, 100));
    setChecking(false);
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(runCheck, CHECK_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, runCheck]);

  const latest = checks[0];
  const uptime = checks.length > 0
    ? ((checks.filter((c) => c.streamOnline).length / checks.length) * 100).toFixed(1)
    : "—";
  const avgResponseTime = checks.length > 0
    ? Math.round(checks.reduce((sum, c) => sum + c.responseTime, 0) / checks.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Stream Monitor</h1>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh (15s)
            </label>
            <button
              onClick={runCheck}
              disabled={checking}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
              Check Now
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`bg-white rounded-xl p-5 shadow-sm border-2 ${latest?.streamOnline ? "border-green-200" : "border-red-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              {latest?.streamOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm font-medium text-gray-500">Stream Status</span>
            </div>
            <p className={`text-2xl font-bold ${latest?.streamOnline ? "text-green-600" : "text-red-600"}`}>
              {latest?.streamOnline ? "ONLINE" : "OFFLINE"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              HTTP {latest?.statusCode || "—"}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-500">Response Time</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{latest?.responseTime || 0}ms</p>
            <p className="text-xs text-gray-400 mt-1">Avg: {avgResponseTime}ms</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-500">Uptime</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{uptime}%</p>
            <p className="text-xs text-gray-400 mt-1">{checks.length} checks</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-500">Listeners</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {latest?.nowPlaying?.listener_count ?? "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Current</p>
          </div>
        </div>

        {/* Now Playing */}
        {latest?.nowPlaying && (
          <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Now Playing</h2>
            </div>
            <div className="flex items-center gap-4">
              <Radio className="w-10 h-10 text-amber-400" />
              <div>
                <p className="font-bold text-lg">{latest.nowPlaying.title}</p>
                <p className="text-gray-600">{latest.nowPlaying.artist_name}</p>
                {latest.nowPlaying.dj_name && (
                  <p className="text-sm text-gray-400">DJ: {latest.nowPlaying.dj_name}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stream URL */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <h2 className="font-semibold mb-3">Stream Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Stream URL:</span>
              <code className="ml-2 bg-gray-100 px-2 py-0.5 rounded text-xs break-all">{STREAM_URL}</code>
            </div>
            <div>
              <span className="text-gray-500">Now Playing API:</span>
              <code className="ml-2 bg-gray-100 px-2 py-0.5 rounded text-xs">{NOW_PLAYING_URL}</code>
            </div>
          </div>
        </div>

        {/* Check History */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Check History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">HTTP</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Response</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Track</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Listeners</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {checks.map((check, i) => (
                  <tr key={i} className={i === 0 ? "bg-blue-50/30" : ""}>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                      {new Date(check.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2.5">
                      {check.streamOnline ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" /> Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-3.5 h-3.5" /> Offline
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{check.statusCode || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`${check.responseTime > 3000 ? "text-red-600" : check.responseTime > 1000 ? "text-amber-600" : "text-green-600"}`}>
                        {check.responseTime}ms
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 truncate max-w-[200px]">
                      {check.nowPlaying ? `${check.nowPlaying.title} - ${check.nowPlaying.artist_name}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {check.nowPlaying?.listener_count ?? "—"}
                    </td>
                  </tr>
                ))}
                {checks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      <AlertTriangle className="w-5 h-5 mx-auto mb-2" />
                      No checks yet. Running first check...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
