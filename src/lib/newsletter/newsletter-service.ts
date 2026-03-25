/**
 * Newsletter Service
 *
 * Manages newsletter subscriptions, generates digest content,
 * and sends newsletters via GoHighLevel email delivery.
 */

import { prisma } from "@/lib/db";
import { messageDelivery } from "@/lib/messaging/delivery-service";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Subscription management
// ---------------------------------------------------------------------------

export async function subscribe(params: {
  email: string;
  name?: string;
  organizationId?: string;
  listenerId?: string;
}): Promise<{ success: boolean; alreadySubscribed?: boolean }> {
  const { email, name, organizationId, listenerId } = params;

  const existing = await prisma.newsletterSubscriber.findFirst({
    where: { email, organizationId: organizationId || null },
  });

  if (existing) {
    if (!existing.isActive) {
      await prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: { isActive: true, unsubscribedAt: null, confirmedAt: new Date() },
      });
      return { success: true };
    }
    return { success: true, alreadySubscribed: true };
  }

  await prisma.newsletterSubscriber.create({
    data: {
      email,
      name,
      organizationId: organizationId || null,
      listenerId,
      confirmedAt: new Date(),
    },
  });

  return { success: true };
}

export async function unsubscribe(token: string): Promise<boolean> {
  const sub = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!sub) return false;

  await prisma.newsletterSubscriber.update({
    where: { id: sub.id },
    data: { isActive: false, unsubscribedAt: new Date() },
  });

  return true;
}

export async function updatePreferences(
  token: string,
  prefs: {
    weeklyDigest?: boolean;
    artistSpotlight?: boolean;
    newMusicAlerts?: boolean;
    stationUpdates?: boolean;
  }
): Promise<boolean> {
  const sub = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!sub || !sub.isActive) return false;

  await prisma.newsletterSubscriber.update({
    where: { id: sub.id },
    data: prefs,
  });

  return true;
}

// ---------------------------------------------------------------------------
// Content generation
// ---------------------------------------------------------------------------

