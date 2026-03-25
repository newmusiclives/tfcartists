import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/api-key-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/now-playing
 * Public API: Returns current track, DJ, and listener info.
 * Requires valid API key.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireApiKey(request);

  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error, timestamp: new Date().toISOString() },
      { status: authResult.status, headers: authResult.headers }
    );
  }

  try {
    // Proxy to internal now-playing endpoint
    const internalUrl = new URL("/api/now-playing", request.nextUrl.origin);
    const res = await fetch(internalUrl.toString(), { cache: "no-store" });
    const data = await res.json();

    return NextResponse.json(
      {
        success: true,
        data: {
          station: data.station || null,
          status: data.status || "unknown",
          title: data.title || null,
          artist: data.artist_name || null,
          artworkUrl: data.artwork_url || null,
          listenerCount: data.listener_count || 0,
          dj: data.dj_name || null,
          djSlug: data.djSlug || null,
          hourOfDay: data.hourOfDay || null,
        },
        timestamp: new Date().toISOString(),
      },
      { headers: authResult.headers }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch now-playing data",
        timestamp: new Date().toISOString(),
      },
      { status: 502, headers: authResult.headers }
    );
  }
}
