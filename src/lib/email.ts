/**
 * Email Service Helper
 *
 * Uses SendGrid for transactional email delivery.
 * Falls back to console logging when SENDGRID_API_KEY is not configured.
 */

import { logger } from "@/lib/logger";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";
const DEFAULT_FROM_NAME = process.env.SENDGRID_FROM_NAME || "TrueFans Radio";
const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@truefansradio.com";
const DEFAULT_FROM = `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`;

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = params.from || DEFAULT_FROM;

  if (!apiKey) {
    logger.warn("SendGrid not configured - email not sent", {
      to: params.to,
      subject: params.subject,
    });
    return { success: false, error: "SENDGRID_API_KEY not configured" };
  }

  try {
    const response = await fetch(SENDGRID_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: from.match(/<(.+)>/)?.[1] || from, name: from.match(/^(.+?)\s*</)?.[1] },
        subject: params.subject,
        content: [
          ...(params.text ? [{ type: "text/plain", value: params.text }] : []),
          { type: "text/html", value: params.html },
        ],
        ...(params.replyTo ? { reply_to: { email: params.replyTo } } : {}),
      }),
    });

    if (response.ok || response.status === 202) {
      const messageId = response.headers.get("x-message-id") || undefined;
      logger.info("Email sent", { to: params.to, subject: params.subject, messageId });
      return { success: true, messageId };
    }

    const errorBody = await response.text();
    logger.error("SendGrid error", { status: response.status, body: errorBody });
    return { success: false, error: `SendGrid returned ${response.status}` };
  } catch (error) {
    logger.error("Email send failed", { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Convenience methods for common email types

export async function sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: "Welcome to TrueFans Radio!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #92400e;">Welcome to TrueFans Radio, ${name}!</h1>
        <p>We're thrilled to have you join our community of independent artists and music lovers.</p>
        <p>Your journey with TrueFans Radio starts now. Here's what you can do:</p>
        <ul>
          <li>Submit your tracks for airplay consideration</li>
          <li>Connect with our DJ personalities</li>
          <li>Grow your audience through our platform</li>
        </ul>
        <p style="color: #666;">The TrueFans Radio Team</p>
      </div>
    `,
  });
}

export async function sendAirplayConfirmation(
  to: string,
  name: string,
  tier: string
): Promise<EmailResult> {
  const tierNames: Record<string, string> = {
    FREE: "Free (1 share)",
    TIER_5: "$5/month (5 shares)",
    TIER_20: "$20/month (25 shares)",
    TIER_50: "$50/month (75 shares)",
    TIER_120: "$120/month (200 shares)",
  };

  return sendEmail({
    to,
    subject: `Airplay Tier Confirmed: ${tierNames[tier] || tier}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #92400e;">Airplay Confirmed!</h1>
        <p>Hey ${name},</p>
        <p>Your airplay tier has been set to <strong>${tierNames[tier] || tier}</strong>.</p>
        <p>Your music will be featured in our rotation and you'll earn from the artist revenue pool.</p>
        <p style="color: #666;">The TrueFans Radio Team</p>
      </div>
    `,
  });
}

export async function sendEarningsNotification(
  to: string,
  name: string,
  period: string,
  earnings: number
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `Your TrueFans Radio Earnings for ${period}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #92400e;">Earnings Report</h1>
        <p>Hey ${name},</p>
        <p>Your earnings for <strong>${period}</strong> are ready:</p>
        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #92400e;">$${earnings.toFixed(2)}</span>
        </div>
        <p>Payouts are processed within 5 business days.</p>
        <p style="color: #666;">The TrueFans Radio Team</p>
      </div>
    `,
  });
}