export async function generateWeeklyDigest(organizationId?: string): Promise<{
  subject: string;
  html: string;
  text: string;
}> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const orgFilter = organizationId ? { organizationId } : {};

  // Get top played songs this week
  const topSongs = await prisma.song.findMany({
    where: {
      ...orgFilter,
      lastPlayedAt: { gte: oneWeekAgo },
    },
    orderBy: { playCount: "desc" },
    take: 10,
    select: {
      title: true,
      artistName: true,
      playCount: true,
      rotationCategory: true,
    },
  });

  // Get new artists added this week
  const newArtists = await prisma.artist.findMany({
    where: {
      ...orgFilter,
      createdAt: { gte: oneWeekAgo },
      status: { in: ["CONTACTED", "ENGAGED", "QUALIFIED", "ACTIVATED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { name: true, genre: true, discoverySource: true },
  });

  // Get featured content from this week
  const features = await prisma.featureContent.findMany({
    where: {
      createdAt: { gte: oneWeekAgo },
      ...(organizationId ? { station: { organizationId } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      title: true,
      content: true,
      featureType: { select: { name: true, category: true } },
    },
  });

  // Get station info
  const station = await prisma.station.findFirst({
    where: { ...orgFilter, isActive: true },
    select: { name: true, genre: true, callSign: true },
  });

  const stationName = station?.name || "TrueFans RADIO";
  const dateRange = `${formatDate(oneWeekAgo)} - ${formatDate(new Date())}`;

  const subject = `${stationName} Weekly Digest — ${formatDate(new Date())}`;

  // Build HTML content
  const html = buildDigestHtml({
    stationName,
    dateRange,
    topSongs,
    newArtists,
    features,
  });

  // Build plain text version
  const text = buildDigestText({
    stationName,
    dateRange,
    topSongs,
    newArtists,
    features,
  });

  return { subject, html, text };
}

export async function generateArtistSpotlight(organizationId?: string): Promise<{
  subject: string;
  html: string;
  text: string;
} | null> {
  const orgFilter = organizationId ? { organizationId } : {};

  // Pick a featured artist — prefer recently activated artists
  const artist = await prisma.artist.findFirst({
    where: {
      ...orgFilter,
      status: "ACTIVATED",
      deletedAt: null,
    },
    orderBy: { airplayActivatedAt: "desc" },
    select: {
      name: true,
      genre: true,
      bio: true,
      discoverySource: true,
      airplayTier: true,
    },
  });

  if (!artist) return null;

  const station = await prisma.station.findFirst({
    where: { ...orgFilter, isActive: true },
    select: { name: true },
  });

  const stationName = station?.name || "TrueFans RADIO";
  const subject = `Artist Spotlight: ${artist.name} on ${stationName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #b45309;">Artist Spotlight</h1>
      <h2>${escapeHtml(artist.name)}</h2>
      <p style="color: #666;"><strong>Genre:</strong> ${escapeHtml(artist.genre || "Various")}</p>
      ${artist.bio ? `<p>${escapeHtml(artist.bio)}</p>` : ""}
      <p style="color: #666;">
        <strong>Airplay Tier:</strong> ${artist.airplayTier || "Rotation"}
        <br><strong>Discovered via:</strong> ${escapeHtml(artist.discoverySource || "TrueFans")}
      </p>
      <p>Tune in to ${escapeHtml(stationName)} to hear ${escapeHtml(artist.name)} in rotation!</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #999;">
        You're receiving this because you subscribed to ${escapeHtml(stationName)} newsletters.
      </p>
    </div>
  `;

  const text = [
    `ARTIST SPOTLIGHT: ${artist.name}`,
    `Genre: ${artist.genre || "Various"}`,
    artist.bio || "",
    `Airplay Tier: ${artist.airplayTier || "Rotation"}`,
    `Discovered via: ${artist.discoverySource || "TrueFans"}`,
    "",
    `Tune in to ${stationName} to hear ${artist.name} in rotation!`,
  ].join("\n");

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

export async function sendNewsletter(params: {
  type: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  organizationId?: string;
  preferenceKey?: "weeklyDigest" | "artistSpotlight" | "newMusicAlerts" | "stationUpdates";
}): Promise<{ sent: number; errors: number }> {
  const { type, subject, htmlContent, textContent, organizationId, preferenceKey } = params;

  const whereClause: any = {
    isActive: true,
    confirmedAt: { not: null },
  };

  if (organizationId) whereClause.organizationId = organizationId;
  if (preferenceKey) whereClause[preferenceKey] = true;

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: whereClause,
    select: { email: true, name: true, unsubscribeToken: true },
  });

  let sent = 0;
  let errors = 0;

  for (const sub of subscribers) {
    try {
      // Append unsubscribe link
      const unsubLink = `${process.env.NEXTAUTH_URL || "https://truefans-radio.netlify.app"}/newsletter/unsubscribe?token=${sub.unsubscribeToken}`;
      const personalizedHtml = htmlContent.replace(
        "</div>\n  ",
        `<p style="font-size: 12px; color: #999; margin-top: 20px;"><a href="${unsubLink}">Unsubscribe</a> | <a href="${unsubLink}&prefs=1">Manage preferences</a></p></div>\n  `
      );

      await messageDelivery.send({
        to: sub.email,
        content: textContent + `\n\nUnsubscribe: ${unsubLink}`,
        channel: "email",
        subject,
      });

      sent++;
    } catch (error) {
      logger.warn("Newsletter send failed", { email: sub.email, error });
      errors++;
    }
  }

  // Record the edition
  await prisma.newsletterEdition.create({
    data: {
      organizationId: organizationId || null,
      type,
      subject,
      htmlContent,
      textContent,
      sentAt: new Date(),
      recipientCount: sent,
    },
  });

  logger.info("Newsletter sent", { type, sent, errors, subject });
  return { sent, errors };
}

// ---------------------------------------------------------------------------
// RSS Feed
// ---------------------------------------------------------------------------

export async function generateNowPlayingRss(organizationId?: string): Promise<string> {
  const orgFilter = organizationId ? { organizationId } : {};

  const station = await prisma.station.findFirst({
    where: { ...orgFilter, isActive: true },
    select: { name: true, callSign: true, genre: true, tagline: true },
  });

  const recentSongs = await prisma.song.findMany({
    where: {
      ...orgFilter,
      lastPlayedAt: { not: null },
    },
    orderBy: { lastPlayedAt: "desc" },
    take: 20,
    select: {
      title: true,
      artistName: true,
      album: true,
      genre: true,
      lastPlayedAt: true,
    },
  });

  const stationName = station?.name || "TrueFans RADIO";
  const baseUrl = process.env.NEXTAUTH_URL || "https://truefans-radio.netlify.app";

  const items = recentSongs.map((song) => `
    <item>
      <title>${escapeXml(song.title)} - ${escapeXml(song.artistName || "Unknown")}</title>
      <description>${escapeXml(song.album ? `From "${song.album}"` : song.genre || "")}</description>
      <pubDate>${song.lastPlayedAt ? new Date(song.lastPlayedAt).toUTCString() : ""}</pubDate>
      <guid isPermaLink="false">${song.title}-${song.lastPlayedAt?.getTime()}</guid>
    </item>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(stationName)} — Now Playing</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(station?.tagline || `Recently played on ${stationName}`)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/newsletter/rss" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

interface DigestData {
  stationName: string;
  dateRange: string;
  topSongs: { title: string; artistName: string | null; playCount: number }[];
  newArtists: { name: string; genre: string | null }[];
  features: { title: string | null; content: string; featureType: { name: string } }[];
}

function buildDigestHtml(data: DigestData): string {
  const songRows = data.topSongs.map((s, i) =>
    `<tr><td style="padding: 4px 8px;">${i + 1}</td><td style="padding: 4px 8px;">${escapeHtml(s.title)}</td><td style="padding: 4px 8px;">${escapeHtml(s.artistName || "Unknown")}</td><td style="padding: 4px 8px; text-align: center;">${s.playCount}</td></tr>`
  ).join("");

  const artistList = data.newArtists.map(a =>
    `<li><strong>${escapeHtml(a.name)}</strong> (${escapeHtml(a.genre || "Various")})</li>`
  ).join("");

  const featureList = data.features.map(f =>
    `<div style="margin-bottom: 12px;"><strong>${escapeHtml(f.featureType.name)}</strong>${f.title ? `: ${escapeHtml(f.title)}` : ""}<p style="color: #555; margin: 4px 0;">${escapeHtml(f.content.substring(0, 200))}${f.content.length > 200 ? "..." : ""}</p></div>`
  ).join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #b45309, #f59e0b); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0;">${escapeHtml(data.stationName)}</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">Weekly Digest — ${escapeHtml(data.dateRange)}</p>
      </div>

      <div style="padding: 24px; background: #fff; border: 1px solid #e5e7eb;">
        ${data.topSongs.length > 0 ? `
          <h2 style="color: #b45309; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">Top 10 This Week</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead><tr style="background: #f9fafb;"><th style="padding: 4px 8px; text-align: left;">#</th><th style="padding: 4px 8px; text-align: left;">Song</th><th style="padding: 4px 8px; text-align: left;">Artist</th><th style="padding: 4px 8px; text-align: center;">Plays</th></tr></thead>
            <tbody>${songRows}</tbody>
          </table>
        ` : ""}

        ${data.newArtists.length > 0 ? `
          <h2 style="color: #b45309; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">New Artists</h2>
          <ul style="margin-bottom: 24px;">${artistList}</ul>
        ` : ""}

        ${data.features.length > 0 ? `
          <h2 style="color: #b45309; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">Featured This Week</h2>
          ${featureList}
        ` : ""}
      </div>

      <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="font-size: 12px; color: #999; margin: 0;">
          You're receiving this because you subscribed to ${escapeHtml(data.stationName)} newsletters.
        </p>
      </div>
    </div>
  `;
}

function buildDigestText(data: DigestData): string {
  const lines: string[] = [
    `${data.stationName} — Weekly Digest`,
    data.dateRange,
    "",
  ];

  if (data.topSongs.length > 0) {
    lines.push("TOP 10 THIS WEEK", "");
    data.topSongs.forEach((s, i) => {
      lines.push(`  ${i + 1}. ${s.title} - ${s.artistName || "Unknown"} (${s.playCount} plays)`);
    });
    lines.push("");
  }

  if (data.newArtists.length > 0) {
    lines.push("NEW ARTISTS", "");
    data.newArtists.forEach(a => {
      lines.push(`  - ${a.name} (${a.genre || "Various"})`);
    });
    lines.push("");
  }

  if (data.features.length > 0) {
    lines.push("FEATURED THIS WEEK", "");
    data.features.forEach(f => {
      lines.push(`  ${f.featureType.name}${f.title ? `: ${f.title}` : ""}`);
      lines.push(`  ${f.content.substring(0, 150)}${f.content.length > 150 ? "..." : ""}`);
      lines.push("");
    });
  }

  return lines.join("\n");
}
