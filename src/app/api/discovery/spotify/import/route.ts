import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { importArtistCatalog } from "@/lib/discovery/spotify-import";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/discovery/spotify/import
 * Import an artist's top tracks from Spotify into a station's song library.
 *
 * Body (JSON):
 *   spotifyArtistId - Spotify artist ID (required)
 *   stationId       - Target station ID (required)
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["admin", "riley"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { spotifyArtistId, stationId } = body;

  if (!spotifyArtistId || typeof spotifyArtistId !== "string") {
    return NextResponse.json(
      { error: "spotifyArtistId is required and must be a string" },
      { status: 400 }
    );
  }

  if (!stationId || typeof stationId !== "string") {
    return NextResponse.json(
      { error: "stationId is required and must be a string" },
      { status: 400 }
    );
  }

  try {
    const result = await importArtistCatalog(spotifyArtistId, stationId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("[Spotify Import API] Import failed", {
      error,
      spotifyArtistId,
      stationId,
    });

    const message = error instanceof Error ? error.message : String(error);

    // Distinguish between client errors and server errors
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("not configured")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }

    return NextResponse.json(
      { error: "Import failed", details: message },
      { status: 500 }
    );
  }
}
