import Link from "next/link";
import {
  Code2,
  Key,
  Radio,
  Calendar,
  Music,
  Zap,
  ArrowRight,
  Shield,
  Clock,
} from "lucide-react";

export const metadata = {
  title: "Developer API — TrueFans RADIO",
  description:
    "Build with the TrueFans RADIO API. Access now-playing data, schedules, and station info.",
};

/* ---------- tiny presentational helpers ---------- */

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-300 font-mono leading-relaxed">
      {children}
    </pre>
  );
}

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-3 text-2xl font-bold text-white mb-4">
      <Icon className="h-6 w-6 text-amber-500" />
      {children}
    </h2>
  );
}

/* ---------- endpoint docs data ---------- */

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/now-playing",
    title: "Now Playing",
    description:
      "Returns the currently playing track, the on-air DJ, artwork URL, and listener count.",
    params: "None",
    curl: `curl -H "X-API-Key: tfr_your_key_here" \\
  https://truefans-radio.netlify.app/api/v1/now-playing`,
    response: `{
  "success": true,
  "data": {
    "station": "North Country Radio",
    "status": "on-air",
    "title": "Whiskey River",
    "artist": "Willie Nelson",
    "artworkUrl": "https://cdn.example.com/art.jpg",
    "listenerCount": 42,
    "dj": "Morning Mike",
    "djSlug": "morning-mike",
    "hourOfDay": 9
  },
  "timestamp": "2026-03-25T15:30:00.000Z"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/schedule",
    title: "Schedule",
    description:
      "Returns today's full schedule including DJ shows, clock assignments, and hour-by-hour playlists.",
    params: "None (station is inferred from your API key)",
    curl: `curl -H "X-API-Key: tfr_your_key_here" \\
  https://truefans-radio.netlify.app/api/v1/schedule`,
    response: `{
  "success": true,
  "data": {
    "date": "2026-03-25",
    "shows": [
      {
        "id": "show_1",
        "name": "Morning Americana",
        "dayOfWeek": 3,
        "startTime": "06:00",
        "endTime": "10:00",
        "dj": {
          "id": "dj_1",
          "name": "Morning Mike",
          "slug": "morning-mike",
          "color": "#B45309"
        }
      }
    ],
    "assignments": [],
    "todayPlaylists": [
      { "hour": 6, "status": "aired", "dj": { "name": "Morning Mike", "slug": "morning-mike" } },
      { "hour": 7, "status": "locked", "dj": { "name": "Morning Mike", "slug": "morning-mike" } }
    ]
  },
  "timestamp": "2026-03-25T15:30:00.000Z"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/station",
    title: "Station Info",
    description:
      "Returns station metadata including name, genre, tagline, brand colors, and the live stream URL.",
    params: "None (station is inferred from your API key)",
    curl: `curl -H "X-API-Key: tfr_your_key_here" \\
  https://truefans-radio.netlify.app/api/v1/station`,
    response: `{
  "success": true,
  "data": {
    "id": "station_1",
    "name": "North Country Radio",
    "callSign": "NCR",
    "tagline": "Where the music finds you.",
    "description": "AI-powered Americana and Country radio...",
    "genre": "Americana, Country, Singer-Songwriter",
    "primaryColor": "#B45309",
    "secondaryColor": "#EA580C",
    "streamUrl": "/stream/americana-hq.mp3",
    "isActive": true
  },
  "timestamp": "2026-03-25T15:30:00.000Z"
}`,
  },
];

/* ---------- page ---------- */

