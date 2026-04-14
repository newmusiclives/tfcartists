"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Music,
  Loader2,
  CheckCircle2,
  XCircle,
  Play,
  ThumbsUp,
  Clock,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
} from "lucide-react";

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? match[1] : "";
}

interface SongRequestItem {
  id: string;
  songTitle: string;
  artistName: string;
  listenerName: string | null;
  message: string | null;
  status: string;
  votes: number;
  createdAt: string;
  playedAt: string | null;
  rejectedReason: string | null;
}

type SortField = "votes" | "createdAt" | "status";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "pending" | "queued" | "played" | "rejected";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  queued: "bg-emerald-500/20 text-emerald-400",
  played: "bg-blue-500/20 text-blue-400",
  rejected: "bg-red-500/20 text-red-400",
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<SongRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationId, setStationId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("votes");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Fetch station
  useEffect(() => {
    fetch("/api/stations", { headers: { "x-csrf-token": getCsrfToken() } })
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || data;
        if (Array.isArray(stations) && stations.length > 0) {
          setStationId(stations[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    if (!stationId) return;
    try {
      const statusParam =
        statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const res = await fetch(
        `/api/requests?stationId=${stationId}${statusParam}`,
        { headers: { "x-csrf-token": getCsrfToken() } }
      );
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [stationId, statusFilter]);

  useEffect(() => {
    if (stationId) {
      setLoading(true);
      fetchRequests();
    }
  }, [stationId, statusFilter, fetchRequests]);

  // Sort requests
  const sorted = [...requests].sort((a, b) => {
    const dir = sortDir === "desc" ? -1 : 1;
    if (sortField === "votes") return (a.votes - b.votes) * dir;
    if (sortField === "createdAt")
      return (
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
        dir
      );
    if (sortField === "status") return a.status.localeCompare(b.status) * dir;
    return 0;
  });

  // Update single request status
  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        const data = await res.json();
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...data.request } : r))
        );
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk actions
  const bulkUpdateStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch("/api/requests", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": getCsrfToken(),
          },
          body: JSON.stringify({ id, status }),
        })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      fetchRequests();
    } catch {
      // silent
    } finally {
      setBulkLoading(false);
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map((r) => r.id)));
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  return (
    <>
      <SharedNav />
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 text-white pt-4 px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Music className="w-6 h-6 text-violet-400" />
                Song Requests
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Manage listener song requests
              </p>
            </div>
            <div className="text-sm text-zinc-500">
              {requests.length} request{requests.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Status filter */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              {(
                ["all", "pending", "queued", "played", "rejected"] as const
              ).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                    statusFilter === s
                      ? "bg-violet-600 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Sort buttons */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs text-zinc-500 mr-1">
                <ArrowUpDown className="w-3.5 h-3.5 inline mr-1" />
                Sort:
              </span>
              {(["votes", "createdAt", "status"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => toggleSort(f)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    sortField === f
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {f === "createdAt" ? "Date" : f.charAt(0).toUpperCase() + f.slice(1)}
                  {sortField === f && (sortDir === "desc" ? " \u2193" : " \u2191")}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-4 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5">
              <span className="text-sm text-zinc-400">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => bulkUpdateStatus("queued")}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors disabled:opacity-50"
                >
                  Approve All
                </button>
                <button
                  onClick={() => bulkUpdateStatus("played")}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 rounded-md transition-colors disabled:opacity-50"
                >
                  Mark Played
                </button>
                <button
                  onClick={() => bulkUpdateStatus("rejected")}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 rounded-md transition-colors disabled:opacity-50"
                >
                  Reject All
                </button>
                {bulkLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                )}
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading requests...
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Music className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No requests found.</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[40px_1fr_1fr_80px_80px_100px_140px] gap-2 px-4 py-3 border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                <button onClick={toggleSelectAll} className="flex items-center">
                  {selectedIds.size === sorted.length && sorted.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-violet-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <span>Song</span>
                <span>Requester</span>
                <span className="text-center">Votes</span>
                <span>Status</span>
                <span>Time</span>
                <span className="text-right">Actions</span>
              </div>

              {/* Rows */}
              {sorted.map((req) => {
                const isSelected = selectedIds.has(req.id);
                const isLoading = actionLoading === req.id;

                return (
                  <div
                    key={req.id}
                    className={`grid grid-cols-[40px_1fr_1fr_80px_80px_100px_140px] gap-2 px-4 py-3 border-b border-zinc-800/50 items-center hover:bg-zinc-800/30 transition-colors ${
                      isSelected ? "bg-violet-500/5" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(req.id)}
                      className="flex items-center"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-violet-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-600" />
                      )}
                    </button>

                    {/* Song */}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {req.songTitle}
                      </div>
                      <div className="text-xs text-zinc-500 truncate">
                        {req.artistName}
                      </div>
                    </div>

                    {/* Requester */}
                    <div className="min-w-0">
                      <div className="text-sm truncate">
                        {req.listenerName || "Anonymous"}
                      </div>
                      {req.message && (
                        <div className="text-xs text-zinc-500 truncate italic">
                          &ldquo;{req.message}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Votes */}
                    <div className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-violet-400">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {req.votes}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          STATUS_COLORS[req.status] || "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="text-xs text-zinc-500">
                      {formatDate(req.createdAt)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 justify-end">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                      ) : (
                        <>
                          {req.status !== "queued" &&
                            req.status !== "played" && (
                              <button
                                onClick={() => updateStatus(req.id, "queued")}
                                title="Approve"
                                className="p-1.5 rounded-md text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                          {req.status !== "played" && (
                            <button
                              onClick={() => updateStatus(req.id, "played")}
                              title="Mark as Played"
                              className="p-1.5 rounded-md text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {req.status !== "rejected" && (
                            <button
                              onClick={() => updateStatus(req.id, "rejected")}
                              title="Reject"
                              className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
