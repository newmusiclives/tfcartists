/**
 * Social Media Platform Posting Functions
 *
 * Each function checks for required env vars and skips gracefully if not configured.
 * Returns a standardized result object for every platform.
 */

import { logger } from "@/lib/logger";

export interface SocialPostResult {
  success: boolean;
  postId: string | null;
  platform: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Twitter / X  (API v2 — OAuth 1.0a User Context for tweet creation)
// ---------------------------------------------------------------------------

function buildTwitterOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string>
): string {
  const crypto = require("crypto");

  const apiKey = process.env.TWITTER_API_KEY!;
  const apiSecret = process.env.TWITTER_API_SECRET!;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN!;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET!;

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // Combine oauth + request params, percent-encode, and sort
  const allParams: Record<string, string> = { ...oauthParams, ...params };
  const paramString = Object.keys(allParams)
    .sort()
    .map(
      (k) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`
    )
    .join("&");

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramString),
  ].join("&");

  const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`;
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");

  oauthParams["oauth_signature"] = signature;

  const header = Object.keys(oauthParams)
    .sort()
    .map(
      (k) =>
        `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`
    )
    .join(", ");

  return `OAuth ${header}`;
}

export async function postToTwitter(
  content: string,
  mediaUrl?: string
): Promise<SocialPostResult> {
  const platform = "twitter";

  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    logger.info("Twitter API not configured — skipping");
    return { success: false, postId: null, platform, error: "Not configured" };
  }

  try {
    // If there is media, upload it first via v1.1 media upload
    let mediaId: string | undefined;

    if (mediaUrl) {
      try {
        // Download the image
        const imgRes = await fetch(mediaUrl, { signal: AbortSignal.timeout(10_000) });
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const base64 = buffer.toString("base64");

          const uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
          const uploadBody = new URLSearchParams({
            media_data: base64,
          });

          const uploadAuth = buildTwitterOAuthHeader("POST", uploadUrl, {
            media_data: base64,
          });

          const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              Authorization: uploadAuth,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: uploadBody.toString(),
            signal: AbortSignal.timeout(30_000),
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            mediaId = uploadData.media_id_string;
          } else {
            logger.warn("Twitter media upload failed", {
              status: uploadRes.status,
            });
          }
        }
      } catch (mediaErr) {
        logger.warn("Twitter media upload error", {
          error: mediaErr instanceof Error ? mediaErr.message : String(mediaErr),
        });
      }
    }

    // Post tweet via v2 endpoint
    const tweetUrl = "https://api.twitter.com/2/tweets";
    const tweetBody: Record<string, unknown> = { text: content };
    if (mediaId) {
      tweetBody.media = { media_ids: [mediaId] };
    }

    const authHeader = buildTwitterOAuthHeader("POST", tweetUrl, {});

    const res = await fetch(tweetUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tweetBody),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("x-rate-limit-reset");
      logger.warn("Twitter rate limited", { retryAfter });
      return {
        success: false,
        postId: null,
        platform,
        error: `Rate limited. Retry after ${retryAfter}`,
      };
    }

    if (!res.ok) {
      const errorText = await res.text();
      logger.error("Twitter post failed", { status: res.status, body: errorText });
      return {
        success: false,
        postId: null,
        platform,
        error: `HTTP ${res.status}: ${errorText.slice(0, 200)}`,
      };
    }

    const data = await res.json();
    const postId = data?.data?.id || null;
    logger.info("Twitter post created", { postId });
    return { success: true, postId, platform };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Twitter post error", { error: message });
    return { success: false, postId: null, platform, error: message };
  }
}

// ---------------------------------------------------------------------------
// Facebook  (Graph API — Page Access Token)
// ---------------------------------------------------------------------------

export async function postToFacebook(
  content: string,
  mediaUrl?: string
): Promise<SocialPostResult> {
  const platform = "facebook";

  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!pageToken || !pageId) {
    logger.info("Facebook API not configured — skipping");
    return { success: false, postId: null, platform, error: "Not configured" };
  }

  try {
    let endpoint: string;
    let body: Record<string, string>;

    if (mediaUrl) {
      // Post a photo with caption
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      body = {
        url: mediaUrl,
        caption: content,
        access_token: pageToken,
      };
    } else {
      // Text-only post
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      body = {
        message: content,
        access_token: pageToken,
      };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.status === 429) {
      logger.warn("Facebook rate limited");
      return {
        success: false,
        postId: null,
        platform,
        error: "Rate limited by Facebook",
      };
    }

    const data = await res.json();

    if (!res.ok || data.error) {
      const errMsg = data.error?.message || `HTTP ${res.status}`;
      logger.error("Facebook post failed", { error: errMsg });
      return {
        success: false,
        postId: null,
        platform,
        error: errMsg.slice(0, 200),
      };
    }

    const postId = data.id || data.post_id || null;
    logger.info("Facebook post created", { postId });
    return { success: true, postId, platform };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Facebook post error", { error: message });
    return { success: false, postId: null, platform, error: message };
  }
}

// ---------------------------------------------------------------------------
// Instagram  (Instagram Graph API — Container-based publish flow)
// ---------------------------------------------------------------------------

