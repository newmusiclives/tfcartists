import { logger } from "@/lib/logger";

const STATION_NAME = process.env.NEXT_PUBLIC_STATION_NAME || "North Country Radio";
const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app";

/**
 * Send a welcome email to a new operator after signup.
 */
export async function sendOperatorWelcomeEmail(email: string, name: string, plan: string) {
  const subject = `Welcome to ${NETWORK_NAME} — Your Station Awaits`;
  const body = `Hi ${name},

Welcome to ${NETWORK_NAME}! Your ${plan} plan account is ready.

Here's how to get started:
1. Log in at ${SITE_URL}/login
2. Run the Station Wizard to configure your station
3. Import your music library
4. Your AI teams will start working automatically

Your 5 AI teams (Riley, Harper, Cassidy, Elliot, Parker) are standing by to help you build your station.

Questions? Reply to this email or visit ${SITE_URL}/docs

— The ${NETWORK_NAME} Team`;

  await sendEmail(email, subject, body);
}

/**
 * Send notification when an artist submits music.
 */
export async function sendArtistSubmissionNotification(operatorEmail: string, artistName: string, trackTitle: string) {
  const subject = `New Music Submission: ${artistName} — "${trackTitle}"`;
  const body = `A new track has been submitted to your station.

Artist: ${artistName}
Track: "${trackTitle}"

Review submissions at ${SITE_URL}/cassidy/submissions

— ${STATION_NAME}`;

  await sendEmail(operatorEmail, subject, body);
}

/**
 * Send notification when a sponsor inquiry comes in.
 */
export async function sendSponsorInquiryNotification(operatorEmail: string, sponsorName: string, businessName: string) {
  const subject = `New Sponsor Inquiry: ${businessName}`;
  const body = `A new sponsor is interested in advertising on your station.

Contact: ${sponsorName}
Business: ${businessName}

View sponsor pipeline at ${SITE_URL}/harper/sponsors

— ${STATION_NAME}`;

  await sendEmail(operatorEmail, subject, body);
}

/**
 * Send welcome email to new artist.
 */
export async function sendArtistWelcomeEmail(email: string, artistName: string) {
  const subject = `Welcome to ${STATION_NAME}, ${artistName}!`;
  const body = `Hi ${artistName},

Your music has been accepted to ${STATION_NAME}! Here's what happens next:

• Your songs will be added to our rotation
• Our AI DJs will introduce your music to listeners
• You'll earn from our revenue pool based on your airplay tier

Start with our FREE tier and upgrade anytime at ${SITE_URL}/onboard

Listen live: ${SITE_URL}/player

— Team Riley, ${STATION_NAME}`;

  await sendEmail(email, subject, body);
}

/**
 * Send weekly revenue summary to operator.
 */
export async function sendWeeklyRevenueSummary(
  email: string,
  name: string,
  stats: { totalArtists: number; totalSponsors: number; weeklyRevenue: number; listeners: number }
) {
  const subject = `${STATION_NAME} Weekly Report`;
  const body = `Hi ${name},

Here's your station report for the past week:

Artists: ${stats.totalArtists} in rotation
Sponsors: ${stats.totalSponsors} active
Revenue: $${stats.weeklyRevenue.toFixed(2)} this week
Listeners: ${stats.listeners} sessions

View full analytics at ${SITE_URL}/operator/analytics

— ${NETWORK_NAME}`;

  await sendEmail(email, subject, body);
}

/**
 * Internal email sender — uses GHL API if configured, falls back to logging.
 */
async function sendEmail(to: string, subject: string, body: string) {
  const ghlApiKey = process.env.GHL_API_KEY;
  const ghlLocationId = process.env.GHL_LOCATION_ID;

  if (!ghlApiKey || !ghlLocationId) {
    logger.info("Email would be sent (GHL not configured)", { to, subject });
    return;
  }

  try {
    // GHL email API
    const res = await fetch("https://services.leadconnectorhq.com/conversations/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ghlApiKey}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28",
      },
      body: JSON.stringify({
        type: "Email",
        locationId: ghlLocationId,
        contactId: to, // GHL uses contact ID; for direct email, use the email endpoint
        subject,
        body,
        html: body.replace(/\n/g, "<br>"),
      }),
    });

    if (!res.ok) {
      logger.warn("GHL email send failed", { status: res.status, to, subject });
    } else {
      logger.info("Email sent via GHL", { to, subject });
    }
  } catch (error) {
    logger.warn("Email send error", { to, subject, error: String(error) });
  }
}
