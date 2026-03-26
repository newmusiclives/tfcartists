/**
 * Onboarding Email Welcome Sequence
 *
 * 4-step email sequence for new station operators:
 * Step 0: Welcome — Congratulations & account overview
 * Step 1: Quick Start — Get your first DJ and songs up
 * Step 2: Check-In — How's it going? Tips for engagement
 * Step 3: Launch Tips — Ready to go live
 */

interface EmailResult {
  subject: string;
  html: string;
}

function emailWrapper(stationName: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0; background: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 0;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 100%); padding: 32px 24px; text-align: center; border-radius: 0 0 16px 16px;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #fafafa;">${stationName}</h1>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #94a3b8;">Powered by TrueFans RADIO</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="padding: 24px; text-align: center; border-top: 1px solid #27272a;">
      <p style="margin: 0; font-size: 12px; color: #52525b;">
        ${stationName} — Powered by TrueFans RADIO
      </p>
      <p style="margin: 4px 0 0 0; font-size: 11px; color: #3f3f46;">
        You're receiving this because you signed up for ${stationName}.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<div style="text-align: center; margin: 24px 0;">
    <a href="${url}" style="display: inline-block; padding: 14px 32px; background: #3b82f6; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">${text}</a>
  </div>`;
}

function paragraph(text: string): string {
  return `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #d4d4d8;">${text}</p>`;
}

function heading(text: string): string {
  return `<h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #fafafa;">${text}</h2>`;
}

function listItem(text: string): string {
  return `<li style="margin: 0 0 8px 0; font-size: 15px; line-height: 1.5; color: #d4d4d8;">${text}</li>`;
}

function tipBox(title: string, text: string): string {
  return `<div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #3b82f6;">${title}</p>
    <p style="margin: 0; font-size: 14px; color: #a1a1aa;">${text}</p>
  </div>`;
}

export function welcomeEmail(stationName: string): EmailResult {
  const content = `
    ${heading("Welcome to " + stationName + "!")}
    ${paragraph("Congratulations on launching your AI-powered radio station! You've just joined a growing network of independent broadcasters who are reimagining what radio can be.")}
    ${paragraph("Here's what you've got:")}
    <ul style="padding-left: 20px; margin: 0 0 16px 0;">
      ${listItem("<strong>AI DJs</strong> — Unique personalities that host your shows 24/7")}
      ${listItem("<strong>Smart Scheduling</strong> — Automated programming that keeps listeners engaged")}
      ${listItem("<strong>Sponsor Tools</strong> — Built-in ad management and invoicing")}
      ${listItem("<strong>Artist Network</strong> — Connect with independent artists directly")}
    </ul>
    ${paragraph("Your station is ready to configure. Let's get you set up!")}
    ${ctaButton("Go to Your Dashboard", "https://truefans-radio.netlify.app/station-admin")}
    ${tipBox("Quick Tip", "Start by adding a few songs and creating your first DJ character. You can have your station sounding great in under 15 minutes.")}
  `;

  return {
    subject: `Welcome to ${stationName} — Your AI Radio Station is Ready!`,
    html: emailWrapper(stationName, content),
  };
}

export function quickStartEmail(stationName: string): EmailResult {
  const content = `
    ${heading("Quick Start: Your First 15 Minutes")}
    ${paragraph("Ready to get " + stationName + " on the air? Here's a fast-track setup guide to get you broadcasting:")}
    <div style="margin: 16px 0;">
      <div style="display: flex; margin-bottom: 12px;">
        <div style="min-width: 32px; height: 32px; background: #3b82f6; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; margin-right: 12px;">1</div>
        <div>
          <p style="margin: 0; font-size: 15px; color: #fafafa; font-weight: 600;">Upload Your First Songs</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #a1a1aa;">Head to Station Admin > Songs and add at least 10 tracks to build a solid rotation.</p>
        </div>
      </div>
      <div style="display: flex; margin-bottom: 12px;">
        <div style="min-width: 32px; height: 32px; background: #3b82f6; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; margin-right: 12px;">2</div>
        <div>
          <p style="margin: 0; font-size: 15px; color: #fafafa; font-weight: 600;">Create Your First DJ</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #a1a1aa;">Give them a personality, voice, and time slot. They'll introduce songs and engage listeners automatically.</p>
        </div>
      </div>
      <div style="display: flex; margin-bottom: 12px;">
        <div style="min-width: 32px; height: 32px; background: #3b82f6; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; margin-right: 12px;">3</div>
        <div>
          <p style="margin: 0; font-size: 15px; color: #fafafa; font-weight: 600;">Set Your Schedule</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #a1a1aa;">Use Clock Templates to define what plays each hour — music, ads, DJ breaks, imaging.</p>
        </div>
      </div>
    </div>
    ${ctaButton("Open Station Admin", "https://truefans-radio.netlify.app/station-admin")}
    ${tipBox("Pro Tip", "Start with just morning and afternoon shows. You can expand to 24/7 once you've dialed in your sound.")}
  `;

  return {
    subject: `[${stationName}] Quick Start — Get On Air in 15 Minutes`,
    html: emailWrapper(stationName, content),
  };
}

export function checkInEmail(stationName: string): EmailResult {
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
    ${ctaButton("Check Your Dashboard", "https://truefans-radio.netlify.app/station-admin")}
    ${tipBox("Did You Know?", "You can share your station's embed player with artists, and they'll promote your station to their fans. It's a win-win growth loop.")}
    ${paragraph("If you have any questions or need help, just reply to this email. We're here to help you succeed.")}
  `;

  return {
    subject: `[${stationName}] Quick Check-In — Tips to Boost Your Station`,
    html: emailWrapper(stationName, content),
  };
}

export function launchTipsEmail(stationName: string): EmailResult {
  const content = `
    ${heading("Ready to Go Live!")}
    ${paragraph("You've set up " + stationName + " and it's sounding great. Here are some final tips before you share it with the world:")}

    <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 16px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #fafafa;">Launch Checklist</p>
      <ul style="padding-left: 20px; margin: 0;">
        ${listItem("Station branding (logo, colors, tagline) is set")}
        ${listItem("At least 3 DJ characters with distinct personalities")}
        ${listItem("50+ songs in your library across your genres")}
        ${listItem("Clock templates configured for peak hours")}
        ${listItem("At least 1 sponsor ad in rotation")}
        ${listItem("Stream URL configured and tested")}
      </ul>
    </div>

    ${paragraph("<strong>Promotion ideas:</strong>")}
    <ul style="padding-left: 20px; margin: 0 0 16px 0;">
      ${listItem("Share your /stations page on social media")}
      ${listItem("Give artists their embed player link to share with fans")}
      ${listItem("Enable the voicemail feature so listeners can interact")}
      ${listItem("Post about Song of the Day voting to drive daily return visits")}
    </ul>

    ${ctaButton("Share Your Station", "https://truefans-radio.netlify.app/stations")}

    ${paragraph("Congratulations on building something amazing. The TrueFans Network is growing because of operators like you.")}
    ${paragraph("Rock on!")}
  `;

  return {
    subject: `[${stationName}] Launch Tips — Share Your Station with the World`,
    html: emailWrapper(stationName, content),
  };
}
