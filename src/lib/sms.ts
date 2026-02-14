/**
 * SMS Service Helper
 *
 * Uses Twilio for SMS delivery.
 * Falls back to console logging when Twilio is not configured.
 */

import { logger } from "@/lib/logger";

interface SendSMSParams {
  to: string;
  body: string;
  from?: string;
}

interface SMSResult {
  success: boolean;
  sid?: string;
  error?: string;
}

export async function sendSMS(params: SendSMSParams): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = params.from || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    logger.warn("Twilio not configured - SMS not sent", {
      to: params.to,
      bodyLength: params.body.length,
    });
    return { success: false, error: "Twilio credentials not configured" };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: params.to,
        From: fromNumber,
        Body: params.body,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      logger.info("SMS sent", { to: params.to, sid: data.sid });
      return { success: true, sid: data.sid };
    }

    logger.error("Twilio error", { status: response.status, error: data });
    return { success: false, error: data.message || `Twilio returned ${response.status}` };
  } catch (error) {
    logger.error("SMS send failed", { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Convenience methods

export async function sendArtistOutreach(to: string, artistName: string): Promise<SMSResult> {
  return sendSMS({
    to,
    body: `Hey ${artistName}! This is Riley from TrueFans Radio. We love your music and think you'd be a great fit for our station. Want to learn more about getting your music on air? Reply YES to chat!`,
  });
}

export async function sendShowReminder(to: string, artistName: string, venue: string): Promise<SMSResult> {
  return sendSMS({
    to,
    body: `Hey ${artistName}! Reminder: Your show at ${venue} is coming up. Remember the magic words: "If you enjoyed tonight, text TRUEFAN to get a free download." Good luck! - TrueFans Radio`,
  });
}

export async function sendEarningsAlert(to: string, name: string, amount: number, period: string): Promise<SMSResult> {
  return sendSMS({
    to,
    body: `${name}, your TrueFans Radio earnings for ${period} are $${amount.toFixed(2)}. Check your dashboard for details. - TrueFans Radio`,
  });
}