export default function DeveloperPortalPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero */}
      <section className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400 ring-1 ring-amber-500/20">
            <Code2 className="h-4 w-4" />
            Developer API
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Build with TrueFans{" "}
            <span className="text-amber-500">RADIO</span> API
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Access real-time now-playing data, schedules, and station info.
            Power widgets, dashboards, mobile apps, and integrations.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/developers/keys"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-500 transition"
            >
              <Key className="h-4 w-4" />
              Get Your API Key
            </Link>
            <a
              href="#endpoints"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 font-semibold text-zinc-200 hover:bg-zinc-800 transition"
            >
              View Endpoints
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-16 space-y-20">
        {/* Authentication */}
        <section>
          <SectionHeading icon={Shield}>Authentication</SectionHeading>
          <div className="space-y-4 text-zinc-300 leading-relaxed">
            <p>
              All API requests require a valid API key. You can pass it in one
              of two ways:
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="text-sm font-semibold text-amber-400 mb-2">
                  Header (recommended)
                </h3>
                <code className="text-sm text-zinc-300">
                  X-API-Key: tfr_your_key_here
                </code>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="text-sm font-semibold text-amber-400 mb-2">
                  Query parameter
                </h3>
                <code className="text-sm text-zinc-300">
                  ?api_key=tfr_your_key_here
                </code>
              </div>
            </div>
            <p>
              Keys are scoped to a station. Create and manage keys on the{" "}
              <Link
                href="/developers/keys"
                className="text-amber-400 underline underline-offset-4 hover:text-amber-300"
              >
                Key Management
              </Link>{" "}
              page.
            </p>
          </div>
        </section>

        {/* Rate Limits */}
        <section>
          <SectionHeading icon={Clock}>Rate Limits</SectionHeading>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-3 text-zinc-300">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-white">
                100 requests per minute
              </span>{" "}
              per API key
            </div>
            <p>
              Rate limit status is returned in every response via headers:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <code className="text-amber-400">X-RateLimit-Limit</code> — maximum
                requests per window
              </li>
              <li>
                <code className="text-amber-400">X-RateLimit-Remaining</code> —
                remaining requests in current window
              </li>
              <li>
                <code className="text-amber-400">X-RateLimit-Reset</code> — unix
                timestamp when the window resets
              </li>
            </ul>
            <p className="text-sm text-zinc-500">
              If you exceed the limit you will receive a{" "}
              <code className="text-zinc-400">429 Too Many Requests</code>{" "}
              response.
            </p>
          </div>
        </section>

        {/* Response Format */}
        <section>
          <SectionHeading icon={Code2}>Response Format</SectionHeading>
          <div className="text-zinc-300 space-y-3">
            <p>
              Every endpoint returns a consistent JSON envelope:
            </p>
            <CodeBlock>
{`{
  "success": true,       // boolean
  "data": { ... },       // payload (omitted on error)
  "error": "...",        // error message (omitted on success)
  "timestamp": "..."     // ISO 8601
}`}
            </CodeBlock>
          </div>
        </section>

        {/* Endpoints */}
        <section id="endpoints">
          <SectionHeading icon={Radio}>Endpoints</SectionHeading>
          <div className="space-y-10">
            {endpoints.map((ep) => (
              <div
                key={ep.path}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
              >
                {/* header bar */}
                <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
                  {ep.path.includes("now-playing") && (
                    <Music className="h-5 w-5 text-amber-500" />
                  )}
                  {ep.path.includes("schedule") && (
                    <Calendar className="h-5 w-5 text-amber-500" />
                  )}
                  {ep.path.includes("station") &&
                    !ep.path.includes("schedule") &&
                    !ep.path.includes("now") && (
                      <Radio className="h-5 w-5 text-amber-500" />
                    )}
                  <span className="rounded bg-emerald-600/20 px-2 py-0.5 text-xs font-bold text-emerald-400 uppercase">
                    {ep.method}
                  </span>
                  <code className="text-sm text-zinc-200 font-mono">
                    {ep.path}
                  </code>
                </div>

                <div className="px-6 py-5 space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {ep.title}
                    </h3>
                    <p className="text-zinc-400 mt-1">{ep.description}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Parameters
                    </h4>
                    <p className="text-sm text-zinc-500">{ep.params}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Example Request
                    </h4>
                    <CodeBlock>{ep.curl}</CodeBlock>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Example Response
                    </h4>
                    <CodeBlock>{ep.response}</CodeBlock>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-10">
            <h2 className="text-2xl font-bold text-white mb-3">
              Ready to get started?
            </h2>
            <p className="text-zinc-400 mb-6">
              Generate your API key and start building in minutes.
            </p>
            <Link
              href="/developers/keys"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-8 py-3 font-semibold text-white hover:bg-amber-500 transition"
            >
              <Key className="h-4 w-4" />
              Get Your API Key
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
