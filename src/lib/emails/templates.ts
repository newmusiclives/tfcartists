/**
 * Branded HTML Email Template System
 *
 * Table-based layout with inline CSS for maximum email client compatibility.
 * All templates return { subject, html, text } where text is a plain-text fallback.
 *
 * Branding is driven by env vars:
 *   NEXT_PUBLIC_STATION_NAME, NEXT_PUBLIC_PRIMARY_COLOR, NEXT_PUBLIC_SECONDARY_COLOR
 */

import type { RoiEmailData } from "@/lib/sponsors/roi-email";
import type { InvoiceData } from "@/lib/sponsors/invoice-template";

// ── Branding constants ──

const STATION_NAME = process.env.NEXT_PUBLIC_STATION_NAME || "North Country Radio";
const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO";
const PRIMARY_COLOR = process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#78350f";
const SECONDARY_COLOR = process.env.NEXT_PUBLIC_SECONDARY_COLOR || "#c2410c";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app";
const STATION_ADDRESS = process.env.NEXT_PUBLIC_STATION_ADDRESS || "";
const STATION_EMAIL = process.env.NEXT_PUBLIC_STATION_EMAIL || "";
const SOCIAL_FACEBOOK = process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || "";
const SOCIAL_INSTAGRAM = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "";
const SOCIAL_TWITTER = process.env.NEXT_PUBLIC_SOCIAL_TWITTER || "";

export interface EmailOutput {
  subject: string;
  html: string;
  text: string;
}

// ── HTML helpers ──

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function socialLinksHtml(): string {
  const links: string[] = [];
  if (SOCIAL_FACEBOOK) {
    links.push(
      `<a href="${escapeHtml(SOCIAL_FACEBOOK)}" style="color: #9ca3af; text-decoration: none; margin: 0 8px;">Facebook</a>`
    );
  }
  if (SOCIAL_INSTAGRAM) {
    links.push(
      `<a href="${escapeHtml(SOCIAL_INSTAGRAM)}" style="color: #9ca3af; text-decoration: none; margin: 0 8px;">Instagram</a>`
    );
  }
  if (SOCIAL_TWITTER) {
    links.push(
      `<a href="${escapeHtml(SOCIAL_TWITTER)}" style="color: #9ca3af; text-decoration: none; margin: 0 8px;">Twitter</a>`
    );
  }
  if (links.length === 0) return "";
  return `
    <tr>
      <td style="padding: 0 0 12px 0; text-align: center; font-size: 13px;">
        ${links.join(" &middot; ")}
      </td>
    </tr>`;
}

// ── Base wrapper ──

/**
 * Wraps email body content in the branded table-based template.
 * All email clients get a consistent header, body, and footer.
 */
export function baseTemplate(bodyHtml: string, preheader?: string): string {
  const stationNameSafe = escapeHtml(STATION_NAME);
  const networkNameSafe = escapeHtml(NETWORK_NAME);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${stationNameSafe}</title>
  <!--[if mso]>
  <style>table,td{font-family:Arial,sans-serif;}</style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">${
    preheader
      ? `<span style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</span>`
      : ""
  }
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <!-- Outer container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%); padding: 28px 32px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">${stationNameSafe}</h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.8);">Powered by ${networkNameSafe}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; border-top: 1px solid #e5e7eb; padding: 24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${socialLinksHtml()}
                ${
                  STATION_ADDRESS
                    ? `<tr><td style="text-align: center; font-size: 12px; color: #9ca3af; padding: 0 0 8px 0;">${escapeHtml(STATION_ADDRESS)}</td></tr>`
                    : ""
                }
                ${
                  STATION_EMAIL
                    ? `<tr><td style="text-align: center; font-size: 12px; color: #9ca3af; padding: 0 0 8px 0;"><a href="mailto:${escapeHtml(STATION_EMAIL)}" style="color: #9ca3af; text-decoration: underline;">${escapeHtml(STATION_EMAIL)}</a></td></tr>`
                    : ""
                }
                <tr>
                  <td style="text-align: center; font-size: 11px; color: #a1a1aa; padding: 8px 0 0 0;">
                    <a href="${SITE_URL}/unsubscribe" style="color: #a1a1aa; text-decoration: underline;">Unsubscribe</a>
                    &nbsp;&middot;&nbsp;
                    <a href="${SITE_URL}/preferences" style="color: #a1a1aa; text-decoration: underline;">Email Preferences</a>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; font-size: 11px; color: #a1a1aa; padding: 8px 0 0 0;">
                    &copy; ${new Date().getFullYear()} ${stationNameSafe}. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Reusable components ──

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
    <tr>
      <td align="center">
        <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escapeHtml(url)}" style="height:44px;width:220px;v-text-anchor:middle;" arcsize="18%" fillcolor="${PRIMARY_COLOR}"><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${escapeHtml(text)}</center></v:roundrect><![endif]-->
        <!--[if !mso]><!-->
        <a href="${escapeHtml(url)}" style="display: inline-block; padding: 12px 28px; background-color: ${PRIMARY_COLOR}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 6px; line-height: 1.4;">${escapeHtml(text)}</a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`;
}

function paragraph(text: string): string {
  return `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">${text}</p>`;
}