export async function postToInstagram(
  content: string,
  mediaUrl?: string
): Promise<SocialPostResult> {
  const platform = "instagram";

  const accessToken =
    process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    logger.info("Instagram API not configured — skipping");
    return { success: false, postId: null, platform, error: "Not configured" };
  }

  // Instagram Graph API requires an image — text-only posts are not supported
  if (!mediaUrl) {
    logger.info("Instagram requires an image — skipping text-only post");
    return {
      success: false,
      postId: null,
      platform,
      error: "Image required for Instagram",
    };
  }

  try {
    // Step 1: Create a media container
    const containerUrl = `https://graph.facebook.com/v19.0/${accountId}/media`;
    const containerRes = await fetch(containerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: mediaUrl,
        caption: content,
        access_token: accessToken,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const containerData = await containerRes.json();

    if (!containerRes.ok || containerData.error) {
      const errMsg = containerData.error?.message || `HTTP ${containerRes.status}`;
      logger.error("Instagram container creation failed", { error: errMsg });
      return {
        success: false,
        postId: null,
        platform,
        error: errMsg.slice(0, 200),
      };
    }

    const containerId = containerData.id;

    // Step 2: Wait briefly for container processing, then publish
    // Instagram requires a short delay between container creation and publish
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const publishUrl = `https://graph.facebook.com/v19.0/${accountId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (publishRes.status === 429) {
      logger.warn("Instagram rate limited");
      return {
        success: false,
        postId: null,
        platform,
        error: "Rate limited by Instagram",
      };
    }

    const publishData = await publishRes.json();

    if (!publishRes.ok || publishData.error) {
      const errMsg = publishData.error?.message || `HTTP ${publishRes.status}`;
      logger.error("Instagram publish failed", { error: errMsg });
      return {
        success: false,
        postId: null,
        platform,
        error: errMsg.slice(0, 200),
      };
    }

    const postId = publishData.id || null;
    logger.info("Instagram post created", { postId });
    return { success: true, postId, platform };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Instagram post error", { error: message });
    return { success: false, postId: null, platform, error: message };
  }
}

// ---------------------------------------------------------------------------
// TikTok  (Content Posting API — Direct Post)
// ---------------------------------------------------------------------------

export async function postToTikTok(
  content: string,
  mediaUrl?: string
): Promise<SocialPostResult> {
  const platform = "tiktok";

  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

  if (!accessToken) {
    logger.info("TikTok API not configured — skipping");
    return { success: false, postId: null, platform, error: "Not configured" };
  }

  // TikTok Content Posting API requires a video URL — images/text-only not supported
  if (!mediaUrl) {
    logger.info("TikTok requires a video URL — skipping text-only post");
    return {
      success: false,
      postId: null,
      platform,
      error: "Video URL required for TikTok",
    };
  }

  try {
    // Step 1: Initialize a direct post with a video URL
    const initUrl = "https://open.tiktokapis.com/v2/post/publish/video/init/";
    const initRes = await fetch(initUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: content.slice(0, 150), // TikTok title limit
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: mediaUrl,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (initRes.status === 429) {
      logger.warn("TikTok rate limited");
      return {
        success: false,
        postId: null,
        platform,
        error: "Rate limited by TikTok",
      };
    }

    const initData = await initRes.json();

    if (!initRes.ok || initData.error?.code) {
      const errMsg =
        initData.error?.message || initData.error?.code || `HTTP ${initRes.status}`;
      logger.error("TikTok post failed", { error: errMsg });
      return {
        success: false,
        postId: null,
        platform,
        error: String(errMsg).slice(0, 200),
      };
    }

    const postId = initData.data?.publish_id || null;
    logger.info("TikTok post initiated", { postId });
    return { success: true, postId, platform };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("TikTok post error", { error: message });
    return { success: false, postId: null, platform, error: message };
  }
}

// ---------------------------------------------------------------------------
// Utility: Post to all configured platforms
// ---------------------------------------------------------------------------

export type Platform = "twitter" | "facebook" | "instagram" | "tiktok";

const PLATFORM_FN: Record<
  Platform,
  (content: string, mediaUrl?: string) => Promise<SocialPostResult>
> = {
  twitter: postToTwitter,
  facebook: postToFacebook,
  instagram: postToInstagram,
  tiktok: postToTikTok,
};

/**
 * Post to multiple platforms in parallel.
 * Platforms that are not configured will be skipped gracefully.
 */
export async function postToAllPlatforms(
  platforms: Platform[],
  content: string,
  mediaUrl?: string
): Promise<SocialPostResult[]> {
  const results = await Promise.allSettled(
    platforms.map((p) => {
      const fn = PLATFORM_FN[p];
      return fn ? fn(content, mediaUrl) : Promise.resolve({
        success: false,
        postId: null,
        platform: p,
        error: `Unknown platform: ${p}`,
      } as SocialPostResult);
    })
  );

  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : {
          success: false,
          postId: null,
          platform: platforms[i],
          error: r.reason instanceof Error ? r.reason.message : String(r.reason),
        }
  );
}
