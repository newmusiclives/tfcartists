import { NextResponse } from "next/server";

/**
 * GET /api/docs
 * Returns OpenAPI 3.0 specification for the TrueFans RADIO API.
 */
export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "TrueFans RADIO API",
      version: "1.0.0",
      description: "API for the TrueFans RADIO multi-station network platform. Manages artists, sponsors, listeners, station programming, and AI-powered radio operations.",
      contact: { email: "admin@truefansradio.com" },
    },
    servers: [
      { url: process.env.NEXTAUTH_URL || "https://truefans-radio.netlify.app", description: "Current environment" },
    ],
    tags: [
      { name: "Auth", description: "Authentication (NextAuth)" },
      { name: "Stations", description: "Station management" },
      { name: "Organizations", description: "Multi-tenant operator management" },
      { name: "Operators", description: "Operator signup, login, password reset" },
      { name: "Artists (Riley)", description: "Artist discovery and management" },
      { name: "Sponsors (Harper)", description: "Sponsor acquisition and management" },
      { name: "Rotation (Cassidy)", description: "Music submission review and tier assignment" },
      { name: "Listeners (Elliot)", description: "Listener engagement and analytics" },
      { name: "Station Operations", description: "DJs, songs, clocks, imaging, voice tracks" },
      { name: "Airplay & Revenue", description: "Airplay tiers, earnings, revenue pool" },
      { name: "Gamification", description: "XP, levels, rewards, leaderboard" },
      { name: "Public", description: "Public endpoints (no auth required)" },
      { name: "Cron", description: "Scheduled automation jobs" },
    ],
    components: {
      securitySchemes: {
        session: { type: "apiKey", in: "cookie", name: "next-auth.session-token", description: "NextAuth session cookie" },
        csrf: { type: "apiKey", in: "header", name: "x-csrf-token", description: "CSRF token (must match csrf-token cookie)" },
        cronSecret: { type: "http", scheme: "bearer", description: "CRON_SECRET for automated jobs" },
      },
      schemas: {
        Error: { type: "object", properties: { error: { type: "string" } } },
        Pagination: { type: "object", properties: { page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" }, totalPages: { type: "integer" } } },
      },
    },
    paths: {
      // ── Public ──
      "/api/health": { get: { tags: ["Public"], summary: "Health check", responses: { 200: { description: "OK" } } } },
      "/api/now-playing": { get: { tags: ["Public"], summary: "Current now-playing track info", responses: { 200: { description: "Now playing data" } } } },
      "/api/stations": {
        get: { tags: ["Stations"], summary: "List all stations (org-scoped)", responses: { 200: { description: "Array of stations" } } },
        post: { tags: ["Stations"], summary: "Create a station", security: [{ session: [], csrf: [] }], responses: { 201: { description: "Station created" } } },
      },
      "/api/stations/{id}": {
        get: { tags: ["Stations"], summary: "Get station by ID", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Station details" } } },
        patch: { tags: ["Stations"], summary: "Update station (optimistic locking)", security: [{ session: [], csrf: [] }], responses: { 200: { description: "Updated" }, 409: { description: "Version conflict" } } },
        delete: { tags: ["Stations"], summary: "Soft-delete station", security: [{ session: [], csrf: [] }], responses: { 200: { description: "Deleted" } } },
      },
      // ── Organizations ──
      "/api/organizations": {
        get: { tags: ["Organizations"], summary: "List organizations", security: [{ session: [] }], responses: { 200: { description: "Array of organizations" } } },
        post: { tags: ["Organizations"], summary: "Create organization (admin only)", security: [{ session: [], csrf: [] }], responses: { 201: { description: "Organization created" } } },
      },
      // ── Operators ──
      "/api/operator/signup": { post: { tags: ["Operators"], summary: "Register new operator (creates org + user)", responses: { 201: { description: "Account created, verification email sent" }, 409: { description: "Email or org already exists" } } } },
      "/api/operator/verify-email": { get: { tags: ["Operators"], summary: "Verify email via token", parameters: [{ name: "token", in: "query", required: true, schema: { type: "string" } }], responses: { 302: { description: "Redirects to login" } } } },
      "/api/operator/forgot-password": { post: { tags: ["Operators"], summary: "Request password reset email", responses: { 200: { description: "Always returns success (prevents enumeration)" } } } },
      "/api/operator/reset-password": { post: { tags: ["Operators"], summary: "Reset password with token", responses: { 200: { description: "Password reset" }, 400: { description: "Invalid/expired token" } } } },
      // ── Artists ──
      "/api/artists": {
        get: { tags: ["Artists (Riley)"], summary: "List artists (org-scoped, paginated)", parameters: [{ name: "status", in: "query", schema: { type: "string" } }, { name: "tier", in: "query", schema: { type: "string" } }, { name: "search", in: "query", schema: { type: "string" } }], responses: { 200: { description: "Paginated artists" } } },
        post: { tags: ["Artists (Riley)"], summary: "Create artist", security: [{ session: [], csrf: [] }], responses: { 201: { description: "Artist created" } } },
      },
      "/api/riley/leads": { get: { tags: ["Artists (Riley)"], summary: "List artist leads", security: [{ session: [] }] }, post: { tags: ["Artists (Riley)"], summary: "Create lead", security: [{ session: [], csrf: [] }] } },
      "/api/riley/outreach": { post: { tags: ["Artists (Riley)"], summary: "Trigger AI outreach", security: [{ session: [], csrf: [] }] } },
      "/api/riley/campaigns": { get: { tags: ["Artists (Riley)"], summary: "List campaigns", security: [{ session: [] }] } },
      "/api/riley/stats": { get: { tags: ["Artists (Riley)"], summary: "Riley team stats", security: [{ session: [] }] } },
      // ── Sponsors ──
      "/api/harper/sponsors": {
        get: { tags: ["Sponsors (Harper)"], summary: "List sponsors (org-scoped, paginated)", security: [{ session: [] }] },
        post: { tags: ["Sponsors (Harper)"], summary: "Create sponsor", security: [{ session: [], csrf: [] }] },
      },
      "/api/harper/deals": { get: { tags: ["Sponsors (Harper)"], summary: "List deals", security: [{ session: [] }] }, post: { tags: ["Sponsors (Harper)"], summary: "Create deal", security: [{ session: [], csrf: [] }] } },
      "/api/harper/stats": { get: { tags: ["Sponsors (Harper)"], summary: "Harper team stats", security: [{ session: [] }] } },
      "/api/sponsors/inquiry": { post: { tags: ["Public"], summary: "Submit sponsor inquiry (public form)" } },
      // ── Rotation ──
      "/api/cassidy/submissions": { get: { tags: ["Rotation (Cassidy)"], summary: "List submissions", security: [{ session: [] }] } },
      "/api/cassidy/reviews": { get: { tags: ["Rotation (Cassidy)"], summary: "List reviews", security: [{ session: [] }] }, post: { tags: ["Rotation (Cassidy)"], summary: "Submit review", security: [{ session: [], csrf: [] }] } },
      "/api/cassidy/progression-requests": { get: { tags: ["Rotation (Cassidy)"], summary: "List progression requests", security: [{ session: [] }] } },
      "/api/cassidy/stats": { get: { tags: ["Rotation (Cassidy)"], summary: "Cassidy team stats", security: [{ session: [] }] } },
      // ── Listeners ──
      "/api/listeners": {
        get: { tags: ["Listeners (Elliot)"], summary: "List listeners (auth required, org-scoped)", security: [{ session: [] }] },
        post: { tags: ["Public"], summary: "Register listener (public, rate-limited)" },
      },
      "/api/elliot/analytics": { get: { tags: ["Listeners (Elliot)"], summary: "Listener analytics", security: [{ session: [] }] } },
      "/api/elliot/stats": { get: { tags: ["Listeners (Elliot)"], summary: "Elliot team stats", security: [{ session: [] }] } },
      "/api/embed/listen": {
        post: { tags: ["Public"], summary: "Start embed listening session (CORS-enabled)" },
        patch: { tags: ["Public"], summary: "End embed listening session" },
      },
      // ── Station Operations ──
      "/api/station-songs": { get: { tags: ["Station Operations"], summary: "List songs (by stationId)" }, post: { tags: ["Station Operations"], summary: "Add song", security: [{ session: [], csrf: [] }] } },
      "/api/station-djs": { get: { tags: ["Station Operations"], summary: "List DJs" }, post: { tags: ["Station Operations"], summary: "Create DJ", security: [{ session: [], csrf: [] }] } },
      "/api/clock-templates": { get: { tags: ["Station Operations"], summary: "List clock templates" }, post: { tags: ["Station Operations"], summary: "Create template", security: [{ session: [], csrf: [] }] } },
      "/api/clock-assignments": { get: { tags: ["Station Operations"], summary: "List clock assignments" }, post: { tags: ["Station Operations"], summary: "Create assignment", security: [{ session: [], csrf: [] }] } },
      "/api/voice-tracks": { get: { tags: ["Station Operations"], summary: "List voice tracks", security: [{ session: [] }] } },
      "/api/voice-tracks/generate": { post: { tags: ["Station Operations"], summary: "Generate voice track (AI, rate-limited)" } },
      "/api/sponsor-ads": { get: { tags: ["Station Operations"], summary: "List sponsor ads" }, post: { tags: ["Station Operations"], summary: "Create sponsor ad", security: [{ session: [], csrf: [] }] } },
      "/api/show-transitions": { get: { tags: ["Station Operations"], summary: "List show transitions" } },
      "/api/show-features": { get: { tags: ["Station Operations"], summary: "List show features" } },
      "/api/station-imaging": { get: { tags: ["Station Operations"], summary: "List station imaging" } },
      "/api/music-beds": { get: { tags: ["Station Operations"], summary: "List music beds" } },
      "/api/produced-imaging": { get: { tags: ["Station Operations"], summary: "List produced imaging" } },
      // ── Airplay & Revenue ──
      "/api/airplay/upgrade": { post: { tags: ["Airplay & Revenue"], summary: "Upgrade artist airplay tier", security: [{ session: [], csrf: [] }] } },
      "/api/airplay/earnings": { get: { tags: ["Airplay & Revenue"], summary: "Get artist earnings", security: [{ session: [] }] } },
      "/api/airplay/pool": { get: { tags: ["Airplay & Revenue"], summary: "Get revenue pool stats", security: [{ session: [] }] } },
      // ── Gamification ──
      "/api/gamification/profile": { get: { tags: ["Gamification"], summary: "Get listener XP profile" }, post: { tags: ["Gamification"], summary: "Update XP" } },
      "/api/gamification/leaderboard": { get: { tags: ["Gamification"], summary: "Get leaderboard" } },
      "/api/rewards": { get: { tags: ["Gamification"], summary: "List reward options" }, post: { tags: ["Gamification"], summary: "Redeem reward", security: [{ session: [], csrf: [] }] } },
      // ── Cron ──
      "/api/cron/run-all-daily": { get: { tags: ["Cron"], summary: "Run all daily cron jobs", security: [{ cronSecret: [] }] } },
      "/api/cron/riley-daily": { get: { tags: ["Cron"], summary: "Riley daily outreach", security: [{ cronSecret: [] }] } },
      "/api/cron/harper-daily": { get: { tags: ["Cron"], summary: "Harper daily outreach", security: [{ cronSecret: [] }] } },
      "/api/cron/cassidy-daily": { get: { tags: ["Cron"], summary: "Cassidy daily review", security: [{ cronSecret: [] }] } },
      "/api/cron/voice-tracks-daily": { get: { tags: ["Cron"], summary: "Generate daily voice tracks", security: [{ cronSecret: [] }] } },
      "/api/cron/revenue-monthly": { get: { tags: ["Cron"], summary: "Monthly revenue distribution", security: [{ cronSecret: [] }] } },
      // ── Webhooks ──
      "/api/webhooks/manifest": { post: { tags: ["Public"], summary: "Manifest Financial webhook (signature-verified)" } },
    },
  };

  return NextResponse.json(spec, {
    headers: { "Content-Type": "application/json" },
  });
}