function heading2(text: string): string {
  return `<h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827;">${escapeHtml(text)}</h2>`;
}

function tipBox(title: string, text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0;">
    <tr>
      <td style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 16px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: ${PRIMARY_COLOR};">${escapeHtml(title)}</p>
        <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">${text}</p>
      </td>
    </tr>
  </table>`;
}

function bulletList(items: string[]): string {
  const lis = items
    .map(
      (item) =>
        `<li style="margin: 0 0 8px 0; font-size: 15px; line-height: 1.5; color: #374151;">${item}</li>`
    )
    .join("");
  return `<ul style="padding-left: 20px; margin: 0 0 16px 0;">${lis}</ul>`;
}

function metricsRow(cells: { value: string; label: string; color: string }[]): string {
  const width = Math.floor(100 / cells.length);
  const tds = cells
    .map(
      (cell, i) =>
        `<td width="${width}%" style="padding: 16px 8px; text-align: center;${i < cells.length - 1 ? " border-right: 1px solid #e5e7eb;" : ""}">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${cell.color};">${cell.value}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(cell.label)}</p>
        </td>`
    )
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin: 16px 0;">
    <tr>${tds}</tr>
  </table>`;
}

// ── Email templates ──

/**
 * Welcome email for new operators/users during onboarding.
 */
