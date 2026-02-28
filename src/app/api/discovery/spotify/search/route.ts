import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/discovery/spotify/search
 * Live search for Spotify artists by genre or name.
 * Returns results without importing to database.
 *
 * Query params:
 *   q       - search query (artist name or genre:<genre>)
 *   genre   - genre filter (e.g. "americana")
 *   limit   - max results (default 20, max 50)
 *   offset  - pagination offset
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["admin", "riley"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";
  const genre = url.searchParams.get("genre") || "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  if (!query && !genre) {
    return NextResponse.json(
      { error: "Either q or genre parameter required" },
      { status: 400 }
    );
  }

  const clientId = await getConfig("SPOTIFY_CLIENT_ID");
  const clientSecret = await getConfig("SPOTIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Spotify credentials not configured. Add them in Admin Settings." },
      { status: 503 }
    );
  }

  try {
    // Get access token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      logger.error("Spotify token failed", { status: tokenRes.status });
      return NextResponse.json({ error: "Spotify authentication failed" }, { status: 502 });
    }

    const { access_token } = await tokenRes.json();

    // Build search query
    let searchQuery = query;
    if (genre && !query) {
      searchQuery = `genre:${genre}`;
    } else if (genre && query) {
      searchQuery = `${query} genre:${genre}`;
    }

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=artist&limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!searchRes.ok) {
      logger.error("Spotify search failed", { status: searchRes.status });
      return NextResponse.json({ error: "Spotify search failed" }, { status: 502 });
    }

    const data = await searchRes.json();
    const artists = (data.artists?.items || []).map((a: Record<string, any>) => ({
      id: a.id,
      name: a.name,
      followers: a.followers?.total ?? 0,
      genres: a.genres || [],
      imageUrl: a.images?.[0]?.url || null,
      spotifyUrl: a.external_urls?.spotify || null,
      popularity: a.popularity ?? 0,
    }));

    return NextResponse.json({
      artists,
      total: data.artists?.total ?? 0,
      offset,
      limit,
    });
  } catch (error) {
    logger.error("Spotify search error", { error });
    return NextResponse.json(
      { error: "Search failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
