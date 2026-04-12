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
  Clock,
  DollarSign,
  Zap,
  ShieldAlert,
  Timer,
} from "lucide-react";

interface HealthComponent {
  status: "healthy" | "degraded" | "down";
  message?: string;
  lastCheck?: string;
  details?: any;
}

interface HealthData {
  status: "healthy" | "degraded" | "down";
  timestamp: string;
  components: Record<string, HealthComponent>;
}

interface ErrorEntry {
  key: string;
  message: string;
  url: string | null;
  timestamp: string;
  stack: string | null;
}

function StatusIndicator({ status }: { status: "healthy" | "degraded" | "down" | string }) {
  if (status === "healthy" || status === "ok") {
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Healthy</span>;
  }
  if (status === "degraded" || status === "stale") {
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" /> Degraded</span>;
  }
  if (status === "down" || status === "error") {
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Down</span>;
  }
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{status}</span>;
}

function OverallBanner({ status }: { status: string }) {
  if (status === "healthy") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle className="w-6 h-6 text-green-600" />
        <div>
          <div className="font-semibold text-green-800">All Systems Operational</div>
          <div className="text-sm text-green-600">Everything is running normally.</div>
        </div>
      </div>
    );
  }
  if (status === "degraded") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-yellow-600" />
        <div>
          <div className="font-semibold text-yellow-800">Degraded Performance</div>
          <div className="text-sm text-yellow-600">Some components are experiencing issues.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
      <XCircle className="w-6 h-6 text-red-600" />
      <div>
        <div className="font-semibold text-red-800">System Outage</div>
        <div className="text-sm text-red-600">Critical components are down. Immediate attention required.</div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default function MonitoringDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/monitoring/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);

        // Extract recent errors from health data's error configs
        // We also fetch directly to get error details
        const errRes = await fetch("/api/monitoring/health");
        if (errRes.ok) {
          const errData = await errRes.json();
          // Parse errors from the recentErrors component
          if (errData.components?.recentErrors?.details) {
            setErrors(errData.components.recentErrors.details);
          }
        }
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cronDetails = health?.components?.cronJobs?.details as Record<string, { status: string; lastRun: string | null; lastStatus: string | null }> | undefined;
  const aiDetails = health?.components?.aiSpend?.details as { todaySpend: number; dailyLimit: number; percentUsed: number } | undefined;
  const circuitDetails = health?.components?.circuitBreakers?.details as Record<string, { isOpen: boolean; failures: number; lastFailure: number }> | undefined;
  const timerDetails = health?.components?.apiResponseTimes?.details as Record<string, { totalRequests: number; avgMs: number; maxMs: number; slowCount: number; lastUpdated: string }> | undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              System Monitoring
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Real-time health and error tracking
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading && !health ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 border flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : health ? (
          <div className="space-y-6">
            {/* Overall Status Banner */}
            <OverallBanner status={health.status} />

            {/* Component Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(health.components).map(([name, comp]) => {
                const icons: Record<string, typeof Activity> = {
                  database: Zap,
                  cronJobs: Clock,
                  aiSpend: DollarSign,
                  circuitBreakers: ShieldAlert,
                  recentErrors: AlertTriangle,
                  apiResponseTimes: Timer,
                };
                const Icon = icons[name] || Activity;
                const labels: Record<string, string> = {
                  database: "Database",
                  cronJobs: "Cron Jobs",
                  aiSpend: "AI Spend",
                  circuitBreakers: "Circuit Breakers",
                  recentErrors: "Recent Errors",
                  apiResponseTimes: "API Response Times",
                };

                return (
                  <div key={name} className="bg-white dark:bg-zinc-900 rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{labels[name] || name}</span>
                      </div>
                      <StatusIndicator status={comp.status} />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-zinc-500">{comp.message}</p>
                  </div>
                );
              })}
            </div>

            {/* AI Spend Detail */}
            {aiDetails && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border p-6">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  AI Spend Today
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-zinc-400">${aiDetails.todaySpend.toFixed(2)} spent</span>
                      <span className="text-gray-400">${aiDetails.dailyLimit.toFixed(2)} limit</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          aiDetails.percentUsed >= 100
                            ? "bg-red-500"
                            : aiDetails.percentUsed >= 80
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(aiDetails.percentUsed, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {aiDetails.percentUsed.toFixed(0)}%
                  </div>
                </div>
              </div>
            )}

            {/* Cron Job Status Detail */}
            {cronDetails && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Cron Job Status
                  </h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium text-gray-600 dark:text-zinc-400">Job</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600 dark:text-zinc-400">Status</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600 dark:text-zinc-400">Last Run</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600 dark:text-zinc-400">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(cronDetails).map(([job, detail]) => (
                      <tr key={job} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{job}</td>
                        <td className="px-6 py-3">
                          <StatusIndicator status={detail.status} />
                        </td>
                        <td className="px-6 py-3 text-gray-500 dark:text-zinc-500">
                          {detail.lastRun ? formatTime(detail.lastRun) : "Never"}
                        </td>
                        <td className="px-6 py-3 text-gray-500 capitalize">
                          {detail.lastStatus || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Circuit Breaker Detail */}
            {circuitDetails && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border p-6">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Circuit Breakers
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(circuitDetails).map(([service, state]) => (
                    <div
                      key={service}
                      className={`rounded-lg border p-3 text-center ${
                        state.isOpen
                          ? "bg-red-50 border-red-200"
                          : state.failures > 0
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">{service}</div>
                      <div className={`text-sm font-bold ${
                        state.isOpen ? "text-red-700" : state.failures > 0 ? "text-yellow-700" : "text-green-700"
                      }`}>
                        {state.isOpen ? "OPEN" : "CLOSED"}
                      </div>
                      {state.failures > 0 && (
                        <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">{state.failures} failures</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Response Times */}
            {timerDetails && Object.keys(timerDetails).length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    API Response Times
                  </h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium text-gray-600 dark:text-zinc-400">Endpoint</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600 dark:text-zinc-400">Requests</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600 dark:text-zinc-400">Avg</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600 dark:text-zinc-400">Max</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600 dark:text-zinc-400">Slow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(timerDetails)
                      .sort(([, a], [, b]) => b.avgMs - a.avgMs)
                      .map(([endpoint, stats]) => (
                        <tr key={endpoint} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                          <td className="px-6 py-3 font-mono text-xs text-gray-900 dark:text-white">{endpoint}</td>
                          <td className="px-6 py-3 text-gray-600 dark:text-zinc-400">{stats.totalRequests}</td>
                          <td className={`px-6 py-3 ${stats.avgMs > 5000 ? "text-red-600 font-medium" : "text-gray-600"}`}>
                            {stats.avgMs}ms
                          </td>
                          <td className={`px-6 py-3 ${stats.maxMs > 5000 ? "text-red-600 font-medium" : "text-gray-600"}`}>
                            {stats.maxMs}ms
                          </td>
                          <td className="px-6 py-3 text-gray-500 dark:text-zinc-500">{stats.slowCount}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Recent Errors */}
            {errors.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Recent Errors (Last 24h)
                  </h2>
                </div>
                <div className="divide-y">
                  {errors.slice(0, 20).map((err) => (
                    <div
                      key={err.key}
                      className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                      onClick={() => setExpandedError(expandedError === err.key ? null : err.key)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-800 truncate max-w-[60%]">
                          {err.message}
                        </span>
                        <span className="text-xs text-gray-400">{formatTime(err.timestamp)}</span>
                      </div>
                      {err.url && <div className="text-xs text-gray-400 mt-0.5">{err.url}</div>}
                      {expandedError === err.key && err.stack && (
                        <pre className="mt-2 text-xs font-mono bg-red-50 border border-red-100 rounded-lg p-3 overflow-x-auto text-red-800">
                          {err.stack}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 border text-center">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-zinc-500">Could not load health data.</p>
            <p className="text-gray-400 text-sm mt-1">
              Check your database connection and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
