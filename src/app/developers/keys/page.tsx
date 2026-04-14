"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Key,
  Plus,
  Trash2,
  Loader2,
  Copy,
  Check,
  ArrowLeft,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface ApiKeyEntry {
  id: string;
  name: string;
  stationId: string;
  keyPreview: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface Station {
  id: string;
  name: string;
}

export default function ApiKeyManagementPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStationId, setNewStationId] = useState("");

  // Freshly created key (shown once)
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/developer/keys");
      const data = await res.json();
      if (data.success) {
        setKeys(data.data);
      }
    } catch {
      setError("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStations = useCallback(async () => {
    try {
      const res = await fetch("/api/station");
      const data = await res.json();
      if (data.id) {
        setStations([{ id: data.id, name: data.name }]);
        setNewStationId(data.id);
      }
    } catch {
      // Station fetch failed — user can type manually
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    fetchStations();
  }, [fetchKeys, fetchStations]);

  async function handleCreate() {
    if (!newName.trim() || !newStationId.trim()) return;
    setCreating(true);
    setError(null);
    setFreshKey(null);

    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), stationId: newStationId.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setFreshKey(data.data.key);
        setNewName("");
        setShowForm(false);
        fetchKeys();
      } else {
        setError(data.error || "Failed to create key");
      }
    } catch {
      setError("Failed to create API key");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(keyId: string) {
    if (!confirm("Revoke this API key? Any integration using it will stop working.")) return;
    setDeleting(keyId);

    try {
      const res = await fetch("/api/developer/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();

      if (data.success) {
        setKeys((prev) => prev.filter((k) => k.id !== keyId));
      } else {
        setError(data.error || "Failed to revoke key");
      }
    } catch {
      setError("Failed to revoke API key");
    } finally {
      setDeleting(null);
    }
  }

  function handleCopy() {
    if (!freshKey) return;
    navigator.clipboard.writeText(freshKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/developers"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to API Docs
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Key className="h-7 w-7 text-amber-500" />
            API Key Management
          </h1>
          <p className="text-zinc-400 mt-2">
            Create and manage API keys for the TrueFans RADIO public API.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-300"
            >
              dismiss
            </button>
          </div>
        )}

        {/* Fresh key alert */}
        {freshKey && (
          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <AlertTriangle className="h-4 w-4" />
              Copy your API key now — it will not be shown again
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm font-mono text-zinc-200 break-all">
                {freshKey}
              </code>
              <button
                onClick={handleCopy}
                className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Create button / form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 font-semibold text-white hover:bg-amber-500 transition"
          >
            <Plus className="h-4 w-4" />
            Create New API Key
          </button>
        ) : (
          <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              Create New API Key
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Website Widget, Mobile App"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Station
                </label>
                {stations.length > 0 ? (
                  <select
                    value={newStationId}
                    onChange={(e) => setNewStationId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newStationId}
                    onChange={(e) => setNewStationId(e.target.value)}
                    placeholder="Station ID"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim() || !newStationId.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 font-semibold text-white hover:bg-amber-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                Generate Key
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewName("");
                }}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Keys list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <Key className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No API keys yet.</p>
            <p className="text-zinc-500 text-sm mt-1">
              Create your first key to start using the API.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white mb-3">
              Your API Keys ({keys.length})
            </h2>
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate">
                      {k.name}
                    </span>
                    <code className="text-xs text-zinc-500 font-mono bg-zinc-800 px-2 py-0.5 rounded">
                      {k.keyPreview}
                    </code>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created{" "}
                      {new Date(k.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {k.lastUsedAt && (
                      <span>
                        Last used{" "}
                        {new Date(k.lastUsedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(k.id)}
                  disabled={deleting === k.id}
                  className="rounded-lg border border-zinc-700 p-2 text-zinc-500 hover:text-red-400 hover:border-red-500/50 transition disabled:opacity-50"
                  title="Revoke key"
                >
                  {deleting === k.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
