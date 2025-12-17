import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

/**
 * Social Media Discovery Service
 * Discovers artists and sponsors from Instagram, TikTok, and Spotify
 */

export interface DiscoveredArtist {
  name: string;
  source: "instagram" | "tiktok" | "spotify";
  sourceHandle: string;
  sourceUrl: string;
  followerCount?: number;
  engagementRate?: number;
  genre?: string;
  bio?: string;
}

export interface DiscoveredSponsor {
  businessName: string;
  source: string;
  sourceUrl: string;
  businessType?: string;
  city?: string;
  state?: string;
}

class SocialDiscoveryService {
  /**
   * Discover artists from Instagram
   */
  async discoverFromInstagram(hashtags: string[], limit = 50): Promise<DiscoveredArtist[]> {
    if (!env.INSTAGRAM_ACCESS_TOKEN) {
      logger.warn("Instagram access token not configured");
      return [];
    }

    logger.info("Discovering artists from Instagram", { hashtags, limit });

    const discovered: DiscoveredArtist[] = [];

    try {
      // Instagram Graph API integration
      // Search for posts with specific hashtags
      for (const hashtag of hashtags) {
        const response = await fetch(
          `https://graph.instagram.com/ig_hashtag_search?user_id=me&q=${hashtag}&access_token=${env.INSTAGRAM_ACCESS_TOKEN}`
        );

        if (!response.ok) {
          logger.error("Instagram API error", {
            status: response.status,
            hashtag,
          });
          continue;
        }

        const data = await response.json();

        // Get top media for this hashtag
        if (data.data && data.data.length > 0) {
          const hashtagId = data.data[0].id;

          const mediaResponse = await fetch(
            `https://graph.instagram.com/${hashtagId}/top_media?user_id=me&fields=id,caption,username,media_url,permalink&access_token=${env.INSTAGRAM_ACCESS_TOKEN}&limit=${limit}`
          );

          const mediaData = await mediaResponse.json();

          // Extract artist information
          for (const post of mediaData.data || []) {
            discovered.push({
              name: post.username,
              source: "instagram",
              sourceHandle: post.username,
              sourceUrl: post.permalink,
              bio: post.caption?.substring(0, 200),
            });
          }
        }
      }

      logger.info("Instagram discovery complete", {
        found: discovered.length,
      });

    } catch (error) {
      logger.error("Instagram discovery failed", { error });
    }

    return discovered;
  }

  /**
   * Discover artists from TikTok
   */
  async discoverFromTikTok(keywords: string[], limit = 50): Promise<DiscoveredArtist[]> {
    if (!env.TIKTOK_API_KEY) {
      logger.warn("TikTok API key not configured");
      return [];
    }

    logger.info("Discovering artists from TikTok", { keywords, limit });

    const discovered: DiscoveredArtist[] = [];

    try {
      // TikTok API integration
      // Note: Requires TikTok for Developers API access
      for (const keyword of keywords) {
        const response = await fetch(
          `https://open-api.tiktok.com/video/search/?keyword=${encodeURIComponent(keyword)}&count=${limit}`,
          {
            headers: {
              "Authorization": `Bearer ${env.TIKTOK_API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          logger.error("TikTok API error", {
            status: response.status,
            keyword,
          });
          continue;
        }

        const data = await response.json();

        // Extract artist information
        for (const video of data.data?.videos || []) {
          if (video.author) {
            discovered.push({
              name: video.author.nickname || video.author.unique_id,
              source: "tiktok",
              sourceHandle: video.author.unique_id,
              sourceUrl: `https://www.tiktok.com/@${video.author.unique_id}`,
              followerCount: video.author.follower_count,
              bio: video.author.signature,
            });
          }
        }
      }

      logger.info("TikTok discovery complete", {
        found: discovered.length,
      });

    } catch (error) {
      logger.error("TikTok discovery failed", { error });
    }

