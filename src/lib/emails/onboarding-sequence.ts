/**
 * Onboarding Email Welcome Sequence
 *
 * 4-step email sequence for new station operators:
 * Step 0: Welcome — Congratulations & account overview
 * Step 1: Quick Start — Get your first DJ and songs up
 * Step 2: Check-In — How's it going? Tips for engagement
 * Step 3: Launch Tips — Ready to go live
 *
 * Uses the branded base template from templates.ts for consistent styling.
 */

import {
  baseTemplate,
  welcomeEmail as brandedWelcome,
  type EmailOutput,
} from "@/lib/emails/templates";

const PRIMARY_COLOR = process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#78350f";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app";

// ── Reusable helpers ──

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
    <tr><td align="center">
      <a href="${url}" style="display: inline-block; padding: 12px 28px; background-color: ${PRIMARY_COLOR}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 6px; line-height: 1.4;">${text}</a>
    </td></tr>
  </table>`;
}

function paragraph(text: string): string {
  return `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">${text}</p>`;
}

function heading(text: string): string {
  return `<h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827;">${text}</h2>`;
}

function listItem(text: string): string {
  return `<li style="margin: 0 0 8px 0; font-size: 15px; line-height: 1.5; color: #374151;">${text}</li>`;
}

function tipBox(title: string, text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0;">
    <tr>
      <td style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 16px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: ${PRIMARY_COLOR};">${title}</p>
        <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">${text}</p>
      </td>
    </tr>
  </table>`;
}

function numberedStep(num: number, title: string, desc: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
    <tr>
      <td width="36" valign="top" style="padding-right: 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="32" height="32">
          <tr>
            <td align="center" valign="middle" style="background-color: ${PRIMARY_COLOR}; color: #ffffff; border-radius: 50%; font-weight: 700; font-size: 14px; width: 32px; height: 32px;">${num}</td>
          </tr>
        </table>
      </td>
      <td valign="top">
        <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 600;">${title}</p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.5;">${desc}</p>
      </td>
    </tr>
  </table>`;
}

// ── Email generators ──

/**
 * Welcome email (step 0) — wraps the branded welcome template from templates.ts.
 * Uses "Operator" as the name for the onboarding sequence since the
 * onboarding API only passes stationName.
 */
export function welcomeEmail(stationName: string): EmailOutput {
  return brandedWelcome("Operator", stationName);
}

export function quickStartEmail(stationName: string): EmailOutput {
  const content = `
    ${heading("Quick Start: Your First 15 Minutes")}
    ${paragraph("Ready to get " + stationName + " on the air? Here's a fast-track setup guide to get you broadcasting:")}
    ${numberedStep(1, "Upload Your First Songs", "Head to Station Admin > Songs and add at least 10 tracks to build a solid rotation.")}
    ${numberedStep(2, "Create Your First DJ", "Give them a personality, voice, and time slot. They'll introduce songs and engage listeners automatically.")}
    ${numberedStep(3, "Set Your Schedule", "Use Clock Templates to define what plays each hour — music, ads, DJ breaks, imaging.")}
    ${ctaButton("Open Station Admin", `${SITE_URL}/station-admin`)}
    ${tipBox("Pro Tip", "Start with just morning and afternoon shows. You can expand to 24/7 once you've dialed in your sound.")}
  `;

  return {
    subject: `[${stationName}] Quick Start — Get On Air in 15 Minutes`,
    html: baseTemplate(content, `Get ${stationName} on the air in 15 minutes.`),
    text: `Quick Start: Your First 15 Minutes

Ready to get ${stationName} on the air? Here's a fast-track setup guide:

1. Upload Your First Songs
   Head to Station Admin > Songs and add at least 10 tracks to build a solid rotation.

2. Create Your First DJ
   Give them a personality, voice, and time slot. They'll introduce songs and engage listeners automatically.

3. Set Your Schedule
   Use Clock Templates to define what plays each hour — music, ads, DJ breaks, imaging.

Open Station Admin: ${SITE_URL}/station-admin

Pro Tip: Start with just morning and afternoon shows. You can expand to 24/7 once you've dialed in your sound.

— The ${stationName} Team`,
  };
}

