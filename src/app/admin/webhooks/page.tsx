"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Webhook,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { SharedNav } from "@/components/shared-nav";
import {
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_CATEGORIES,
} from "@/lib/webhooks/events";
import type { WebhookEventType } from "@/lib/webhooks/events";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Endpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
  lastStatus?: "success" | "failed";
}

interface Delivery {
  id: string;
  endpointId: string;
  endpointName: string;
  event: string;
  status: "success" | "failed";
  statusCode?: number;
  timestamp: string;
  duration?: number;
  error?: string;
}

export default function WebhooksAdminPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"endpoints" | "deliveries">("endpoints");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [revealSecrets, setRevealSecrets] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [epRes, delRes] = await Promise.all([
        fetch("/api/webhooks/endpoints"),
        fetch("/api/webhooks/deliveries"),
      ]);
      if (epRes.ok) setEndpoints(await epRes.json());
      if (delRes.ok) {
        const data = await delRes.json();
        setDeliveries(Array.isArray(data) ? data : data.deliveries || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate() {
    if (!formName || !formUrl || formEvents.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/webhooks/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, url: formUrl, events: formEvents }),
      });
      if (res.ok) {
        setShowForm(false);
        setFormName("");
        setFormUrl("");
        setFormEvents([]);
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook endpoint?")) return;
    await fetch(`/api/webhooks/endpoints?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  async function handleTest(endpoint: Endpoint) {
    setTestingId(endpoint.id);
    try {
      await fetch("/api/webhooks/endpoints", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: endpoint.id, action: "test" }),
      });
      fetchData();
    } finally {
      setTestingId(null);
    }
  }

  function toggleEvent(event: string) {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  function toggleSecret(id: string) {
    setRevealSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
      <SharedNav />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Link href="/admin" className="text-gray-500 hover:text-gray-700 dark:text-zinc-300">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Webhook className="w-7 h-7 text-amber-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Webhooks</h1>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Send real-time events to external services, Zapier, or your CRM
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Endpoint
          </button>
        </div>

        {/* Zapier instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-amber-800 text-sm">Zapier / Make / n8n Integration</h3>
          <p className="text-sm text-amber-700 mt-1">
            Create a &quot;Webhooks by Zapier&quot; trigger, copy the webhook URL, and paste it below.
            Select the events you want to forward. Each delivery is signed with HMAC-SHA256 via the
            <code className="bg-amber-100 px-1 rounded">X-Webhook-Signature</code> header.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setTab("endpoints")}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === "endpoints" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Endpoints ({endpoints.length})
          </button>
          <button
            onClick={() => setTab("deliveries")}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === "deliveries" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Delivery History ({deliveries.length})
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border p-6 mb-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">New Webhook Endpoint</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Zapier - New Artists"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">URL</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Events to Subscribe</label>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {Object.entries(WEBHOOK_EVENT_CATEGORIES).map(([key, cat]) => (
                <div key={key} className="border rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{cat.label}</p>
                  {cat.events.map((evt) => (
                    <label key={evt} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formEvents.includes(evt)}
                        onChange={() => toggleEvent(evt)}
                        className="rounded border-gray-300 dark:border-zinc-700 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-gray-700 dark:text-zinc-300">{evt}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={saving || !formName || !formUrl || formEvents.length === 0}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm font-medium"
              >
                {saving ? "Creating..." : "Create Endpoint"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Endpoints list */}
        {tab === "endpoints" && (
          <div className="space-y-4">
            {endpoints.length === 0 && !showForm && (
              <div className="text-center py-12 text-gray-500 dark:text-zinc-500">
                <Webhook className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No webhook endpoints yet</p>
                <p className="text-sm mt-1">Add an endpoint to start receiving real-time events</p>
              </div>
            )}
            {endpoints.map((ep) => (
              <div key={ep.id} className="bg-white dark:bg-zinc-900 rounded-xl border p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${ep.enabled ? "bg-green-500" : "bg-gray-300"}`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{ep.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 font-mono truncate max-w-md">{ep.url}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-zinc-500">
                      <span>{ep.events.length} events</span>
                      <span>|</span>
                      <span>Created {new Date(ep.createdAt).toLocaleDateString()}</span>
                      {ep.lastTriggered && (
                        <>
                          <span>|</span>
                          <span>
                            Last fired {new Date(ep.lastTriggered).toLocaleDateString()}{" "}
                            {ep.lastStatus === "success" ? (
                              <CheckCircle2 className="w-3 h-3 inline text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 inline text-red-500" />
                            )}
                          </span>
                        </>
                      )}
                    </div>
                    {/* Secret */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">Secret:</span>
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                        {revealSecrets.has(ep.id) ? ep.secret : "••••••••••••••••"}
                      </code>
                      <button onClick={() => toggleSecret(ep.id)} className="text-gray-400 hover:text-gray-600 dark:text-zinc-400">
                        {revealSecrets.has(ep.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(ep.secret)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy secret"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Subscribed events */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ep.events.map((evt) => (
                        <span key={evt} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {evt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleTest(ep)}
                      disabled={testingId === ep.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                      title="Send a test ping"
                    >
                      {testingId === ep.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      Test
                    </button>
                    <button
                      onClick={() => handleDelete(ep.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete endpoint"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deliveries list */}
        {tab === "deliveries" && (
          <div>
            <div className="flex justify-end mb-3">
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            {deliveries.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-zinc-500">
                <p>No deliveries yet. Send a test ping to see results here.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-zinc-400">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-zinc-400">Event</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-zinc-400">Endpoint</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-zinc-400">Code</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-zinc-400">Duration</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-zinc-400">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {deliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                        <td className="px-4 py-3">
                          {d.status === "success" ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{d.event}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">{d.endpointName}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-zinc-500">{d.statusCode || "-"}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-zinc-500">{d.duration ? `${d.duration}ms` : "-"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(d.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
