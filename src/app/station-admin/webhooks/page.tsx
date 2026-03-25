"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Webhook,
  Plus,
  Trash2,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";

interface WebhookEndpoint {
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

interface WebhookDelivery {
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

const ALL_EVENTS = [
  "song.played",
  "sponsor.new",
  "artist.new",
  "request.submitted",
  "listener.milestone",
  "ad.played",
] as const;

const EVENT_DESCRIPTIONS: Record<string, string> = {
  "song.played": "Fired when a song finishes playing on air",
  "sponsor.new": "Fired when a new sponsor signs a deal",
  "artist.new": "Fired when a new artist is added to the station",
  "request.submitted": "Fired when a listener submits a song request",
  "listener.milestone": "Fired when a listener reaches a listening milestone",
  "ad.played": "Fired when a sponsor ad plays on air",
};

const EVENT_EXAMPLES: Record<string, object> = {
  "song.played": {
    songId: "clx123abc",
    title: "Summer Breeze",
    artist: "The Sunny Days",
    duration: 234,
    playedAt: "2026-03-25T12:00:00Z",
  },
  "sponsor.new": {
    sponsorId: "clx456def",
    name: "Acme Corp",
    dealValue: 500,
    startDate: "2026-03-25T12:00:00Z",
  },
  "artist.new": {
    artistId: "clx789ghi",
    name: "New Artist",
    genre: "Indie Rock",
    submittedAt: "2026-03-25T12:00:00Z",
  },
  "request.submitted": {
    requestId: "clx012jkl",
    songTitle: "Midnight Drive",
    requestedBy: "listener42",
    submittedAt: "2026-03-25T12:00:00Z",
  },
  "listener.milestone": {
    listenerId: "clx345mno",
    milestone: "100_hours",
    totalHours: 100,
    achievedAt: "2026-03-25T12:00:00Z",
  },
  "ad.played": {
    adId: "clx678pqr",
    sponsorName: "Acme Corp",
    duration: 30,
    playedAt: "2026-03-25T12:00:00Z",
  },
};

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

function truncateUrl(url: string, maxLen = 45): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen) + "...";
}