export function checkInEmail(stationName: string): EmailOutput {
  const content = `
    ${heading("How's It Going?")}
    ${paragraph("It's been a few days since you set up " + stationName + ". We wanted to check in and make sure everything's running smoothly.")}
    ${paragraph("Here are some things that can help boost listener engagement:")}
    <ul style="padding-left: 20px; margin: 0 0 16px 0;">
      ${listItem("<strong>Add more variety</strong> — Stations with 50+ songs see 3x longer listen times")}
      ${listItem("<strong>Enable Song of the Day voting</strong> — Let listeners pick favorites at /vote")}
      ${listItem("<strong>Set up Shoutouts</strong> — Free during launch! Listeners love hearing their names on air")}
      ${listItem("<strong>Invite sponsors</strong> — Even 1-2 local sponsors can cover your operating costs")}
    </ul>
    ${ctaButton("Check Your Dashboard", `${SITE_URL}/station-admin`)}
    ${tipBox("Did You Know?", "You can share your station's embed player with artists, and they'll promote your station to their fans. It's a win-win growth loop.")}
    ${paragraph("If you have any questions or need help, just reply to this email. We're here to help you succeed.")}
  `;

  return {
    subject: `[${stationName}] Quick Check-In — Tips to Boost Your Station`,
    html: baseTemplate(content, `Tips to boost your ${stationName} listener engagement.`),
    text: `How's It Going?

It's been a few days since you set up ${stationName}. We wanted to check in and make sure everything's running smoothly.

Here are some things that can help boost listener engagement:
- Add more variety — Stations with 50+ songs see 3x longer listen times
- Enable Song of the Day voting — Let listeners pick favorites at /vote
- Set up Shoutouts — Free during launch! Listeners love hearing their names on air
- Invite sponsors — Even 1-2 local sponsors can cover your operating costs

Check Your Dashboard: ${SITE_URL}/station-admin

Did You Know? You can share your station's embed player with artists, and they'll promote your station to their fans. It's a win-win growth loop.

If you have any questions or need help, just reply to this email.

— The ${stationName} Team`,
  };
}

export function launchTipsEmail(stationName: string): EmailOutput {
  const content = `
    ${heading("Ready to Go Live!")}
    ${paragraph("You've set up " + stationName + " and it's sounding great. Here are some final tips before you share it with the world:")}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 0; margin: 16px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #111827;">Launch Checklist</p>
          <ul style="padding-left: 20px; margin: 0;">
            ${listItem("Station branding (logo, colors, tagline) is set")}
            ${listItem("At least 3 DJ characters with distinct personalities")}
            ${listItem("50+ songs in your library across your genres")}
            ${listItem("Clock templates configured for peak hours")}
            ${listItem("At least 1 sponsor ad in rotation")}
            ${listItem("Stream URL configured and tested")}
          </ul>
        </td>
      </tr>
    </table>

    ${paragraph("<strong>Promotion ideas:</strong>")}
    <ul style="padding-left: 20px; margin: 0 0 16px 0;">
      ${listItem("Share your /stations page on social media")}
      ${listItem("Give artists their embed player link to share with fans")}
      ${listItem("Enable the voicemail feature so listeners can interact")}
      ${listItem("Post about Song of the Day voting to drive daily return visits")}
    </ul>

    ${ctaButton("Share Your Station", `${SITE_URL}/stations`)}

    ${paragraph("Congratulations on building something amazing. The TrueFans Network is growing because of operators like you.")}
    ${paragraph("Rock on!")}
  `;

  return {
    subject: `[${stationName}] Launch Tips — Share Your Station with the World`,
    html: baseTemplate(content, `${stationName} is ready to go live! Final tips before launch.`),
    text: `Ready to Go Live!

You've set up ${stationName} and it's sounding great. Here are some final tips before you share it with the world:

Launch Checklist:
- Station branding (logo, colors, tagline) is set
- At least 3 DJ characters with distinct personalities
- 50+ songs in your library across your genres
- Clock templates configured for peak hours
- At least 1 sponsor ad in rotation
- Stream URL configured and tested

Promotion ideas:
- Share your /stations page on social media
- Give artists their embed player link to share with fans
- Enable the voicemail feature so listeners can interact
- Post about Song of the Day voting to drive daily return visits

Share Your Station: ${SITE_URL}/stations

Congratulations on building something amazing. The TrueFans Network is growing because of operators like you. Rock on!

— The ${stationName} Team`,
  };
}
