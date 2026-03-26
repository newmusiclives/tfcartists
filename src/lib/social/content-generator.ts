/**
 * Social Media Content Generator
 *
 * Generates platform-aware social posts from station data with appropriate
 * hashtags and character limits.
 */

// ---------------------------------------------------------------------------
// Character limits per platform
// ---------------------------------------------------------------------------

export const CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  facebook: 63206,
  instagram: 2200,
  tiktok: 150,
};

// ---------------------------------------------------------------------------
// Post types
// ---------------------------------------------------------------------------

export type PostType =
  | "nowPlaying"
  | "featuredArtist"
  | "newArtist"
  | "sponsorShoutout"
  | "listenerMilestone";

// ---------------------------------------------------------------------------
// Template data interfaces
// ---------------------------------------------------------------------------

export interface NowPlayingData {
  title: string;
  artist: string;
  stationName: string;
  listenUrl: string;
  djName?: string;
  albumArt?: string;
}

export interface FeaturedArtistData {
  artistName: string;
  bio?: string;
  stationName: string;
  listenUrl: string;
  imageUrl?: string;
}

export interface NewArtistData {
  artistName: string;
  genre?: string;
  stationName: string;
  listenUrl: string;
}

export interface SponsorShoutoutData {
  sponsorName: string;
  stationName: string;
  message?: string;
  listenUrl: string;
}

export interface ListenerMilestoneData {
  milestone: string; // e.g. "10,000 listeners"
  stationName: string;
  listenUrl: string;
}

// ---------------------------------------------------------------------------
// Templates — each returns { text, mediaUrl? }
// ---------------------------------------------------------------------------

const TEMPLATES: Record<
  PostType,
  (data: Record<string, unknown>, platform: string) => { text: string; mediaUrl?: string }
> = {
  nowPlaying: (data, _platform) => {
    const d = data as unknown as NowPlayingData;
    const variants = [
      `Now Playing on ${d.stationName}: "${d.title}" by ${d.artist}${d.djName ? ` | DJ: ${d.djName}` : ""}\n\nListen live: ${d.listenUrl}`,
      `Spinning "${d.title}" by ${d.artist} on ${d.stationName} right now!\n\nTune in: ${d.listenUrl}`,
      `On the air: "${d.title}" by ${d.artist}${d.djName ? ` with ${d.djName}` : ""}\n\n${d.listenUrl}`,
    ];
    const text = variants[Math.floor(Math.random() * variants.length)];
    return { text, mediaUrl: d.albumArt };
  },

  featuredArtist: (data, _platform) => {
    const d = data as unknown as FeaturedArtistData;
    const bioSnippet = d.bio ? ` ${d.bio.slice(0, 100)}...` : "";
    const text = `Featured Artist: ${d.artistName}${bioSnippet}\n\nHear them on ${d.stationName}: ${d.listenUrl}`;
    return { text, mediaUrl: d.imageUrl };
  },

  newArtist: (data, _platform) => {
    const d = data as unknown as NewArtistData;
    const genreTag = d.genre ? ` #${d.genre.replace(/[^a-zA-Z0-9]/g, "")}` : "";
    const text = `Welcome to ${d.stationName}! We just added ${d.artistName} to our rotation.${genreTag}\n\nListen now: ${d.listenUrl}`;
    return { text };
  },

  sponsorShoutout: (data, _platform) => {
    const d = data as unknown as SponsorShoutoutData;
    const msg = d.message || `Thanks to ${d.sponsorName} for supporting independent music!`;
    const text = `${msg}\n\n${d.stationName} is brought to you by ${d.sponsorName}.\n\nListen: ${d.listenUrl}`;
    return { text };
  },

  listenerMilestone: (data, _platform) => {
    const d = data as unknown as ListenerMilestoneData;
    const text = `We just hit ${d.milestone}! Thank you for supporting ${d.stationName} and the independent artists we play.\n\nKeep listening: ${d.listenUrl}`;
    return { text };
  },
};

// ---------------------------------------------------------------------------
// Hashtag sets per post type
// ---------------------------------------------------------------------------

const HASHTAGS: Record<PostType, string[]> = {
  nowPlaying: ["#NowPlaying", "#LiveRadio", "#IndependentMusic"],
  featuredArtist: ["#FeaturedArtist", "#IndieMusic", "#SupportIndieArtists"],
  newArtist: ["#NewMusic", "#NewArtist", "#FreshFinds"],
  sponsorShoutout: ["#Sponsor", "#SupportLocalMusic"],
  listenerMilestone: ["#Milestone", "#ThankYou", "#CommunityRadio"],
};

// ---------------------------------------------------------------------------
// Main generator function
// ---------------------------------------------------------------------------

export interface GeneratedPost {
  text: string;
  mediaUrl?: string;
  postType: PostType;
  platform: string;
}

/**
 * Generate a social media post for a given platform and post type.
 *
 * The text is automatically truncated to fit the platform character limit,
 * and hashtags are appended only if there is enough room.
 */
export function generatePost(
  postType: PostType,
  data: Record<string, unknown>,
  platform: string,
  extraHashtags: string[] = []
): GeneratedPost {
  const templateFn = TEMPLATES[postType];
  if (!templateFn) {
    throw new Error(`Unknown post type: ${postType}`);
  }

  const { text: rawText, mediaUrl } = templateFn(data, platform);

  const charLimit = CHAR_LIMITS[platform] || 280;

  // Build hashtag string
  const allTags = [...HASHTAGS[postType], ...extraHashtags];
  const hashtagStr = allTags.join(" ");

  // Combine text + hashtags, then trim if needed
  let fullText = `${rawText}\n\n${hashtagStr}`;

  if (fullText.length > charLimit) {
    // Try without hashtags first
    if (rawText.length <= charLimit) {
      // Add as many hashtags as will fit
      fullText = rawText;
      for (const tag of allTags) {
        const candidate = `${fullText} ${tag}`;
        if (candidate.length <= charLimit) {
          fullText = candidate;
        } else {
          break;
        }
      }
    } else {
      // Truncate the text itself
      fullText = rawText.slice(0, charLimit - 3) + "...";
    }
  }

  return {
    text: fullText,
    mediaUrl,
    postType,
    platform,
  };
}

/**
 * Convenience: generate a Now Playing post from station/track data.
 */
export function generateNowPlayingPost(
  track: { title: string; artist: string; albumArt?: string; djName?: string },
  station: { name: string; listenUrl: string },
  platform: string,
  extraHashtags: string[] = []
): GeneratedPost {
  return generatePost(
    "nowPlaying",
    {
      title: track.title,
      artist: track.artist,
      stationName: station.name,
      listenUrl: station.listenUrl,
      djName: track.djName,
      albumArt: track.albumArt,
    } as unknown as Record<string, unknown>,
    platform,
    extraHashtags
  );
}
