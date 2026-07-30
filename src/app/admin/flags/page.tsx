"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Flag,
  Loader2,
  RefreshCw,
  Lock,
  AlertTriangle,
  DollarSign,
  Radio,
  Share2,
  Scale,
  Settings2,
} from "lucide-react";
import { SharedNav } from "@/components/shared-nav";

interface FlagState {
  key: string;
  label: string;
  description: string;
  category: string;
  scope: string;
  costNote?: string;
  defaultValue: boolean;
  globalValue: boolean | null;
  stationValue: boolean | null;
  effective: boolean;
  lockedByEnv: boolean;
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  monetisation: { label: "Monetisation", icon: <DollarSign className="w-4 h-4" /> },
  programming: { label: "Programming", icon: <Radio className="w-4 h-4" /> },
  distribution: { label: "Distribution", icon: <Share2 className="w-4 h-4" /> },
  rights: { label: "Rights", icon: <Scale className="w-4 h-4" /> },
  platform: { label: "Platform", icon: <Settings2 className="w-4 h-4" /> },
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FlagState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/flags");
      if (!res.ok) {
        setError(res.status === 403 ? "Admin access required" : "Failed to load flags");
        setFlags([]);
        return;
      }
      const data = await res.json();
      setFlags(data.flags ?? []);
    } catch {
      setError("Could not reach the server");
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(f: FlagState, next: boolean | null) {
    setSaving(f.key);
    setError(null);
    try {
      const res = await fetch("/api/admin/flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: f.key, value: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update flag");
        return;
      }
      setFlags((prev) => prev.map((x) => (x.key === f.key ? data.flag : x)));
    } catch {
      setError("Could not reach the server");
    } finally {
      setSaving(null);
    }
  }

  const categories = Array.from(new Set(flags.map((f) => f.category)));

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
            <Flag className="w-7 h-7 text-amber-400" />
            <h1 className="text-3xl font-bold text-zinc-50">Feature Flags</h1>
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
          Turn capabilities on and off without deploying. Changes take effect within 30 seconds.
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
            Loading flags…
          </div>
        ) : (
          categories.map((cat) => (
            <section key={cat} className="mb-10">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-3">
                {CATEGORY_META[cat]?.icon}
                {CATEGORY_META[cat]?.label ?? cat}
              </h2>

              <div className="space-y-3">
                {flags
                  .filter((f) => f.category === cat)
                  .map((f) => (
                    <div
                      key={f.key}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-zinc-50">{f.label}</h3>
                            <code className="text-xs text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                              {f.key}
                            </code>
                            {f.scope === "station" && (
                              <span className="text-xs text-blue-300 bg-blue-950 border border-blue-800 px-1.5 py-0.5 rounded">
                                per-station
                              </span>
                            )}
                            {f.lockedByEnv && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-200 bg-amber-950 border border-amber-800 px-1.5 py-0.5 rounded">
                                <Lock className="w-3 h-3" />
                                env override
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-zinc-300 mt-2">{f.description}</p>

                          {f.costNote && (
                            <p className="text-xs text-amber-300 mt-2 flex items-start gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 shrink-0 mt-px" />
                              {f.costNote}
                            </p>
                          )}

                          <p className="text-xs text-zinc-400 mt-2">
                            {f.globalValue === null
                              ? `Not configured — using default (${f.defaultValue ? "on" : "off"})`
                              : `Set globally to ${f.globalValue ? "on" : "off"}`}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <button
                            role="switch"
                            aria-checked={f.effective}
                            aria-label={`${f.label}: ${f.effective ? "on" : "off"}`}
                            disabled={f.lockedByEnv || saving === f.key}
                            onClick={() => toggle(f, !f.effective)}
                            className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              f.effective ? "bg-green-700" : "bg-zinc-700"
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                                f.effective ? "translate-x-7" : "translate-x-1"
                              }`}
                            />
                          </button>

                          <span
                            className={`text-xs font-medium ${
                              f.effective ? "text-green-400" : "text-zinc-400"
                            }`}
                          >
                            {saving === f.key ? "saving…" : f.effective ? "ON" : "OFF"}
                          </span>

                          {f.globalValue !== null && !f.lockedByEnv && (
                            <button
                              onClick={() => toggle(f, null)}
                              className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                            >
                              reset to default
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ))
        )}

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-300">
          <p className="font-medium text-zinc-100 mb-1">Emergency override</p>
          <p>
            Setting an environment variable such as{" "}
            <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200">
              FLAG_RIGHTS_GATE=false
            </code>{" "}
            beats anything stored here and cannot be changed from this screen. Use it when the
            database is unavailable or a flag needs forcing during an incident.
          </p>
        </div>
      </main>
    </div>
  );
}
