"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import { Clock, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

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

const JOB_LABELS: Record<string, string> = {
  "features-daily": "Features",
  "parker-daily": "Parker",
  "cassidy-daily": "Cassidy",
  "riley-daily": "Riley",
  "harper-daily": "Harper",
  "elliot-daily": "Elliot",
  "voice-tracks-daily": "Voice Tracks",
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
  }, [filter, statusFilter]);

  const jobNames = Object.keys(JOB_LABELS);

  // Calculate stats
  const successCount = logs.filter((l) => l.status === "success").length;
  const errorCount = logs.filter((l) => l.status === "error").length;
  const avgDuration = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + l.duration, 0) / logs.length) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
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
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-xs text-gray-500">Successful</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-xs text-gray-500">Errors</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-blue-600">{formatDuration(avgDuration)}</div>
            <div className="text-xs text-gray-500">Avg Duration</div>
          </div>
        </div>

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
          <div className="bg-white rounded-xl p-12 border flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No cron logs yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              Logs will appear after the first cron job runs tonight at midnight MT.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Job</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Duration</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {JOB_LABELS[log.jobName] || log.jobName}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDuration(log.duration)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatTime(log.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Expanded Detail */}
        {expandedId && (
          <div className="mt-4 bg-white rounded-xl border p-4">
            {(() => {
              const log = logs.find((l) => l.id === expandedId);
              if (!log) return null;
              return (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
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
