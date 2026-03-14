/**
 * Spotify Import for Artist Stations
 *
 * Uses Spotify Web API (client_credentials flow) to search artists,
 * retrieve top tracks, find similar artists, and import catalogs
 * as Song records in the database.
 */

import { prisma } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpotifyArtistResult {
  id: string;
  name: string;
  genres: string[];
  followers: number;
  imageUrl: string | null;
  spotifyUrl: string | null;
  popularity: number;
}

export interface SpotifyTrackResult {
  id: string;
  name: string;
  artistName: string;
  album: string;
  durationMs: number;
  previewUrl: string | null;
  artworkUrl: string | null;
  popularity: number;
  trackNumber: number;
}

export interface SpotifyImportResult {
  imported: number;
  skipped: number;
  tracks: Array<{ title: string; artistName: string; status: "imported" | "skipped" }>;
}

// ---------------------------------------------------------------------------
// Auth — Client Credentials Flow
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const clientId = await getConfig("SPOTIFY_CLIENT_ID");
  const clientSecret = await getConfig("SPOTIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.");
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("[Spotify] Token request failed", { status: res.status, body: text });
    throw new Error(`Spotify authentication failed (${res.status})`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

/**
 * Make an authenticated request to the Spotify Web API
 */
async function spotifyFetch(path: string): Promise<any> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("[Spotify] API error", { path, status: res.status, body: text });
    throw new Error(`Spotify API error (${res.status}): ${text}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search Spotify for an artist by name
 */
export async function searchArtist(name: string): Promise<SpotifyArtistResult[]> {
  const data = await spotifyFetch(
    `/search?q=${encodeURIComponent(name)}&type=artist&limit=10`
  );

  return (data.artists?.items || []).map((a: Record<string, any>) => ({
    id: a.id,
    name: a.name,
    genres: a.genres || [],
    followers: a.followers?.total ?? 0,
    imageUrl: a.images?.[0]?.url || null,
    spotifyUrl: a.external_urls?.spotify || null,
    popularity: a.popularity ?? 0,
  }));
}

/**
 * Get an artist's top tracks (US market by default)
 */
export async function getArtistTopTracks(
  spotifyArtistId: string,
  market: string = "US"
): Promise<SpotifyTrackResult[]> {
  const data = await spotifyFetch(
    `/artists/${encodeURIComponent(spotifyArtistId)}/top-tracks?market=${market}`
  );

  return (data.tracks || []).map((t: Record<string, any>) => ({
    id: t.id,
    name: t.name,
    artistName: t.artists?.[0]?.name || "Unknown",
    album: t.album?.name || null,
    durationMs: t.duration_ms || 0,
    previewUrl: t.preview_url || null,
    artworkUrl: t.album?.images?.[0]?.url || null,
    popularity: t.popularity ?? 0,
    trackNumber: t.track_number ?? 1,
  }));
}

/**
 * Get related/similar artists for a given Spotify artist
 */
export async function getSimilarArtists(
  spotifyArtistId: string
): Promise<SpotifyArtistResult[]> {
  const data = await spotifyFetch(
    `/artists/${encodeURIComponent(spotifyArtistId)}/related-artists`
  );

  return (data.artists || []).map((a: Record<string, any>) => ({
    id: a.id,
    name: a.name,
    genres: a.genres || [],
    followers: a.followers?.total ?? 0,
    imageUrl: a.images?.[0]?.url || null,
    spotifyUrl: a.external_urls?.spotify || null,
    popularity: a.popularity ?? 0,
  }));
}

/**
 * Import an artist's top tracks as Song records for a station.
 * Skips tracks that already exist (matched by title + artistName + stationId).
 */
export async function importArtistCatalog(
  spotifyArtistId: string,
  stationId: string
): Promise<SpotifyImportResult> {
  // Verify station exists
  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) {
    throw new Error(`Station not found: ${stationId}`);
  }

  // Fetch top tracks from Spotify
  const tracks = await getArtistTopTracks(spotifyArtistId);
  if (tracks.length === 0) {
    return { imported: 0, skipped: 0, tracks: [] };
  }

  const result: SpotifyImportResult = { imported: 0, skipped: 0, tracks: [] };

  for (const track of tracks) {
    // Check for existing song to avoid duplicates
    const existing = await prisma.song.findFirst({
      where: {
        stationId,
        title: track.name,
        artistName: track.artistName,
      },
    });

    if (existing) {
      result.skipped++;
      result.tracks.push({ title: track.name, artistName: track.artistName, status: "skipped" });
      logger.debug("[Spotify Import] Skipping duplicate", { title: track.name, artist: track.artistName });
      continue;
    }

    // Create Song record
    await prisma.song.create({
      data: {
        stationId,
        title: track.name,
        artistName: track.artistName,
        album: track.album,
        duration: Math.round(track.durationMs / 1000),
        genre: station.genre || null,
        artworkUrl: track.artworkUrl,
        rotationCategory: "C", // Default to medium rotation for imports
      },
    });

    result.imported++;
    result.tracks.push({ title: track.name, artistName: track.artistName, status: "imported" });
    logger.debug("[Spotify Import] Imported track", { title: track.name, artist: track.artistName });
  }

  logger.info("[Spotify Import] Complete", {
    spotifyArtistId,
    stationId,
    imported: result.imported,
    skipped: result.skipped,
  });

  return result;
}
