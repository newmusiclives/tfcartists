import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    name: "TrueFans RADIO API",
    version: "1.0",
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app",
    authentication: "Bearer token via API key (include in Authorization header)",
    endpoints: {
      "Station": {
        "GET /api/stations": "List all stations",
        "GET /api/station": "Get current station info",
      },
      "Now Playing": {
        "GET /api/now-playing": "Current track, artist, DJ (public, no auth)",
        "GET /api/playback": "Recent playback history",
      },
      "Artists": {
        "GET /api/artists": "List artists (auth required)",
        "GET /api/artists/:id": "Get artist details",
        "POST /api/artists": "Create artist record",
      },
      "Sponsors": {
        "GET /api/sponsors": "List sponsors (auth required)",
        "POST /api/sponsors": "Create sponsor record",
      },
      "Schedule": {
        "GET /api/station-schedule": "Get station programming schedule",
        "GET /api/hour-playlists": "Get playlists by date/hour",
      },
      "Playout": {
        "GET /api/playout/hour": "Full program log for one hour (used by streaming backend)",
        "GET /api/playout/schedule": "Full day schedule",
      },
      "Listeners": {
        "POST /api/listeners/sessions": "Start a listening session",
        "PATCH /api/listeners/sessions": "End a listening session",
      },
      "Embed": {
        "GET /embed/player": "Embeddable player widget (iframe)",
        "POST /api/embed/listen": "Track embedded player listen",
      },
      "Health": {
        "GET /api/health": "System health check (public, no auth)",
      },
      "Webhooks": {
        "POST /api/webhooks/manifest": "Manifest Financial payment webhooks",
      },
    },
    webhookEvents: [
      "payment.succeeded",
      "subscription.created",
      "subscription.cancelled",
      "payout.completed",
    ],
    rateLimits: {
      general: "60 requests/minute",
      ai: "10 requests/minute",
      auth: "5 requests/5 minutes",
    },
  });
}
