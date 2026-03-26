import { logger } from "@/lib/logger";
import {
  welcomeEmail,
  artistAcceptedEmail,
  baseTemplate,
} from "@/lib/emails/templates";

const STATION_NAME = process.env.NEXT_PUBLIC_STATION_NAME || "North Country Radio";
const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app";

/**
 * Send a welcome email to a new operator after signup.
 */
export async function sendOperatorWelcomeEmail(email: string, name: string, plan: string) {
  const { subject, html, text } = welcomeEmail(name, STATION_NAME);
  await sendEmail(email, subject, text, html);
}

/**
 * Send notification when an artist submits music.
 */
export async function sendArtistSubmissionNotification(operatorEmail: string, artistName: string, trackTitle: string) {
  const subject = `New Music Submission: ${artistName} — "${trackTitle}"`;
  const textBody = `A new track has been submitted to your station.

Artist: ${artistName}
Track: "${trackTitle}"

Review submissions at ${SITE_URL}/cassidy/submissions

— ${STATION_NAME}`;

  const htmlBody = baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827;">New Music Submission</h2>
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">A new track has been submitted to your station.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; margin: 0 0 16px 0;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 15px; color: #374151;"><strong>Artist:</strong> ${artistName}</p>
          <p style="margin: 0; font-size: 15px; color: #374151;"><strong>Track:</strong> "${trackTitle}"</p>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
      <tr><td align="center">
        <a href="${SITE_URL}/cassidy/submissions" style="display: inline-block; padding: 12px 28px; background-color: ${process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#78350f"}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 6px;">Review Submissions</a>
      </td></tr>
    </table>
  `);

  await sendEmail(operatorEmail, subject, textBody, htmlBody);
}

/**
 * Send notification when a sponsor inquiry comes in.
 */
export async function sendSponsorInquiryNotification(operatorEmail: string, sponsorName: string, businessName: string) {
  const subject = `New Sponsor Inquiry: ${businessName}`;
  const textBody = `A new sponsor is interested in advertising on your station.

Contact: ${sponsorName}
Business: ${businessName}

View sponsor pipeline at ${SITE_URL}/harper/sponsors

— ${STATION_NAME}`;

  const htmlBody = baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827;">New Sponsor Inquiry</h2>
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">A new sponsor is interested in advertising on your station.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; margin: 0 0 16px 0;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 15px; color: #374151;"><strong>Contact:</strong> ${sponsorName}</p>
          <p style="margin: 0; font-size: 15px; color: #374151;"><strong>Business:</strong> ${businessName}</p>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
      <tr><td align="center">
        <a href="${SITE_URL}/harper/sponsors" style="display: inline-block; padding: 12px 28px; background-color: ${process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#78350f"}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 6px;">View Sponsor Pipeline</a>
      </td></tr>
    </table>
  `);

  await sendEmail(operatorEmail, subject, textBody, htmlBody);
}

/**
 * Send welcome email to new artist.
 */
export async function sendArtistWelcomeEmail(email: string, artistName: string) {
  const { subject, html, text } = artistAcceptedEmail(artistName, "free", STATION_NAME);
  await sendEmail(email, subject, text, html);
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
  const textBody = `Hi ${name},

Here's your station report for the past week:

Artists: ${stats.totalArtists} in rotation
Sponsors: ${stats.totalSponsors} active
Revenue: $${stats.weeklyRevenue.toFixed(2)} this week
Listeners: ${stats.listeners} sessions

View full analytics at ${SITE_URL}/operator/analytics

— ${NETWORK_NAME}`;

  const htmlBody = baseTemplate(`
    <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827;">Weekly Station Report</h2>
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">Hi ${name}, here's your station report for the past week:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin: 0 0 16px 0;">
      <tr>
        <td width="50%" style="padding: 16px 8px; text-align: center; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #2563eb;">${stats.totalArtists}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280; text-transform: uppercase;">Artists in Rotation</p>
        </td>
        <td width="50%" style="padding: 16px 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">${stats.totalSponsors}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280; text-transform: uppercase;">Active Sponsors</p>
        </td>
      </tr>
      <tr>
        <td width="50%" style="padding: 16px 8px; text-align: center; border-right: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #d97706;">$${stats.weeklyRevenue.toFixed(2)}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280; text-transform: uppercase;">Weekly Revenue</p>
        </td>
        <td width="50%" style="padding: 16px 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #7c3aed;">${stats.listeners}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280; text-transform: uppercase;">Listener Sessions</p>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
      <tr><td align="center">
        <a href="${SITE_URL}/operator/analytics" style="display: inline-block; padding: 12px 28px; background-color: ${process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#78350f"}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 6px;">View Full Analytics</a>
      </td></tr>
    </table>
  `, "Your weekly station report is ready.");

  await sendEmail(email, subject, textBody, htmlBody);
}

/**
 * Internal email sender — uses GHL API if configured, falls back to logging.
 * Accepts optional pre-built HTML; falls back to converting plain text to HTML.
 */
async function sendEmail(to: string, subject: string, body: string, html?: string) {
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
        html: html || body.replace(/\n/g, "<br>"),
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
