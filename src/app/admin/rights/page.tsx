"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Scale,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { SharedNav } from "@/components/shared-nav";

interface CompositionGap {
  artistId: string;
  artistName: string;
  proAffiliation: string | null;
}

interface RightsSummary {
  gateEnabled: boolean;
  total: number;
  playable: number;
  byStatus: Record<string, number>;
  playableHours: number;
  compositionGaps: CompositionGap[];
  warnings: string[];
}

const STATUS_META: Record<string, { label: string; tone: string }> = {
  owned_ai: { label: "Owned (AI)", tone: "text-green-300 border-green-700 bg-green-950/50" },
  direct_licence: { label: "Direct licence", tone: "text-green-300 border-green-700 bg-green-950/50" },
  public_domain: { label: "Public domain", tone: "text-green-300 border-green-700 bg-green-950/50" },
  unclear: { label: "Unreviewed", tone: "text-amber-200 border-amber-700 bg-amber-950/50" },
  rejected: { label: "Rejected", tone: "text-red-300 border-red-700 bg-red-950/50" },
};

export default function RightsPage() {
  const [summary, setSummary] = useState<RightsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/rights");
      if (!res.ok) {
        setError(res.status === 403 ? "Admin access required" : "Failed to load rights summary");
        return;
      }
      setSummary(await res.json());
    } catch {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clearedCount = summary
    ? (summary.byStatus.owned_ai ?? 0) +
      (summary.byStatus.direct_licence ?? 0) +
      (summary.byStatus.public_domain ?? 0)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950">
      <SharedNav />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to admin
        </Link>

        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <Scale className="w-7 h-7 text-amber-400" />
            <h1 className="text-3xl font-bold text-zinc-50">Music Rights</h1>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        <p className="text-zinc-400 mb-8">
          Only music we own or hold written permission for may go to air.
        </p>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-800 bg-red-950/40 p-4">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-zinc-400 py-12">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading catalogue…
          </div>
        ) : summary ? (
          <>
            {/* Gate state */}
            <div
              className={`mb-6 flex items-start gap-3 rounded-xl border p-5 ${
                summary.gateEnabled
                  ? "border-green-800 bg-green-950/30"
                  : "border-amber-800 bg-amber-950/30"
              }`}
            >
              {summary.gateEnabled ? (
                <ShieldCheck className="w-6 h-6 text-green-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
              )}
              <div>
                <p className="font-semibold text-zinc-50">
                  Rights gate is {summary.gateEnabled ? "ON" : "OFF"}
                </p>
                <p className="text-sm text-zinc-300 mt-1">
                  {summary.gateEnabled
                    ? "Only cleared songs can be broadcast."
                    : "Unreviewed songs can still be broadcast. Turn on the rights_gate flag once the catalogue is cleared."}
                </p>
                <Link
                  href="/admin/flags"
                  className="text-sm text-amber-300 hover:text-amber-200 underline mt-2 inline-block"
                >
                  Manage the rights_gate flag
                </Link>
              </div>
            </div>

            {/* Headline figures */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Stat label="Songs in catalogue" value={summary.total} />
              <Stat label="Cleared" value={clearedCount} tone="text-green-400" />
              <Stat label="Playable now" value={summary.playable} tone="text-green-400" />
              <Stat label="Hours of music" value={summary.playableHours} suffix="h" />
            </div>

            {summary.playable === 0 && summary.total > 0 && (
              <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-700 bg-amber-950/40 p-4">
                <Clock className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-100">
                  Nothing is currently playable. Aim for at least ~140 cleared tracks
                  (about 8 hours) before going live, or the rotation will repeat noticeably.
                </p>
              </div>
            )}

            {/* Status breakdown */}
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-3">
              By rights status
            </h2>
            <div className="space-y-2 mb-8">
              {Object.entries(summary.byStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => {
                  const meta = STATUS_META[status] ?? {
                    label: status,
                    tone: "text-zinc-300 border-zinc-700 bg-zinc-900",
                  };
                  const pct = summary.total ? Math.round((count / summary.total) * 100) : 0;
                  return (
                    <div
                      key={status}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
                    >
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded border ${meta.tone}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-zinc-200 font-semibold tabular-nums">
                        {count.toLocaleString()}{" "}
                        <span className="text-zinc-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Warnings */}
            {summary.warnings.length > 0 && (
              <div className="mb-8 space-y-3">
                {summary.warnings.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-amber-700 bg-amber-950/40 p-4"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-100">{w}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Composition gaps */}
            {summary.compositionGaps.length > 0 && (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-2">
                  Composition rights gaps
                </h2>
                <p className="text-sm text-zinc-300 mb-3">
                  These artists granted the <strong>recording</strong> but not the{" "}
                  <strong>composition</strong>. If they are affiliated to a PRO they often
                  cannot waive it, so a blanket licence may still be required.
                </p>
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                  {summary.compositionGaps.map((g) => (
                    <div
                      key={g.artistId}
                      className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 last:border-b-0 bg-zinc-900"
                    >
                      <span className="text-zinc-100">{g.artistName}</span>
                      <span className="text-xs text-zinc-400">
                        PRO: {g.proAffiliation ?? "unknown"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "text-zinc-50",
  suffix = "",
}: {
  label: string;
  value: number;
  tone?: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className={`text-3xl font-extrabold tabular-nums ${tone}`}>
        {value.toLocaleString()}
        {suffix}
      </div>
      <div className="text-sm text-zinc-300 mt-1 font-medium">{label}</div>
    </div>
  );
}
