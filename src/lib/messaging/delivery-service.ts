import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Message delivery service for SMS, Email, and Instagram
 * Integrates with Twilio, SendGrid, and Instagram API
 */

export type MessageChannel = "sms" | "email" | "instagram";

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  channel: MessageChannel;
}

export interface MessagePayload {
  to: string; // Phone number, email, or Instagram handle
  content: string;
  channel: MessageChannel;
  from?: string; // Optional custom sender
  subject?: string; // Optional subject for email
}

class MessageDeliveryService {
  /**
   * Send a message via the specified channel
   */
  async send(payload: MessagePayload): Promise<DeliveryResult> {
    const { channel, to, content, from, subject } = payload;

    logger.info("Attempting message delivery", {
      channel,
      to: this.maskSensitiveData(to),
      contentLength: content.length,
    });

    try {
      switch (channel) {
        case "sms":
          return await this.sendSMS(to, content, from);
        case "email":
          return await this.sendEmail(to, content, from, subject);
        case "instagram":
          return await this.sendInstagram(to, content);
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }
    } catch (error) {
      logger.error("Message delivery failed", {
        channel,
        to: this.maskSensitiveData(to),
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        channel,
      };
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendSMS(
    to: string,
    content: string,
    from?: string
  ): Promise<DeliveryResult> {
    // Check if Twilio is configured
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
      logger.warn("Twilio not configured, skipping SMS delivery", { to });
      return {
        success: false,
        error: "Twilio credentials not configured",
        channel: "sms",
      };
    }

    try {
      // Import Twilio dynamically
      const twilio = await import("twilio");
      const client = twilio.default(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

      // Send SMS
      const message = await client.messages.create({
        to,
        from: from || env.TWILIO_PHONE_NUMBER,
        body: content,
      });

      logger.info("SMS sent successfully", {
        messageId: message.sid,
        to: this.maskSensitiveData(to),
        status: message.status,
      });

      return {
        success: true,
        messageId: message.sid,
        channel: "sms",
      };
    } catch (error) {
      logger.error("Twilio SMS delivery failed", {
        to: this.maskSensitiveData(to),
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Send Email via SendGrid
   */
  private async sendEmail(
    to: string,
    content: string,
    from?: string,
    subject?: string
  ): Promise<DeliveryResult> {
    // Check if SendGrid is configured
    if (!env.SENDGRID_API_KEY) {
      logger.warn("SendGrid not configured, skipping email delivery", { to });
      return {
        success: false,
        error: "SendGrid API key not configured",
        channel: "email",
      };
    }

    try {
      // Import SendGrid dynamically
      const sgMail = await import("@sendgrid/mail");
      sgMail.default.setApiKey(env.SENDGRID_API_KEY);

      // Send email
      const msg = {
        to,
        from: from || "riley@truefansradio.com",
        subject: subject || "TrueFans RADIO",
        text: content,
        html: this.formatEmailHTML(content),
      };

      const response = await sgMail.default.send(msg);

      logger.info("Email sent successfully", {
        messageId: response[0].headers["x-message-id"],
        to: this.maskSensitiveData(to),
        statusCode: response[0].statusCode,
      });

      return {
        success: true,
        messageId: response[0].headers["x-message-id"] as string,
        channel: "email",
      };
    } catch (error) {
      logger.error("SendGrid email delivery failed", {
        to: this.maskSensitiveData(to),
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Send Instagram DM
   * Note: Instagram Graph API requires business account and specific permissions
   */
  private async sendInstagram(to: string, content: string): Promise<DeliveryResult> {
    // Check if Instagram is configured
    if (!env.INSTAGRAM_ACCESS_TOKEN) {
      logger.warn("Instagram not configured, skipping DM delivery", { to });
      return {
        success: false,
        error: "Instagram access token not configured",
        channel: "instagram",
      };
    }

    // TODO: Implement Instagram Graph API integration
    // This requires:
    // 1. Instagram Business Account
    // 2. Facebook App with instagram_manage_messages permission
    // 3. Page Access Token with proper scopes

    logger.warn("Instagram delivery not yet implemented", { to });

    return {
      success: false,
      error: "Instagram delivery not yet implemented",
      channel: "instagram",
    };
  }

  /**
   * Format email content as HTML
   */
  private formatEmailHTML(content: string): string {
    // Convert plain text to simple HTML with line breaks
    const htmlContent = content
      .split("\n")
      .map((line) => `<p>${this.escapeHTML(line)}</p>`)
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>TrueFans RADIO</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">TrueFans RADIO</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            ${htmlContent}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This message was sent by Riley, your TrueFans RADIO Artist Acquisition Specialist.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHTML(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Mask sensitive data for logging (phone numbers, emails)
   */
  private maskSensitiveData(data: string): string {
    // Mask email: test@example.com -> t***@e***.com
    if (data.includes("@")) {
      const [local, domain] = data.split("@");
      const maskedLocal = local.charAt(0) + "***";
      const maskedDomain = domain.charAt(0) + "***" + domain.slice(-4);
      return `${maskedLocal}@${maskedDomain}`;
    }

    // Mask phone: +1234567890 -> +123***7890
    if (data.startsWith("+")) {
      return data.slice(0, 4) + "***" + data.slice(-4);
    }

    // Generic masking
    return data.slice(0, 3) + "***" + data.slice(-3);
  }

  /**
   * Validate phone number format (basic validation)
   */
  validatePhoneNumber(phone: string): boolean {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const messageDelivery = new MessageDeliveryService();