export function welcomeEmail(name: string, stationName?: string): EmailOutput {
  const station = stationName || STATION_NAME;
  const stationSafe = escapeHtml(station);

  const body = `
    ${heading2(`Welcome to ${station}!`)}
    ${paragraph(`Hi ${escapeHtml(name)},`)}
    ${paragraph(`Congratulations on launching your AI-powered radio station! You've joined a growing network of independent broadcasters reimagining what radio can be.`)}
    ${paragraph("Here's what you've got:")}
    ${bulletList([
      "<strong>AI DJs</strong> — Unique personalities that host your shows 24/7",
      "<strong>Smart Scheduling</strong> — Automated programming that keeps listeners engaged",
      "<strong>Sponsor Tools</strong> — Built-in ad management and invoicing",
      "<strong>Artist Network</strong> — Connect with independent artists directly",
    ])}
    ${paragraph("Your station is ready to configure. Let's get you set up!")}
    ${ctaButton("Go to Your Dashboard", `${SITE_URL}/station-admin`)}
    ${tipBox("Quick Tip", "Start by adding a few songs and creating your first DJ character. You can have your station sounding great in under 15 minutes.")}
  `;

  return {
    subject: `Welcome to ${station} — Your AI Radio Station is Ready!`,
    html: baseTemplate(body, `Welcome to ${station}! Your AI-powered radio station is ready to go.`),
    text: `Welcome to ${station}!

Hi ${name},

Congratulations on launching your AI-powered radio station! You've joined a growing network of independent broadcasters reimagining what radio can be.

Here's what you've got:
- AI DJs — Unique personalities that host your shows 24/7
- Smart Scheduling — Automated programming that keeps listeners engaged
- Sponsor Tools — Built-in ad management and invoicing
- Artist Network — Connect with independent artists directly

Your station is ready to configure. Get started at ${SITE_URL}/station-admin

Quick Tip: Start by adding a few songs and creating your first DJ character. You can have your station sounding great in under 15 minutes.

— The ${station} Team`,
  };
}

/**
 * Artist accepted notification — sent when an artist is approved for airplay.
 */
export function artistAcceptedEmail(name: string, tier: string, stationName?: string): EmailOutput {
  const station = stationName || STATION_NAME;
  const tierDisplay = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();

  const body = `
    ${heading2(`You're In, ${escapeHtml(name)}!`)}
    ${paragraph(`Great news — your music has been accepted to <strong>${escapeHtml(station)}</strong>! You've been placed in our <strong>${escapeHtml(tierDisplay)}</strong> rotation tier.`)}
    ${paragraph("Here's what happens next:")}
    ${bulletList([
      "Your songs will be added to our rotation schedule",
      "Our AI DJs will introduce your music to listeners",
      `You'll earn from our revenue pool based on your <strong>${escapeHtml(tierDisplay)}</strong> tier airplay`,
    ])}
    ${ctaButton("View Your Artist Dashboard", `${SITE_URL}/onboard`)}
    ${tipBox("Grow Your Reach", "Share your artist profile link with fans so they can listen live and request your songs.")}
    ${paragraph(`Listen live anytime at <a href="${SITE_URL}/player" style="color: ${PRIMARY_COLOR}; text-decoration: underline;">${escapeHtml(station)} Player</a>.`)}
  `;

  return {
    subject: `Welcome to ${station}, ${name}! Your music is going on air`,
    html: baseTemplate(body, `Your music has been accepted to ${station}!`),
    text: `You're In, ${name}!

Great news — your music has been accepted to ${station}! You've been placed in our ${tierDisplay} rotation tier.

Here's what happens next:
- Your songs will be added to our rotation schedule
- Our AI DJs will introduce your music to listeners
- You'll earn from our revenue pool based on your ${tierDisplay} tier airplay

View your artist dashboard: ${SITE_URL}/onboard
Listen live: ${SITE_URL}/player

Tip: Share your artist profile link with fans so they can listen live and request your songs.

— Team Riley, ${station}`,
  };
}

/**
 * Sponsor monthly ROI report email with performance stats table.
 */
export function sponsorROIEmail(sponsorName: string, metrics: RoiEmailData): EmailOutput {
  const station = metrics.stationName || STATION_NAME;
  const contactName = metrics.contactName || sponsorName;
  const topCities = metrics.cityList.slice(0, 8).join(", ") || "Various locations";

  const daypartLabels: Record<string, string> = {
    morning: "Morning (6am-10am)",
    midday: "Midday (10am-3pm)",
    afternoon: "Afternoon (3pm-7pm)",
    evening: "Evening (7pm-12am)",
    late_night: "Late Night (12am-6am)",
  };

  const daypartRows = Object.entries(metrics.daypartBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([dp, plays]) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${daypartLabels[dp] || dp}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">${plays}</td>
      </tr>`
    )
    .join("");

  const body = `
    ${heading2(`${escapeHtml(metrics.month)} Performance Report`)}
    ${paragraph(`Hi ${escapeHtml(contactName)},`)}
    ${paragraph(`Here is your sponsorship performance report for <strong>${escapeHtml(metrics.month)}</strong>. Thank you for being a valued <strong style="text-transform: capitalize;">${escapeHtml(metrics.tier)}</strong> sponsor.`)}

    ${metricsRow([
      { value: metrics.totalAdPlays.toLocaleString(), label: "Ad Plays", color: "#2563eb" },
      { value: metrics.listenersReached.toLocaleString(), label: "Listeners Reached", color: "#059669" },
    ])}
    ${metricsRow([
      { value: String(metrics.citiesReached), label: "Cities Reached", color: "#d97706" },
      { value: `$${metrics.costPerImpression.toFixed(3)}`, label: "Cost Per Impression", color: "#7c3aed" },
    ])}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; margin: 16px 0;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Ad Spot Utilization</p>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            <strong>${metrics.adSpotsUsed}</strong> of <strong>${metrics.adSpotsAllocated}</strong> allocated spots used
            (<strong>${metrics.fillRate.toFixed(1)}%</strong> fill rate)
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0 8px 0; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Plays by Daypart</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin: 0 0 16px 0;">
      <tr style="background-color: #f9fafb;">
        <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Daypart</th>
        <th style="padding: 8px 12px; text-align: right; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Plays</th>
      </tr>
      ${daypartRows}
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border-radius: 6px; margin: 16px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #111827;">Your Reach This Month</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151; line-height: 1.6;">
            Your ads were heard by <strong>${metrics.listenersReached.toLocaleString()} listeners</strong>
            across <strong>${metrics.citiesReached} cities</strong> including ${escapeHtml(topCities)}.
          </p>
          <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">
            At industry standard radio rates, this exposure would cost approximately
            <strong style="color: #059669;">$${metrics.estimatedMarketValue.toLocaleString()}</strong>.
          </p>
        </td>
      </tr>
    </table>

    ${paragraph("Want to increase your reach? Upgrading your tier gives you more ad spots and priority placement.")}
    ${ctaButton("Discuss Upgrading", `mailto:${STATION_EMAIL || "sponsors@truefansradio.com"}?subject=Sponsorship%20Upgrade%20-%20${encodeURIComponent(sponsorName)}`)}
  `;

  const daypartText = Object.entries(metrics.daypartBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([dp, plays]) => `  - ${daypartLabels[dp] || dp}: ${plays} plays`)
    .join("\n");

  return {
    subject: `${station} — Your ${metrics.month} Sponsor Performance Report`,
    html: baseTemplate(body, `Your ${metrics.month} sponsorship report is ready.`),
    text: `${station} - Sponsor ROI Report
${sponsorName} | ${metrics.month}

Hi ${contactName},

Key Metrics:
- Ad Plays: ${metrics.totalAdPlays.toLocaleString()}
- Listeners Reached: ${metrics.listenersReached.toLocaleString()}
- Cities Reached: ${metrics.citiesReached} (${topCities})
- Cost Per Impression: $${metrics.costPerImpression.toFixed(3)}

Ad Spot Utilization:
- Spots Used: ${metrics.adSpotsUsed} / ${metrics.adSpotsAllocated}
- Fill Rate: ${metrics.fillRate.toFixed(1)}%

Plays by Daypart:
${daypartText}

Your ads were heard by ${metrics.listenersReached.toLocaleString()} listeners across ${metrics.citiesReached} cities.
At industry rates, this exposure would cost approximately $${metrics.estimatedMarketValue.toLocaleString()}.

Tier: ${metrics.tier} | Monthly Investment: $${metrics.monthlyAmount}

Thank you for supporting ${station}.`,
  };
}

