import { messageDelivery } from "./delivery-service";
import { logger } from "@/lib/logger";

/**
 * Automated event notifications via GoHighLevel (GHL).
 *
 * All notifications are fire-and-forget — failures are logged
 * but never block the calling workflow.
 */

// ---------------------------------------------------------------------------
// Cassidy — Submission placed (tier assigned)
// ---------------------------------------------------------------------------
export async function notifyArtistPlaced(params: {
  email?: string;
  phone?: string;
  artistName: string;
  trackTitle: string;
  tierAwarded: string;
  spinsPerWeek: number;
  rationale?: string;
}) {
  const { email, phone, artistName, trackTitle, tierAwarded, spinsPerWeek, rationale } = params;

  const body = [
    `Great news, ${artistName}!`,
    "",
    `Your track "${trackTitle}" has been placed in the TrueFans RADIO rotation.`,
    "",
    `Tier: ${tierAwarded}`,
    `Spins/Week: ${spinsPerWeek}`,
    rationale ? `\nPanel Notes: ${rationale}` : "",
    "",
    "Your music will start airing in the next rotation cycle. Welcome to the TrueFans family!",
    "",
    "— The TrueFans RADIO Team",
  ].join("\n");

  const promises: Promise<unknown>[] = [];

  if (email) {
    promises.push(
      messageDelivery.send({
        to: email,
        content: body,
        channel: "email",
        subject: `Your track "${trackTitle}" has been placed on TrueFans RADIO!`,
        artistName,
        pipelineStage: "placed",
      })
    );
  }

  if (phone) {
    promises.push(
      messageDelivery.send({
        to: phone,
        content: `${artistName} — "${trackTitle}" is now in ${tierAwarded} rotation on TrueFans RADIO with ${spinsPerWeek} spins/week! 🎶`,
        channel: "sms",
        artistName,
        pipelineStage: "placed",
      })
    );
  }

  try {
    await Promise.allSettled(promises);
  } catch (error) {
    logger.warn("notifyArtistPlaced failed", { error, artistName });
  }
}

// ---------------------------------------------------------------------------
// Cassidy — Submission received (pending review)
// ---------------------------------------------------------------------------
export async function notifySubmissionReceived(params: {
  email?: string;
  phone?: string;
  artistName: string;
  trackTitle: string;
}) {
  const { email, phone, artistName, trackTitle } = params;

  const body = [
    `Hi ${artistName},`,
    "",
    `We've received your track "${trackTitle}" and it's now in our review queue.`,
    "",
    "Our 6-person expert panel will review your submission over the next 5-7 days.",
    "You'll receive a notification once a decision has been made.",
    "",
    "— The TrueFans RADIO Team",
  ].join("\n");

  if (email) {
    await messageDelivery.send({
      to: email,
      content: body,
      channel: "email",
      subject: `We received "${trackTitle}" — review in progress`,
      artistName,
    }).catch((e) => logger.warn("notifySubmissionReceived email failed", { error: e }));
  }

  if (phone) {
    await messageDelivery.send({
      to: phone,
      content: `${artistName} — we received "${trackTitle}" for review! Our panel will evaluate it over the next 5-7 days. Stay tuned! 🎵`,
      channel: "sms",
      artistName,
    }).catch((e) => logger.warn("notifySubmissionReceived sms failed", { error: e }));
  }
}

// ---------------------------------------------------------------------------
// Rewards — Redemption confirmed
// ---------------------------------------------------------------------------
export async function notifyRewardRedeemed(params: {
  email?: string;
  listenerName: string;
  rewardName: string;
  xpSpent: number;
}) {
  const { email, listenerName, rewardName, xpSpent } = params;
  if (!email) return;

  const body = [
    `Hey ${listenerName}!`,
    "",
    `Your reward redemption has been confirmed:`,
    "",
    `Reward: ${rewardName}`,
    `XP Spent: ${xpSpent}`,
    "",
    "We'll fulfill your reward shortly. Thanks for being a loyal TrueFans listener!",
    "",
    "— The TrueFans RADIO Team",
  ].join("\n");

  await messageDelivery.send({
    to: email,
    content: body,
    channel: "email",
    subject: `Reward confirmed: ${rewardName}`,
    artistName: listenerName,
  }).catch((e) => logger.warn("notifyRewardRedeemed failed", { error: e }));
}

// ---------------------------------------------------------------------------
// Payments — Subscription activated
// ---------------------------------------------------------------------------
export async function notifySubscriptionActivated(params: {
  email: string;
  name: string;
  tier: string;
  amount: number;
  shares: number;
}) {
  const { email, name, tier, amount, shares } = params;

  const body = [
    `Welcome to ${tier}, ${name}!`,
    "",
    `Your airplay subscription is now active:`,
    "",
    `Tier: ${tier}`,
    `Monthly: $${amount}`,
    `Shares: ${shares}`,
    "",
    "Your music will receive priority rotation based on your tier level.",
    "You can manage your subscription anytime from the Artist Portal.",
    "",
    "— The TrueFans RADIO Team",
  ].join("\n");

  await messageDelivery.send({
    to: email,
    content: body,
    channel: "email",
    subject: `Your ${tier} subscription is active!`,
    artistName: name,
  }).catch((e) => logger.warn("notifySubscriptionActivated failed", { error: e }));
}

// ---------------------------------------------------------------------------
// Payments — Monthly earnings available
// ---------------------------------------------------------------------------
export async function notifyEarningsAvailable(params: {
  email: string;
  artistName: string;
  period: string;
  earnings: number;
  tier: string;
  shares: number;
}) {
  const { email, artistName, period, earnings, tier, shares } = params;

  const body = [
    `Hi ${artistName},`,
    "",
    `Your earnings for ${period} are ready:`,
    "",
    `Tier: ${tier}`,
    `Shares: ${shares}`,
    `Earnings: $${earnings.toFixed(2)}`,
    "",
    "Visit the Artist Portal to view your full earnings history.",
    "",
    "— The TrueFans RADIO Team",
  ].join("\n");

  await messageDelivery.send({
    to: email,
    content: body,
    channel: "email",
    subject: `Your TrueFans earnings for ${period}: $${earnings.toFixed(2)}`,
    artistName,
  }).catch((e) => logger.warn("notifyEarningsAvailable failed", { error: e }));
}

// ---------------------------------------------------------------------------
// Elliot — Welcome new listener
// ---------------------------------------------------------------------------
export async function notifyListenerWelcome(params: {
  email: string;
  name: string;
}) {
  const { email, name } = params;

  const body = [
    `Welcome to TrueFans RADIO, ${name}!`,
    "",
    "You're now part of a community that puts artists first.",
    "",
    "Here's what you can do:",
    "- Listen live and earn XP for every session",
    "- Build listening streaks for bonus XP",
    "- Redeem rewards like merch, shoutouts, and exclusive content",
    "- Climb the leaderboard and unlock badges",
    "",
    "Start listening now at truefans-radio.netlify.app",
    "",
    "— The TrueFans RADIO Team",
  ].join("\n");

  await messageDelivery.send({
    to: email,
    content: body,
    channel: "email",
    subject: "Welcome to TrueFans RADIO!",
    artistName: name,
  }).catch((e) => logger.warn("notifyListenerWelcome failed", { error: e }));
}