    return discovered;
  }

  /**
   * Discover artists from Spotify
   */
  async discoverFromSpotify(genres: string[], limit = 50): Promise<DiscoveredArtist[]> {
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
      logger.warn("Spotify credentials not configured");
      return [];
    }

    logger.info("Discovering artists from Spotify", { genres, limit });

    const discovered: DiscoveredArtist[] = [];

    try {
      // Get Spotify access token
      const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(
            `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Search for artists by genre
      for (const genre of genres) {
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=artist&limit=${limit}`,
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          logger.error("Spotify API error", {
            status: response.status,
            genre,
          });
          continue;
        }

        const data = await response.json();

        // Extract artist information
        for (const artist of data.artists?.items || []) {
          discovered.push({
            name: artist.name,
            source: "spotify",
            sourceHandle: artist.id,
            sourceUrl: artist.external_urls?.spotify,
            followerCount: artist.followers?.total,
            genre: artist.genres?.[0],
          });
        }
      }

      logger.info("Spotify discovery complete", {
        found: discovered.length,
      });

    } catch (error) {
      logger.error("Spotify discovery failed", { error });
    }

    return discovered;
  }

  /**
   * Import discovered artists into the database
   */
  async importArtists(artists: DiscoveredArtist[]): Promise<{
    imported: number;
    duplicates: number;
    errors: number;
  }> {
    const results = {
      imported: 0,
      duplicates: 0,
      errors: 0,
    };

    for (const artist of artists) {
      try {
        // Check if artist already exists
        const existing = await prisma.artist.findFirst({
          where: {
            OR: [
              { sourceHandle: artist.sourceHandle },
              { name: artist.name },
            ],
          },
        });

        if (existing) {
          results.duplicates++;
          continue;
        }

        // Create new artist
        await prisma.artist.create({
          data: {
            name: artist.name,
            discoverySource: artist.source,
            sourceUrl: artist.sourceUrl,
            sourceHandle: artist.sourceHandle,
            followerCount: artist.followerCount,
            engagementRate: artist.engagementRate,
            genre: artist.genre,
            bio: artist.bio,
            status: "DISCOVERED",
            pipelineStage: "discovery",
          },
        });

        results.imported++;

        logger.info("Artist imported", {
          name: artist.name,
          source: artist.source,
        });

      } catch (error) {
        logger.error("Failed to import artist", {
          name: artist.name,
          error,
        });
        results.errors++;
      }
    }

    return results;
  }

  /**
   * Run daily discovery automation
   * Searches multiple platforms and imports new artists
   */
  async runDailyDiscovery(): Promise<{
    platforms: Record<string, number>;
    totalDiscovered: number;
    imported: number;
  }> {
    logger.info("Starting daily discovery automation");

    const allDiscovered: DiscoveredArtist[] = [];

    // Instagram discovery
    const instagramHashtags = [
      "americana",
      "countrymusic",
      "singersongwriter",
      "folkmusic",
      "indiecountry",
    ];
    const instagramArtists = await this.discoverFromInstagram(instagramHashtags, 20);
    allDiscovered.push(...instagramArtists);

    // TikTok discovery
    const tiktokKeywords = [
      "country music",
      "americana",
      "folk singer",
      "indie country",
    ];
    const tiktokArtists = await this.discoverFromTikTok(tiktokKeywords, 20);
    allDiscovered.push(...tiktokArtists);

    // Spotify discovery
    const spotifyGenres = [
      "americana",
      "alt-country",
      "folk",
      "singer-songwriter",
    ];
    const spotifyArtists = await this.discoverFromSpotify(spotifyGenres, 20);
    allDiscovered.push(...spotifyArtists);

    // Import into database
    const importResults = await this.importArtists(allDiscovered);

    logger.info("Daily discovery completed", {
      instagram: instagramArtists.length,
      tiktok: tiktokArtists.length,
      spotify: spotifyArtists.length,
      imported: importResults.imported,
    });

    return {
      platforms: {
        instagram: instagramArtists.length,
        tiktok: tiktokArtists.length,
        spotify: spotifyArtists.length,
      },
      totalDiscovered: allDiscovered.length,
      imported: importResults.imported,
    };
  }
}

// Singleton instance
export const socialDiscovery = new SocialDiscoveryService();