function EventBadge({ event }: { event: string }) {
  const colors: Record<string, string> = {
    "song.played": "bg-blue-900/40 text-blue-300 border-blue-700/50",
    "sponsor.new": "bg-green-900/40 text-green-300 border-green-700/50",
    "artist.new": "bg-purple-900/40 text-purple-300 border-purple-700/50",
    "request.submitted": "bg-amber-900/40 text-amber-300 border-amber-700/50",
    "listener.milestone": "bg-pink-900/40 text-pink-300 border-pink-700/50",
    "ad.played": "bg-cyan-900/40 text-cyan-300 border-cyan-700/50",
  };
  return (
    <span
      className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${
        colors[event] || "bg-zinc-800 text-zinc-300 border-zinc-700"
      }`}
    >
      {event}
    </span>
  );
}

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEventRef, setShowEventRef] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add form state
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [epRes, delRes] = await Promise.all([
        fetch("/api/webhooks/config"),
        fetch("/api/webhooks/config"), // deliveries come from same list for now
      ]);
      if (epRes.ok) {
        const data = await epRes.json();
        setEndpoints(data.endpoints || []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!formName || !formUrl || formEvents.size === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/webhooks/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          url: formUrl,
          events: Array.from(formEvents),
        }),
      });
      if (res.ok) {
        setFormName("");
        setFormUrl("");
        setFormEvents(new Set());
        setShowAddForm(false);
        await fetchData();
      }
    } catch {
      // ignore
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/webhooks/config", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // ignore
    }
    setDeletingId(null);
  };

  const handleTest = async (endpointId: string) => {
    setTestingId(endpointId);
    try {
      await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointId }),
      });
      await fetchData();
    } catch {
      // ignore
    }
    setTestingId(null);
  };

  const toggleEvent = (event: string) => {
    setFormEvents((prev) => {
      const next = new Set(prev);
      if (next.has(event)) {
        next.delete(event);
      } else {
        next.add(event);
      }
      return next;
    });
  };

  const toggleSecret = (id: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copySecret = (id: string, secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <SharedNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <Webhook className="w-6 h-6 text-amber-500" />
              Webhook Integrations
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Connect TrueFans Radio events to Zapier, Make, or any HTTP endpoint
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Endpoint
            </button>
          </div>
        </div>

        {/* Add Endpoint Form */}
        {showAddForm && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">New Webhook Endpoint</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Zapier Song Notifications"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-zinc-400 mb-2">Subscribe to Events</label>
              <div className="flex flex-wrap gap-2">
                {ALL_EVENTS.map((event) => (
                  <label
                    key={event}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                      formEvents.has(event)
                        ? "bg-amber-600/20 border-amber-500 text-amber-300"
                        : "bg-zinc-800 border-zinc-600 text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formEvents.has(event)}
                      onChange={() => toggleEvent(event)}
                      className="sr-only"
                    />
                    <span>{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              A signing secret will be auto-generated. Use it to verify webhook authenticity via the X-Webhook-Signature header (HMAC-SHA256).
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAdd}
                disabled={saving || !formName || !formUrl || formEvents.size === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Endpoint
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Endpoints Table */}
        {loading && endpoints.length === 0 ? (
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : endpoints.length === 0 ? (
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-12 text-center">
            <Webhook className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No webhook endpoints configured.</p>
            <p className="text-zinc-500 text-sm mt-1">
              Add an endpoint to start sending events to external services.
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-zinc-700">
              <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Configured Endpoints ({endpoints.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-800/50 border-b border-zinc-700">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-zinc-400">Name</th>
                    <th className="text-left px-6 py-3 font-medium text-zinc-400">URL</th>
                    <th className="text-left px-6 py-3 font-medium text-zinc-400">Events</th>
                    <th className="text-left px-6 py-3 font-medium text-zinc-400">Secret</th>
                    <th className="text-left px-6 py-3 font-medium text-zinc-400">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-zinc-400">Last Triggered</th>
                    <th className="text-right px-6 py-3 font-medium text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {endpoints.map((ep) => (
                    <tr key={ep.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-zinc-100">{ep.name}</td>
                      <td className="px-6 py-3 text-zinc-400 font-mono text-xs">
                        {truncateUrl(ep.url)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-1">
                          {ep.events.map((ev) => (
                            <EventBadge key={ev} event={ev} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-zinc-500">
                            {revealedSecrets.has(ep.id)
                              ? ep.secret.slice(0, 16) + "..."
                              : "********"}
                          </span>
                          <button
                            onClick={() => toggleSecret(ep.id)}
                            className="p-0.5 text-zinc-500 hover:text-zinc-300"
                            title={revealedSecrets.has(ep.id) ? "Hide" : "Reveal"}
                          >
                            {revealedSecrets.has(ep.id) ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => copySecret(ep.id, ep.secret)}
                            className="p-0.5 text-zinc-500 hover:text-zinc-300"
                            title="Copy secret"
                          >
                            {copiedId === ep.id ? (
                              <CheckCircle className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {ep.lastStatus === "success" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full border border-green-700/50">
                            <CheckCircle className="w-3 h-3" /> OK
                          </span>
                        ) : ep.lastStatus === "failed" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full border border-red-700/50">
                            <XCircle className="w-3 h-3" /> Failed
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">Never fired</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-zinc-500 text-xs">
                        {ep.lastTriggered ? formatTime(ep.lastTriggered) : "---"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleTest(ep.id)}
                            disabled={testingId === ep.id}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors disabled:opacity-50"
                            title="Send test ping"
                          >
                            {testingId === ep.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(ep.id)}
                            disabled={deletingId === ep.id}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors disabled:opacity-50"
                            title="Delete endpoint"
                          >
                            {deletingId === ep.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Deliveries */}
        {endpoints.some((ep) => ep.lastTriggered) && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-zinc-700">
              <h2 className="text-sm font-semibold text-zinc-200">Recent Deliveries</h2>
            </div>
            <div className="divide-y divide-zinc-800">
              {endpoints
                .filter((ep) => ep.lastTriggered)
                .sort((a, b) => new Date(b.lastTriggered!).getTime() - new Date(a.lastTriggered!).getTime())
                .slice(0, 20)
                .map((ep) => (
                  <div key={ep.id + ep.lastTriggered} className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {ep.lastStatus === "success" ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <div>
                        <span className="text-sm text-zinc-200">{ep.name}</span>
                        <span className="text-xs text-zinc-500 ml-2">{truncateUrl(ep.url, 30)}</span>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {ep.lastTriggered ? formatTime(ep.lastTriggered) : ""}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Event Reference */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden">
          <button
            onClick={() => setShowEventRef(!showEventRef)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
          >
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Event Reference
            </h2>
            {showEventRef ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          {showEventRef && (
            <div className="border-t border-zinc-700 divide-y divide-zinc-800">
              {ALL_EVENTS.map((event) => (
                <div key={event} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <EventBadge event={event} />
                    <span className="text-sm text-zinc-300">{EVENT_DESCRIPTIONS[event]}</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Example Payload</div>
                    <pre className="text-xs font-mono bg-zinc-800 border border-zinc-700 rounded-lg p-3 overflow-x-auto text-zinc-300">
{JSON.stringify(
  { event, timestamp: "2026-03-25T12:00:00.000Z", data: EVENT_EXAMPLES[event] },
  null,
  2
)}
                    </pre>
                  </div>
                </div>
              ))}
              <div className="px-6 py-4">
                <h3 className="text-xs font-semibold text-zinc-300 mb-2">Signature Verification</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every webhook includes an <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-400">X-Webhook-Signature</code> header
                  containing an HMAC-SHA256 hex digest of the request body, signed with your endpoint secret.
                  Verify by computing <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-400">HMAC-SHA256(body, secret)</code> and
                  comparing the result to the header value.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
