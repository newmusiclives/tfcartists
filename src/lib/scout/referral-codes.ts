/**
 * Scout Referral Code System
 *
 * Handles generation and validation of unique referral codes for scouts,
 * and tracks artist and listener referrals.
 */

import { prisma } from "@/lib/db";

/**
 * Generate a unique referral code for a scout
 * Format: SCOUT-{6_RANDOM_CHARS} (e.g., SCOUT-A7X9K2)
 */
export async function generateReferralCode(): Promise<string> {
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const code = `SCOUT-${generateRandomString(6)}`;

    // Check if code is unique
    const existing = await prisma.scout.findUnique({
      where: { referralCode: code },
    });

    if (!existing) {
      return code;
    }

    attempts++;
  }

  // If we couldn't generate a unique code after max attempts, throw error
  throw new Error("Failed to generate unique referral code");
}

/**
 * Validate a referral code and return the scout if valid
 */
export async function validateReferralCode(code: string) {
  if (!code || !code.startsWith("SCOUT-")) {
    return null;
  }

  const scout = await prisma.scout.findUnique({
    where: { referralCode: code },
    include: {
      listener: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Only return active scouts
  if (scout && scout.status === "ACTIVE") {
    return scout;
  }

  return null;
}

/**
 * Track an artist referral from a scout
 * Creates an ArtistDiscovery record linking the scout to the artist
 */
export async function trackArtistReferral(
  referralCode: string,
  artistId: string,
  discoverySource: string,
  options?: {
    sourceUrl?: string;
    notes?: string;
  }
) {
  // Validate the referral code
  const scout = await validateReferralCode(referralCode);

  if (!scout) {
    throw new Error("Invalid or inactive referral code");
  }

  // Check if this discovery already exists
  const existingDiscovery = await prisma.artistDiscovery.findUnique({
    where: {
      scoutId_artistId: {
        scoutId: scout.id,
        artistId,
      },
    },
  });

  if (existingDiscovery) {
    throw new Error("This artist has already been discovered by this scout");
  }

  // Create the artist discovery record
  const discovery = await prisma.artistDiscovery.create({
    data: {
      scoutId: scout.id,
      artistId,
      discoverySource,
      sourceUrl: options?.sourceUrl,
      notes: options?.notes,
      status: "PENDING",
    },
  });

  // Update scout's discovery count
  await prisma.scout.update({
    where: { id: scout.id },
    data: {
      artistDiscoveries: { increment: 1 },
    },
  });

  return discovery;
}

/**
 * Track a listener referral from a scout
 * Creates a ListenerReferral record linking the scout to the new listener
 */
export async function trackListenerReferral(
  referralCode: string,
  listenerId: string,
  referralSource?: string
) {
  // Validate the referral code
  const scout = await validateReferralCode(referralCode);

  if (!scout) {
    throw new Error("Invalid or inactive referral code");
  }

  // Check if this referral already exists
  const existingReferral = await prisma.listenerReferral.findUnique({
    where: {
      scoutId_listenerId: {
        scoutId: scout.id,
        listenerId,
      },
    },
  });

  if (existingReferral) {
    // Referral already tracked, just return it
    return existingReferral;
  }

  // Create the listener referral record
  const referral = await prisma.listenerReferral.create({
    data: {
      scoutId: scout.id,
      listenerId,
      referralSource,
      convertedAt: new Date(), // Mark as converted immediately when they sign up
    },
  });

  // Update scout's referral count
  await prisma.scout.update({
    where: { id: scout.id },
    data: {
      listenerReferrals: { increment: 1 },
    },
  });

  return referral;
}

/**
 * Get scout by referral code
 */
export async function getScoutByReferralCode(code: string) {
  return await prisma.scout.findUnique({
    where: { referralCode: code },
    include: {
      listener: {
        select: {
          id: true,
          name: true,
          email: true,
          tier: true,
        },
      },
    },
  });
}

/**
 * Helper: Generate random alphanumeric string
 */
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
