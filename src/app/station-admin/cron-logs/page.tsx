"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import { Clock, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, PauseCircle, PlayCircle } from "lucide-react";

interface CronLog {
  id: string;
  jobName: string;
  status: "success" | "error" | "timeout";
  duration: number;
  summary: Record<string, unknown> | null;
  error: string | null;
  startedAt: string;
  createdAt: string;
}

interface SuspendJob {
  name: string;
  suspended: boolean;
}

const JOB_LABELS: Record<string, string> = {
  "features-daily": "Features",
  "parker-daily": "Parker",
  "cassidy-daily": "Cassidy",
  "riley-daily": "Riley",
  "harper-daily": "Harper",
  "elliot-daily": "Elliot",
  "voice-tracks-daily": "Voice Tracks",
  "voice-tracks-hour": "Voice Tracks (Hourly)",
  "newsletter-weekly": "Newsletter",
  "promoter-payouts": "Promoter Payouts",
  "revenue-monthly": "Revenue",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" /> Success
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" /> {status}
    </span>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
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

export default function CronLogsPage() {
  const [logs, setLogs] = useState<CronLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [suspendJobs, setSuspendJobs] = useState<SuspendJob[]>([]);
  const [togglingJob, setTogglingJob] = useState<string | null>(null);

  const fetchSuspendStatus = () => {
    fetch("/api/admin/cron-suspend")
      .then((r) => r.json())
      .then((data) => setSuspendJobs(data.jobs || []))
      .catch(() => {});
  };

  const toggleSuspend = async (jobName: string, currentlySuspended: boolean) => {
    setTogglingJob(jobName);
    try {
      const res = await fetch("/api/admin/cron-suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobName, suspended: !currentlySuspended }),
      });
      if (res.ok) {
        setSuspendJobs((prev) =>
          prev.map((j) => j.name === jobName ? { ...j, suspended: !currentlySuspended } : j)
        );
      }
    } catch {
      // ignore
    }
    setTogglingJob(null);
  };

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filter !== "all") params.set("jobName", filter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    fetch(`/api/admin/cron-logs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
    fetchSuspendStatus();
  }, [filter, statusFilter]);

  const jobNames = Object.keys(JOB_LABELS);

  // Calculate stats
  const successCount = logs.filter((l) => l.status === "success").length;
  const errorCount = logs.filter((l) => l.status === "error").length;
  const avgDuration = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + l.duration, 0) / logs.length) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Cron Job Logs
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {total} total executions logged
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-xs text-gray-500 dark:text-zinc-500">Successful</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-xs text-gray-500 dark:text-zinc-500">Errors</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border">
            <div className="text-2xl font-bold text-blue-600">{formatDuration(avgDuration)}</div>
            <div className="text-xs text-gray-500 dark:text-zinc-500">Avg Duration</div>
          </div>
        </div>

        {/* Suspend Controls */}
        {suspendJobs.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border p-4 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
              <PauseCircle className="w-4 h-4" />
              Job Controls
            </h2>
            <div className="flex flex-wrap gap-2">
              {suspendJobs.map((job) => (
                <button
                  key={job.name}
                  onClick={() => toggleSuspend(job.name, job.suspended)}
                  disabled={togglingJob === job.name}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    job.suspended
                      ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  } ${togglingJob === job.name ? "opacity-50" : ""}`}
                >
                  {job.suspended ? (
                    <PauseCircle className="w-3.5 h-3.5" />
                  ) : (
                    <PlayCircle className="w-3.5 h-3.5" />
                  )}
                  {JOB_LABELS[job.name] || job.name}
                  <span className="text-[10px] opacity-70">
                    {job.suspended ? "PAUSED" : "ACTIVE"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="all">All Jobs</option>
            {jobNames.map((name) => (
              <option key={name} value={name}>
                {JOB_LABELS[name]}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="timeout">Timeout</option>
          </select>
        </div>

        {/* Log Table */}
        {loading ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 border flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 border text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-zinc-500">No cron logs yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              Logs will appear after the first cron job runs tonight at midnight MT.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-zinc-400">Job</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-zinc-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-zinc-400">Duration</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-zinc-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {JOB_LABELS[log.jobName] || log.jobName}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{formatDuration(log.duration)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-zinc-500">{formatTime(log.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Expanded Detail */}
        {expandedId && (
          <div className="mt-4 bg-white dark:bg-zinc-900 rounded-xl border p-4">
            {(() => {
              const log = logs.find((l) => l.id === expandedId);
              if (!log) return null;
              return (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {JOB_LABELS[log.jobName] || log.jobName} — {formatTime(log.startedAt)}
                  </h3>
                  {log.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-red-800 font-mono">{log.error}</p>
                    </div>
                  )}
                  {log.summary && (
                    <pre className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-700 overflow-x-auto">
                      {JSON.stringify(log.summary, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
