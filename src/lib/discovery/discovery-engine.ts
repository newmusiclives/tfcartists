/**
 * Artist Discovery Engine
 *
 * Scans social platforms and discovers emerging artists.
 * Integrates with Instagram Graph API, TikTok API, and Spotify Web API.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

export interface DiscoveredArtist {
  name: string;
  sourceUrl: string;
  sourceHandle: string;
  platform: "instagram" | "tiktok" | "spotify" | "youtube";
  followerCount?: number;
  engagementRate?: number;
  genre?: string;
  hasLiveShows?: boolean;
  metadata?: Record<string, any>;
}

export class ArtistDiscoveryEngine {
  /**
   * Discover artists from Instagram via Graph API
   * Requires INSTAGRAM_ACCESS_TOKEN with instagram_basic and instagram_manage_insights permissions
   */
  async discoverFromInstagram(
    hashtags: string[] = ["livemusic", "emergingartist", "newmusic"]
  ): Promise<DiscoveredArtist[]> {
    if (!env.INSTAGRAM_ACCESS_TOKEN) {
      logger.debug("[Discovery] Instagram not configured, skipping");
      return [];
    }

    logger.debug("[Discovery] Scanning Instagram for hashtags:", hashtags);
    const discovered: DiscoveredArtist[] = [];

    try {
      for (const tag of hashtags) {
        // Search for hashtag ID
        const hashtagRes = await fetch(
          `https://graph.facebook.com/v19.0/ig_hashtag_search?q=${encodeURIComponent(tag)}&user_id=me&access_token=${env.INSTAGRAM_ACCESS_TOKEN}`
        );

        if (!hashtagRes.ok) {
          logger.warn(`[Discovery] Instagram hashtag search failed for #${tag}`, { status: hashtagRes.status });
          continue;
        }

        const hashtagData = await hashtagRes.json();
        const hashtagId = hashtagData.data?.[0]?.id;
        if (!hashtagId) continue;

        // Get recent media for this hashtag
        const mediaRes = await fetch(
          `https://graph.facebook.com/v19.0/${hashtagId}/recent_media?user_id=me&fields=id,caption,permalink,timestamp,media_type&access_token=${env.INSTAGRAM_ACCESS_TOKEN}`
        );

        if (!mediaRes.ok) continue;

        const mediaData = await mediaRes.json();
        const posts = mediaData.data || [];

        for (const post of posts.slice(0, 10)) {
          const caption = post.caption || "";
          // Look for music-related keywords in captions
          const musicKeywords = ["live show", "new single", "tour", "gig", "songwriter", "original music", "booking"];
          const isMusic = musicKeywords.some(kw => caption.toLowerCase().includes(kw));
          if (!isMusic) continue;

          // Extract username from permalink
          const usernameMatch = post.permalink?.match(/instagram\.com\/([^\/]+)/);
          const handle = usernameMatch?.[1] || "";
          if (!handle || handle === "p") continue;

          discovered.push({
            name: handle,
            sourceUrl: post.permalink || `https://instagram.com/${handle}`,
            sourceHandle: `@${handle}`,
            platform: "instagram",
            hasLiveShows: caption.toLowerCase().includes("live") || caption.toLowerCase().includes("tour"),
            metadata: { hashtag: tag, postId: post.id, caption: caption.slice(0, 200) },
          });
        }
      }
    } catch (error) {
      logger.error("[Discovery] Instagram scan failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Deduplicate by handle
    const unique = new Map<string, DiscoveredArtist>();
    for (const artist of discovered) {
      if (!unique.has(artist.sourceHandle)) {
        unique.set(artist.sourceHandle, artist);
      }
    }

    logger.info(`[Discovery] Instagram found ${unique.size} potential artists`);
    return Array.from(unique.values());
  }

  /**
   * Discover artists from TikTok via Research API
   * Requires TIKTOK_API_KEY with research.data.videos scope
   */
  async discoverFromTikTok(
    hashtags: string[] = ["livemusic", "unsigned", "indieartist"]
  ): Promise<DiscoveredArtist[]> {
    if (!env.TIKTOK_API_KEY) {
      logger.debug("[Discovery] TikTok not configured, skipping");
      return [];
    }

    logger.debug("[Discovery] Scanning TikTok for hashtags:", hashtags);
    const discovered: DiscoveredArtist[] = [];

    try {
      for (const tag of hashtags) {
        const res = await fetch("https://open.tiktokapis.com/v2/research/video/query/", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.TIKTOK_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: {
              and: [
                { field_name: "hashtag_name", operation: "EQ", field_values: [tag] },
              ],
            },
            start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            end_date: new Date().toISOString().split("T")[0],
            max_count: 20,
            fields: "id,video_description,username,like_count,comment_count,share_count,view_count",
          }),
        });

        if (!res.ok) {
          logger.warn(`[Discovery] TikTok search failed for #${tag}`, { status: res.status });
          continue;
        }

        const data = await res.json();
        const videos = data.data?.videos || [];

        for (const video of videos) {
          const desc = video.video_description || "";
          const musicKeywords = ["original", "live", "songwriter", "new song", "music", "singer"];
          const isMusic = musicKeywords.some(kw => desc.toLowerCase().includes(kw));
          if (!isMusic) continue;

          const engagement = video.view_count > 0
            ? ((video.like_count + video.comment_count + video.share_count) / video.view_count) * 100
            : 0;

          discovered.push({
            name: video.username,
            sourceUrl: `https://tiktok.com/@${video.username}`,
            sourceHandle: `@${video.username}`,
            platform: "tiktok",
            engagementRate: Math.round(engagement * 100) / 100,
            metadata: {
              hashtag: tag,
              videoId: video.id,
              views: video.view_count,
              likes: video.like_count,
            },
          });
        }
      }
    } catch (error) {
      logger.error("[Discovery] TikTok scan failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const unique = new Map<string, DiscoveredArtist>();
    for (const artist of discovered) {
      if (!unique.has(artist.sourceHandle)) {
        unique.set(artist.sourceHandle, artist);
      }
    }

    logger.info(`[Discovery] TikTok found ${unique.size} potential artists`);
    return Array.from(unique.values());
  }

  /**
   * Discover artists from Spotify Web API
   * Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET
   */
  async discoverFromSpotify(genres: string[] = ["indie", "alternative", "americana"]): Promise<DiscoveredArtist[]> {
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
      logger.debug("[Discovery] Spotify not configured, skipping");
      return [];
    }

    logger.debug("[Discovery] Scanning Spotify for genres:", genres);
    const discovered: DiscoveredArtist[] = [];

    try {
      // Get access token via client credentials flow
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      if (!tokenRes.ok) {
        logger.warn("[Discovery] Spotify auth failed", { status: tokenRes.status });
        return [];
      }

      const { access_token } = await tokenRes.json();

      for (const genre of genres) {
        // Search for emerging artists (low follower count = emerging)
        const searchRes = await fetch(
          `https://api.spotify.com/v1/search?q=genre%3A${encodeURIComponent(genre)}&type=artist&limit=20`,
          {
            headers: { "Authorization": `Bearer ${access_token}` },
          }
        );

        if (!searchRes.ok) {
          logger.warn(`[Discovery] Spotify search failed for genre: ${genre}`, { status: searchRes.status });
          continue;
        }

        const searchData = await searchRes.json();
        const artists = searchData.artists?.items || [];

        for (const artist of artists) {
          // Filter for emerging artists (under 50k followers)
          if (artist.followers?.total > 50000) continue;
          if (artist.followers?.total < 100) continue; // Too small

          discovered.push({
            name: artist.name,
            sourceUrl: artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`,
            sourceHandle: artist.id,
            platform: "spotify",
            followerCount: artist.followers?.total,
            genre: artist.genres?.[0] || genre,
            metadata: {
              spotifyId: artist.id,
              popularity: artist.popularity,
              genres: artist.genres,
              imageUrl: artist.images?.[0]?.url,
            },
          });
        }
      }
    } catch (error) {
      logger.error("[Discovery] Spotify scan failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    logger.info(`[Discovery] Spotify found ${discovered.length} potential artists`);
    return discovered;
  }

  /**
   * Discover artists from local venue lineups via web scraping
   */
  async discoverFromVenues(venueUrls: string[]): Promise<DiscoveredArtist[]> {
    if (!venueUrls.length) {
      logger.debug("[Discovery] No venue URLs provided, skipping");
      return [];
    }

    logger.debug("[Discovery] Scanning venue lineups:", venueUrls);
    const discovered: DiscoveredArtist[] = [];

    for (const url of venueUrls) {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "TrueFansRadio-ArtistDiscovery/1.0" },
        });

        if (!res.ok) {
          logger.warn(`[Discovery] Venue fetch failed for ${url}`, { status: res.status });
          continue;
        }

        const html = await res.text();

        // Extract artist names from common venue listing patterns
        const artistPatterns = [
          new RegExp('<h[23][^>]*class="[^"]*(?:artist|performer|band|act)[^"]*"[^>]*>([^<]+)', "gi"),
          new RegExp('<span[^>]*class="[^"]*(?:artist|performer|band|act)[^"]*"[^>]*>([^<]+)', "gi"),
          new RegExp('<a[^>]*class="[^"]*(?:artist|performer|band|act)[^"]*"[^>]*>([^<]+)<\\/a>', "gi"),
        ];

        for (const pattern of artistPatterns) {
          let match;
          while ((match = pattern.exec(html)) !== null) {
            const name = match[1].trim();
            if (name.length > 2 && name.length < 60) {
              discovered.push({
                name,
                sourceUrl: url,
                sourceHandle: name.toLowerCase().replace(/\s+/g, ""),
                platform: "youtube", // Using youtube as a generic "web" platform
                hasLiveShows: true,
                metadata: { venueUrl: url, source: "venue_scrape" },
              });
            }
          }
        }
      } catch (error) {
        logger.warn(`[Discovery] Venue scrape failed for ${url}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info(`[Discovery] Venues found ${discovered.length} potential artists`);
    return discovered;
  }

  /**
   * Save discovered artists to database
   */
  async saveDiscoveredArtists(artists: DiscoveredArtist[]): Promise<void> {
    logger.info(`[Discovery] Saving ${artists.length} discovered artists...`);

    for (const artist of artists) {
      // Check if artist already exists
      const existing = await prisma.artist.findFirst({
        where: {
          OR: [
            { sourceUrl: artist.sourceUrl },
            { sourceHandle: artist.sourceHandle },
          ],
        },
      });

      if (existing) {
        logger.debug(`[Discovery] Artist already exists: ${artist.name}`);
        continue;
      }

      // Create new artist
      await prisma.artist.create({
        data: {
          name: artist.name,
          discoverySource: artist.platform,
          sourceUrl: artist.sourceUrl,
          sourceHandle: artist.sourceHandle,
          followerCount: artist.followerCount,
          engagementRate: artist.engagementRate,
          genre: artist.genre,
          hasLiveShows: artist.hasLiveShows || false,
          status: "DISCOVERED",
          pipelineStage: "discovery",
          metadata: artist.metadata,
        },
      });

      // Log discovery
      await prisma.rileyActivity.create({
        data: {
          action: "discovered_artist",
          details: {
            platform: artist.platform,
            source: artist.sourceUrl,
          },
        },
      });

      logger.info(`[Discovery] Created artist: ${artist.name}`);
    }
  }

  /**
   * Run full discovery cycle across all platforms
   */
  async runDiscoveryCycle(): Promise<number> {
    logger.debug("[Discovery] Starting discovery cycle...");

    const discovered: DiscoveredArtist[] = [];

    // Run discovery on each platform (skips automatically if not configured)
    const instagram = await this.discoverFromInstagram();
    const tiktok = await this.discoverFromTikTok();
    const spotify = await this.discoverFromSpotify();

    discovered.push(...instagram, ...tiktok, ...spotify);

    // Save to database
    await this.saveDiscoveredArtists(discovered);

    logger.info(`[Discovery] Cycle complete. Found ${discovered.length} new artists.`);
    return discovered.length;
  }
}

// Singleton instance
export const discoveryEngine = new ArtistDiscoveryEngine();