/**
 * Invoice email with line items table.
 */
export function invoiceEmail(data: InvoiceData): EmailOutput {
  const station = data.stationName || STATION_NAME;

  const lineItemRows = data.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${escapeHtml(item.description)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #374151;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px; color: #374151;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px; font-weight: 600; color: #111827;">$${item.total.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const lineItemsText = data.lineItems
    .map((item) => `  - ${item.description}: ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.total.toFixed(2)}`)
    .join("\n");

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td>
          <h2 style="margin: 0 0 4px 0; font-size: 28px; font-weight: 800; color: ${PRIMARY_COLOR}; letter-spacing: -0.5px;">INVOICE</h2>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">${escapeHtml(data.invoiceNumber)}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td width="50%" valign="top">
          <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Bill To</p>
          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #111827;">${escapeHtml(data.billTo.businessName)}</p>
          ${data.billTo.contactName ? `<p style="margin: 2px 0 0 0; font-size: 14px; color: #6b7280;">${escapeHtml(data.billTo.contactName)}</p>` : ""}
          ${data.billTo.email ? `<p style="margin: 2px 0 0 0; font-size: 14px; color: #6b7280;">${escapeHtml(data.billTo.email)}</p>` : ""}
        </td>
        <td width="50%" valign="top" style="text-align: right;">
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Invoice Date: <strong style="color: #111827;">${escapeHtml(data.invoiceDate)}</strong></p>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Due Date: <strong style="color: ${SECONDARY_COLOR};">${escapeHtml(data.dueDate)}</strong></p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Description</th>
          <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Unit Price</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemRows}
      </tbody>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td width="50%">&nbsp;</td>
        <td width="50%">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">Subtotal</td>
              <td style="padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827; text-align: right; font-weight: 500;">$${data.subtotal.toFixed(2)}</td>
            </tr>
            ${
              data.tax !== undefined
                ? `<tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">Tax</td>
              <td style="padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827; text-align: right; font-weight: 500;">$${data.tax.toFixed(2)}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding: 10px 0; border-top: 2px solid ${PRIMARY_COLOR}; font-size: 18px; font-weight: 700; color: #111827;">Total Due</td>
              <td style="padding: 10px 0; border-top: 2px solid ${PRIMARY_COLOR}; font-size: 18px; font-weight: 700; color: ${PRIMARY_COLOR}; text-align: right;">$${data.total.toFixed(2)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 16px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Payment Terms</p>
          <p style="margin: 0; font-size: 14px; color: #374151;">${escapeHtml(data.paymentTerms || "Net 30 — Payment due within 30 days of invoice date.")}</p>
        </td>
      </tr>
    </table>

    ${data.notes ? `${paragraph(`<strong>Notes:</strong> ${escapeHtml(data.notes)}`)}` : ""}
    ${paragraph(`Thank you for your partnership with <strong>${escapeHtml(station)}</strong>!`)}
  `;

  return {
    subject: `Invoice ${data.invoiceNumber} from ${station}`,
    html: baseTemplate(body, `Invoice ${data.invoiceNumber} — $${data.total.toFixed(2)} due ${data.dueDate}`),
    text: `INVOICE ${data.invoiceNumber}
${station}

Bill To: ${data.billTo.businessName}${data.billTo.contactName ? ` (${data.billTo.contactName})` : ""}
Invoice Date: ${data.invoiceDate}
Due Date: ${data.dueDate}

Line Items:
${lineItemsText}

Subtotal: $${data.subtotal.toFixed(2)}${data.tax !== undefined ? `\nTax: $${data.tax.toFixed(2)}` : ""}
Total Due: $${data.total.toFixed(2)}

Payment Terms: ${data.paymentTerms || "Net 30 — Payment due within 30 days of invoice date."}${data.notes ? `\nNotes: ${data.notes}` : ""}

Thank you for your partnership with ${station}!`,
  };
}

/**
 * Weekly newsletter wrapper — wraps arbitrary content in the branded template.
 */
export function weeklyNewsletterEmail(content: string, edition: string): EmailOutput {
  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Newsletter</p>
          <h2 style="margin: 4px 0 0 0; font-size: 22px; font-weight: 700; color: #111827;">${escapeHtml(STATION_NAME)} Weekly</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #9ca3af;">Edition ${escapeHtml(edition)}</p>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top: 2px solid ${PRIMARY_COLOR}; padding-top: 16px; margin-bottom: 16px;">
      <tr>
        <td style="font-size: 15px; line-height: 1.6; color: #374151;">
          ${content}
        </td>
      </tr>
    </table>
    ${ctaButton("Listen Live", `${SITE_URL}/player`)}
    ${paragraph(`<em style="color: #6b7280;">Thank you for being part of the ${escapeHtml(STATION_NAME)} community.</em>`)}
  `;

  // Strip HTML for text version
  const textContent = content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();

  return {
    subject: `${STATION_NAME} Weekly — Edition ${edition}`,
    html: baseTemplate(body, `${STATION_NAME} Weekly Newsletter — Edition ${edition}`),
    text: `${STATION_NAME} Weekly — Edition ${edition}

${textContent}

Listen live: ${SITE_URL}/player

Thank you for being part of the ${STATION_NAME} community.`,
  };
}

/**
 * Password reset email with secure reset link.
 */
export function passwordResetEmail(name: string, resetLink: string): EmailOutput {
  const body = `
    ${heading2("Reset Your Password")}
    ${paragraph(`Hi ${escapeHtml(name)},`)}
    ${paragraph("We received a request to reset your password. Click the button below to choose a new password:")}
    ${ctaButton("Reset Password", resetLink)}
    ${paragraph(`Or copy and paste this link into your browser:`)}
    <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.4; color: #6b7280; word-break: break-all;">
      <a href="${escapeHtml(resetLink)}" style="color: ${PRIMARY_COLOR}; text-decoration: underline;">${escapeHtml(resetLink)}</a>
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px;">
          <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.5;">
            This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Reset your ${STATION_NAME} password`,
    html: baseTemplate(body, "Reset your password — this link expires in 1 hour."),
    text: `Reset Your Password

Hi ${name},

We received a request to reset your password. Visit the link below to choose a new password:

${resetLink}

This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.

— ${STATION_NAME}`,
  };
}

/**
 * Monthly earnings report for artists.
 */
export function earningsReportEmail(
  artistName: string,
  earnings: {
    month: string;
    totalEarnings: number;
    totalPlays: number;
    tier: string;
    topSongs?: { title: string; plays: number; earned: number }[];
    payoutDate?: string;
  }
): EmailOutput {
  const tierDisplay = earnings.tier.charAt(0).toUpperCase() + earnings.tier.slice(1).toLowerCase();

  const topSongsRows = (earnings.topSongs || [])
    .map(
      (song) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${escapeHtml(song.title)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; text-align: center;">${song.plays}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; font-weight: 600; color: #059669; text-align: right;">$${song.earned.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const topSongsTable =
    earnings.topSongs && earnings.topSongs.length > 0
      ? `
    <p style="margin: 16px 0 8px 0; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Top Performing Songs</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin: 0 0 16px 0;">
      <tr style="background-color: #f9fafb;">
        <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Song</th>
        <th style="padding: 8px 12px; text-align: center; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Plays</th>
        <th style="padding: 8px 12px; text-align: right; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Earned</th>
      </tr>
      ${topSongsRows}
    </table>`
      : "";

  const topSongsText = (earnings.topSongs || [])
    .map((song) => `  - ${song.title}: ${song.plays} plays — $${song.earned.toFixed(2)}`)
    .join("\n");

  const body = `
    ${heading2(`${escapeHtml(earnings.month)} Earnings Report`)}
    ${paragraph(`Hi ${escapeHtml(artistName)},`)}
    ${paragraph(`Here's your earnings summary for <strong>${escapeHtml(earnings.month)}</strong> on ${escapeHtml(STATION_NAME)}.`)}

    ${metricsRow([
      { value: `$${earnings.totalEarnings.toFixed(2)}`, label: "Total Earnings", color: "#059669" },
      { value: earnings.totalPlays.toLocaleString(), label: "Total Plays", color: "#2563eb" },
      { value: tierDisplay, label: "Rotation Tier", color: PRIMARY_COLOR },
    ])}

    ${topSongsTable}

    ${
      earnings.payoutDate
        ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; margin: 16px 0;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0; font-size: 14px; color: #166534;">
            Your payout of <strong>$${earnings.totalEarnings.toFixed(2)}</strong> is scheduled for <strong>${escapeHtml(earnings.payoutDate)}</strong>.
          </p>
        </td>
      </tr>
    </table>`
        : ""
    }

    ${ctaButton("View Full Earnings", `${SITE_URL}/onboard`)}
    ${paragraph("Keep making great music — your listeners are growing!")}
  `;

  return {
    subject: `${STATION_NAME} — Your ${earnings.month} Earnings: $${earnings.totalEarnings.toFixed(2)}`,
    html: baseTemplate(body, `Your ${earnings.month} earnings: $${earnings.totalEarnings.toFixed(2)} from ${earnings.totalPlays} plays.`),
    text: `${earnings.month} Earnings Report — ${STATION_NAME}

Hi ${artistName},

Here's your earnings summary for ${earnings.month}:

Total Earnings: $${earnings.totalEarnings.toFixed(2)}
Total Plays: ${earnings.totalPlays.toLocaleString()}
Rotation Tier: ${tierDisplay}

${topSongsText ? `Top Performing Songs:\n${topSongsText}\n` : ""}${earnings.payoutDate ? `Payout of $${earnings.totalEarnings.toFixed(2)} scheduled for ${earnings.payoutDate}.\n` : ""}
View full earnings: ${SITE_URL}/onboard

Keep making great music — your listeners are growing!

— ${STATION_NAME}`,
  };
}
