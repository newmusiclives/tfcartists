"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Heart,
  Loader2,
  Play,
  CheckCircle2,
  SkipForward,
  Sparkles,
  Music,
  Clock,
  Volume2,
  User,
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
}

interface GeneratedDedication {
  requestId: string;
  voiceTrackId: string;
  scriptText: string;
  audioFilePath: string;
  audioDuration: number;
  djName: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DedicationsPage() {
  const [stationId, setStationId] = useState<string | null>(null);
  const [requests, setRequests] = useState<SongRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Map<string, GeneratedDedication>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

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

  // Fetch requests with dedications
  const fetchRequests = useCallback(async () => {
    if (!stationId) return;
    try {
      const res = await fetch(`/api/requests?stationId=${stationId}`, {
        headers: { "x-csrf-token": getCsrfToken() },
      });
      const data = await res.json();
      const all: SongRequestItem[] = data.requests || [];
      // Only show requests that have a dedication message
      const dedications = all.filter(
        (r) => r.message && r.message.trim().length > 0 && r.listenerName
      );
      setRequests(dedications);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    if (stationId) {
      setLoading(true);
      fetchRequests();
    }
  }, [stationId, fetchRequests]);

  // Generate dedication
  const generateDedication = async (requestId: string) => {
    setGeneratingId(requestId);
    setError(null);
    try {
      const res = await fetch("/api/requests/dedicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate dedication");
        return;
      }
      setGenerated((prev) => {
        const next = new Map(prev);
        next.set(requestId, { requestId, ...data });
        return next;
      });
    } catch {
      setError("Network error generating dedication");
    } finally {
      setGeneratingId(null);
    }
  };

  // Approve dedication (mark as queued — already done by API, just visual)
  const approveDedication = (requestId: string) => {
    setApprovedIds((prev) => new Set(prev).add(requestId));
  };

  // Skip dedication
  const skipDedication = async (requestId: string) => {
    try {
      await fetch("/api/requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({ id: requestId, status: "rejected", rejectedReason: "Dedication skipped" }),
      });
      setSkippedIds((prev) => new Set(prev).add(requestId));
    } catch {
      // silent
    }
  };

  // Split requests into pending and generated
  const pendingRequests = requests.filter(
    (r) =>
      r.status === "pending" &&
      !generated.has(r.id) &&
      !skippedIds.has(r.id)
  );
  const generatedRequests = requests.filter(
    (r) => generated.has(r.id) || r.status === "queued"
  );

  return (
    <>
      <SharedNav />
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 text-white px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500" />
            <div>
              <h1 className="text-2xl font-bold">AI DJ Dedications</h1>
              <p className="text-zinc-400 text-sm">
                Generate personalized DJ voice tracks for listener dedications
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading dedications...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No dedication requests yet.</p>
              <p className="text-sm mt-1">
                Listeners can submit dedications through the request system.
              </p>
            </div>
          ) : (
            <>
              {/* Pending Dedications */}
              {pendingRequests.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Pending Dedications
                    <span className="text-sm font-normal text-zinc-500">
                      ({pendingRequests.length})
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-pink-400" />
                              <span className="font-medium text-pink-300">
                                {req.listenerName}
                              </span>
                              <span className="text-zinc-600 text-xs">
                                {formatDate(req.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              <Music className="w-3.5 h-3.5" />
                              <span>
                                &ldquo;{req.songTitle}&rdquo; by {req.artistName}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-300 bg-zinc-800/50 rounded px-3 py-2 mt-2 italic">
                              &ldquo;{req.message}&rdquo;
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => generateDedication(req.id)}
                              disabled={generatingId !== null}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                            >
                              {generatingId === req.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Generate Dedication
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => skipDedication(req.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-400 transition-colors"
                            >
                              <SkipForward className="w-3.5 h-3.5" />
                              Skip
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Generated Dedications */}
              {generatedRequests.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-emerald-400" />
                    Generated Dedications
                    <span className="text-sm font-normal text-zinc-500">
                      ({generatedRequests.length})
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {generatedRequests.map((req) => {
                      const ded = generated.get(req.id);
                      const isApproved = approvedIds.has(req.id);
                      return (
                        <div
                          key={req.id}
                          className={`bg-zinc-900 border rounded-lg p-4 space-y-3 ${
                            isApproved
                              ? "border-emerald-500/40"
                              : "border-zinc-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-pink-400" />
                                <span className="font-medium text-pink-300">
                                  {req.listenerName}
                                </span>
                                {ded?.djName && (
                                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                                    DJ: {ded.djName}
                                  </span>
                                )}
                                {isApproved && (
                                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Approved
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <Music className="w-3.5 h-3.5" />
                                <span>
                                  &ldquo;{req.songTitle}&rdquo; by {req.artistName}
                                </span>
                              </div>

                              {/* Original message */}
                              <p className="text-xs text-zinc-500 mt-1">
                                Original: &ldquo;{req.message}&rdquo;
                              </p>

                              {/* Generated script */}
                              {ded?.scriptText && (
                                <div className="bg-zinc-800/70 rounded-lg px-3 py-2 mt-2">
                                  <p className="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wide">
                                    DJ Script
                                  </p>
                                  <p className="text-sm text-zinc-200">
                                    {ded.scriptText}
                                  </p>
                                </div>
                              )}

                              {/* Audio player */}
                              {ded?.audioFilePath && (
                                <div className="mt-2">
                                  <audio
                                    controls
                                    src={ded.audioFilePath}
                                    className="w-full h-8"
                                    preload="none"
                                  />
                                  {ded.audioDuration && (
                                    <p className="text-xs text-zinc-600 mt-1">
                                      Duration: {ded.audioDuration}s
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Approve / Skip buttons */}
                            {ded && !isApproved && (
                              <div className="flex flex-col gap-2 shrink-0">
                                <button
                                  onClick={() => approveDedication(req.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => skipDedication(req.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-400 transition-colors"
                                >
                                  <SkipForward className="w-3.5 h-3.5" />
                                  Skip
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Skipped dedications info */}
              {skippedIds.size > 0 && (
                <p className="text-xs text-zinc-600 text-center">
                  {skippedIds.size} dedication{skippedIds.size > 1 ? "s" : ""} skipped this session
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
