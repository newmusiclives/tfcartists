import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Code, Lock, Key, Webhook, Download, Radio } from "lucide-react";

export const metadata: Metadata = {
  title: "API Documentation",
  description: "REST API reference for the TrueFans Radio platform",
};

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  auth: "api-key" | "session" | "cron" | "public";
  params?: string[];
  body?: string;
  response?: string;
}

const ENDPOINTS: Record<string, Endpoint[]> = {
  "Station": [
    { method: "GET", path: "/api/station", description: "Get station configuration and branding", auth: "public" },
    { method: "GET", path: "/api/v1/station", description: "Public station info (name, genre, stream URL)", auth: "public" },
    { method: "GET", path: "/api/now-playing", description: "Current track, DJ, and listener count", auth: "public" },
    { method: "GET", path: "/api/whats-playing", description: "Now playing, recent tracks, up next, current show", auth: "public" },
    { method: "GET", path: "/api/station-schedule", description: "Full weekly schedule with DJ assignments", auth: "public" },
    { method: "GET", path: "/api/listeners/count", description: "Live listener count from Icecast", auth: "public" },
    { method: "GET", path: "/api/health", description: "Health check endpoint", auth: "public" },
  ],
  "Artists": [
    { method: "GET", path: "/api/artists/[id]", description: "Get artist profile by ID", auth: "session" },
    { method: "PUT", path: "/api/artists/[id]", description: "Update artist profile", auth: "session" },
    { method: "GET", path: "/api/riley/stats", description: "Artist pipeline statistics", auth: "session" },
    { method: "GET", path: "/api/riley/leads", description: "List artist leads and pipeline", auth: "session" },
    { method: "POST", path: "/api/riley/outreach", description: "Initiate outreach to an artist", auth: "session" },
  ],
  "Sponsors": [
    { method: "GET", path: "/api/harper/sponsors", description: "List all sponsors", auth: "session" },
    { method: "GET", path: "/api/harper/sponsors/[id]", description: "Get sponsor details", auth: "session" },
    { method: "POST", path: "/api/harper/close-deal", description: "Close a sponsor deal", auth: "session" },
    { method: "GET", path: "/api/harper/stats", description: "Sponsor revenue statistics", auth: "session" },
  ],
  "Listeners": [
    { method: "GET", path: "/api/elliot/listeners", description: "List listeners with engagement data", auth: "session" },
    { method: "GET", path: "/api/elliot/analytics", description: "Listener analytics and trends", auth: "session" },
    { method: "GET", path: "/api/elliot/stats", description: "Listener growth statistics", auth: "session" },
    { method: "GET", path: "/api/gamification/leaderboard", description: "Listener leaderboard by XP", auth: "public" },
  ],
  "Music & Playback": [
    { method: "GET", path: "/api/station-songs", description: "List songs in the station library", auth: "session" },
    { method: "POST", path: "/api/station-songs/import", description: "Import songs from file upload", auth: "session" },
    { method: "GET", path: "/api/station-djs", description: "List AI DJ personalities", auth: "session" },
    { method: "GET", path: "/api/station-djs/[id]", description: "Get DJ details and voice config", auth: "session" },
    { method: "GET", path: "/api/hour-playlists/[id]", description: "Get hour playlist with track list", auth: "session" },
  ],
  "Airplay & Revenue": [
    { method: "GET", path: "/api/airplay/pool", description: "Current airplay pool status and shares", auth: "session" },
    { method: "GET", path: "/api/airplay/earnings", description: "Artist earnings for a period", auth: "session" },
    { method: "POST", path: "/api/payments/subscribe", description: "Create artist tier subscription (Manifest Financial)", auth: "session" },
    { method: "GET", path: "/api/payments/payouts", description: "List payout history", auth: "session" },
  ],
  "Webhooks": [
    { method: "GET", path: "/api/webhooks/endpoints", description: "List webhook endpoints", auth: "session" },
    { method: "POST", path: "/api/webhooks/endpoints", description: "Create a webhook endpoint", auth: "session", body: '{ name, url, events[] }' },
    { method: "DELETE", path: "/api/webhooks/endpoints?id=xxx", description: "Delete a webhook endpoint", auth: "session" },
    { method: "GET", path: "/api/webhooks/deliveries", description: "List recent webhook deliveries", auth: "session" },
  ],
  "Exports": [
    { method: "GET", path: "/api/exports", description: "Export data as CSV or printable PDF", auth: "session", params: ["type=artists|sponsors|listeners|earnings|playback|financials", "format=csv|pdf", "from=YYYY-MM-DD", "to=YYYY-MM-DD"] },
  ],
  "Embed": [
    { method: "GET", path: "/api/embed/listen", description: "Embeddable player data (now playing, artwork)", auth: "public" },
    { method: "GET", path: "/api/embed/heatmap", description: "Listening heatmap data for embed", auth: "public" },
  ],
  "Newsletter": [
    { method: "POST", path: "/api/newsletter/subscribe", description: "Subscribe to the station newsletter", auth: "public", body: '{ email, name? }' },
    { method: "POST", path: "/api/newsletter/unsubscribe", description: "Unsubscribe from newsletter", auth: "public", body: '{ email }' },
    { method: "GET", path: "/api/newsletter/rss", description: "RSS feed of newsletter editions", auth: "public" },
  ],
  "Social": [
    { method: "POST", path: "/api/social/post", description: "Post to social media platforms", auth: "session", body: '{ platform, content, mediaUrl? }' },
  ],
};

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-800",
  POST: "bg-blue-100 text-blue-800",
  PUT: "bg-amber-100 text-amber-800",
  DELETE: "bg-red-100 text-red-800",
};

