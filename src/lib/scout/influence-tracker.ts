/**
 * Listener Playback Influence Tracker
 *
 * Tracks when listeners play artists' tracks to determine network influence
 * for scout commission bonuses ($2 per influenced upgrade)
 */

import { prisma } from "@/lib/db";

export type PlaybackTrackInfo = {
  trackId?: string;
  trackTitle: string;
  artistId: string;
  artistName: string;
  sessionId?: string;
  duration?: number;
  completedTrack?: boolean;
};

export type NetworkInfluence = {
  hasInfluence: boolean;
  listenerCount: number;
  playbackCount: number;
};

/**
 * Track a listener's playback of a track
 * Creates a ListenerPlayback record for influence bonus calculations
 */
export async function trackListenerPlayback(
  listenerId: string,
  trackInfo: PlaybackTrackInfo
): Promise<void> {
  await prisma.listenerPlayback.create({
    data: {
      listenerId,
      trackId: trackInfo.trackId,
      trackTitle: trackInfo.trackTitle,
      artistId: trackInfo.artistId,
      artistName: trackInfo.artistName,
      sessionId: trackInfo.sessionId,
      duration: trackInfo.duration,
      completedTrack: trackInfo.completedTrack || false,
    },
  });
}

/**
 * Check if a specific listener has played an artist's tracks before a given date
 * Used to determine if a referred listener influenced an artist upgrade
 */
export async function hasListenerInfluence(
  listenerId: string,
  artistId: string,
  beforeDate: Date
): Promise<boolean> {
  const playbackCount = await prisma.listenerPlayback.count({
    where: {
      listenerId,
      artistId,
      playedAt: { lt: beforeDate },
    },
  });

  return playbackCount > 0;
}

/**
 * Get all referred listeners who played an artist's tracks before a given date
 * Returns influence data including listener count and playback count
 */
export async function getNetworkInfluence(
  scoutId: string,
  artistId: string,
  beforeDate: Date
): Promise<NetworkInfluence> {
  // Get all listeners referred by this scout
  const referrals = await prisma.listenerReferral.findMany({
    where: { scoutId },
    select: { listenerId: true },
  });

  if (referrals.length === 0) {
    return {
      hasInfluence: false,
      listenerCount: 0,
      playbackCount: 0,
    };
  }

  const referredListenerIds = referrals.map((r) => r.listenerId);

  // Count playbacks by referred listeners before the date
  const playbackCount = await prisma.listenerPlayback.count({
    where: {
      listenerId: { in: referredListenerIds },
      artistId,
      playedAt: { lt: beforeDate },
    },
  });

  // Count unique listeners who played the artist
  const uniqueListeners = await prisma.listenerPlayback.groupBy({
    by: ["listenerId"],
    where: {
      listenerId: { in: referredListenerIds },
      artistId,
      playedAt: { lt: beforeDate },
    },
  });

  return {
    hasInfluence: playbackCount > 0,
    listenerCount: uniqueListeners.length,
    playbackCount,
  };
}

/**
 * Get playback statistics for a scout's network and a specific artist
 */
export async function getScoutNetworkPlaybackStats(
  scoutId: string,
  artistId: string
) {
  // Get all referred listeners
  const referrals = await prisma.listenerReferral.findMany({
    where: { scoutId },
    select: { listenerId: true },
  });

  if (referrals.length === 0) {
    return {
      totalReferrals: 0,
      listenersWhoPlayed: 0,
      totalPlaybacks: 0,
      averagePlaybacksPerListener: 0,
    };
  }

  const referredListenerIds = referrals.map((r) => r.listenerId);

  // Get total playbacks
  const totalPlaybacks = await prisma.listenerPlayback.count({
    where: {
      listenerId: { in: referredListenerIds },
      artistId,
    },
  });

  // Get unique listeners who played
  const uniqueListeners = await prisma.listenerPlayback.groupBy({
    by: ["listenerId"],
    where: {
      listenerId: { in: referredListenerIds },
      artistId,
    },
  });

  const listenersWhoPlayed = uniqueListeners.length;

  return {
    totalReferrals: referrals.length,
    listenersWhoPlayed,
    totalPlaybacks,
    averagePlaybacksPerListener:
      listenersWhoPlayed > 0 ? totalPlaybacks / listenersWhoPlayed : 0,
  };
}

/**
 * Batch track multiple playbacks (useful for session tracking)
 */
export async function batchTrackPlaybacks(
  playbacks: Array<{
    listenerId: string;
    trackInfo: PlaybackTrackInfo;
  }>
): Promise<void> {
  await prisma.listenerPlayback.createMany({
    data: playbacks.map((p) => ({
      listenerId: p.listenerId,
      trackId: p.trackInfo.trackId,
      trackTitle: p.trackInfo.trackTitle,
      artistId: p.trackInfo.artistId,
      artistName: p.trackInfo.artistName,
      sessionId: p.trackInfo.sessionId,
      duration: p.trackInfo.duration,
      completedTrack: p.trackInfo.completedTrack || false,
    })),
  });
}

/**
 * Get recent playbacks for a listener
 */
export async function getListenerRecentPlaybacks(
  listenerId: string,
  limit: number = 50
) {
  return await prisma.listenerPlayback.findMany({
    where: { listenerId },
    orderBy: { playedAt: "desc" },
    take: limit,
  });
}

/**
 * Get most played artists for a listener
 */
export async function getListenerTopArtists(
  listenerId: string,
  limit: number = 10
) {
  const playbacks = await prisma.listenerPlayback.groupBy({
    by: ["artistId", "artistName"],
    where: { listenerId },
    _count: {
      artistId: true,
    },
    orderBy: {
      _count: {
        artistId: "desc",
      },
    },
    take: limit,
  });

  return playbacks.map((p) => ({
    artistId: p.artistId,
    artistName: p.artistName,
    playCount: p._count.artistId,
  }));
}