const AUTH_LABELS: Record<string, { label: string; color: string }> = {
  "api-key": { label: "API Key", color: "text-purple-600" },
  session: { label: "Session", color: "text-amber-600" },
  cron: { label: "Cron Secret", color: "text-gray-600" },
  public: { label: "Public", color: "text-green-600" },
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/developers" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Code className="w-6 h-6 text-amber-600" />
          <div>
            <h1 className="font-bold text-gray-900">API Reference</h1>
            <p className="text-xs text-gray-500">REST API documentation for TrueFans Radio</p>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Auth overview */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" /> Authentication
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Key className="w-4 h-4 text-purple-600" />
                <span className="font-semibold">API Key</span>
              </div>
              <p className="text-gray-600">Pass <code className="bg-gray-100 px-1 rounded text-xs">Authorization: Bearer YOUR_API_KEY</code> in the request header.</p>
            </div>
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-amber-600" />
                <span className="font-semibold">Session</span>
              </div>
              <p className="text-gray-600">Authenticated via NextAuth session cookie. Login at <code className="bg-gray-100 px-1 rounded text-xs">/login</code> first.</p>
            </div>
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Radio className="w-4 h-4 text-green-600" />
                <span className="font-semibold">Public</span>
              </div>
              <p className="text-gray-600">No authentication required. Rate-limited to 120 requests/minute per IP.</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <p className="font-medium">Webhook Signatures</p>
            <p className="mt-1">All webhook deliveries include <code className="bg-amber-100 px-1 rounded">X-Webhook-Signature</code> (HMAC-SHA256), <code className="bg-amber-100 px-1 rounded">X-Webhook-Event</code>, and <code className="bg-amber-100 px-1 rounded">X-Webhook-Timestamp</code> headers.</p>
          </div>
        </div>

        {/* Endpoints by category */}
        {Object.entries(ENDPOINTS).map(([category, endpoints]) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">{category}</h2>
            <div className="bg-white rounded-xl border overflow-hidden divide-y">
              {endpoints.map((ep, i) => (
                <div key={i} className="px-5 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${METHOD_COLORS[ep.method]}`}>
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono text-gray-800 flex-1">{ep.path}</code>
                    <span className={`text-xs font-medium ${AUTH_LABELS[ep.auth].color}`}>
                      {AUTH_LABELS[ep.auth].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 ml-14">{ep.description}</p>
                  {ep.params && (
                    <p className="text-xs text-gray-400 mt-1 ml-14">
                      Params: {ep.params.join(", ")}
                    </p>
                  )}
                  {ep.body && (
                    <p className="text-xs text-gray-400 mt-1 ml-14">
                      Body: <code className="bg-gray-100 px-1 rounded">{ep.body}</code>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Rate limits */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Rate Limits</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>All API routes are rate-limited to protect service quality:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Global write limit:</strong> 120 POST/PUT/DELETE requests per minute per IP</li>
              <li><strong>API key limit:</strong> 100 requests per minute per key</li>
              <li><strong>Public endpoints:</strong> 120 requests per minute per IP</li>
            </ul>
            <p>Exceeded limits return <code className="bg-gray-100 px-1 rounded">429 Too Many Requests</code> with a <code className="bg-gray-100 px-1 rounded">Retry-After</code> header.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
