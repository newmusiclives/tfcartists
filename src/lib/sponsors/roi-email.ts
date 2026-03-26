/**
 * ROI Email Template Generator
 *
 * Generates a professional HTML email for monthly sponsor ROI reports.
 * Uses inline CSS only (email-safe, no Tailwind).
 */

export interface RoiEmailData {
  sponsorName: string;
  contactName: string;
  month: string; // "March 2026"
  tier: string;
  monthlyAmount: number;
  totalAdPlays: number;
  listenersReached: number;
  citiesReached: number;
  cityList: string[];
  costPerImpression: number;
  adSpotsUsed: number;
  adSpotsAllocated: number;
  fillRate: number;
  estimatedMarketValue: number;
  daypartBreakdown: Record<string, number>;
  stationName?: string;
}

export function generateRoiEmail(data: RoiEmailData): string {
  const stationName = data.stationName || "TrueFans Radio";
  const topCities = data.cityList.slice(0, 8).join(", ") || "Various locations";

  const daypartRows = Object.entries(data.daypartBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([daypart, plays]) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-size: 14px; color: #374151;">
          ${formatDaypart(daypart)}
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">
          ${plays}
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${stationName} - Sponsor ROI Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0 0 4px 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                ${stationName}
              </h1>
              <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                Monthly Sponsor Performance Report
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 16px;">
              <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">
                Hi ${data.contactName || data.sponsorName},
              </p>
              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Here is your sponsorship performance report for <strong>${data.month}</strong>.
                Thank you for being a valued <strong style="text-transform: capitalize;">${data.tier}</strong> sponsor.
              </p>
            </td>
          </tr>

          <!-- Key Metrics -->
          <tr>
            <td style="padding: 16px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td width="50%" style="padding: 20px; text-align: center; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #2563eb;">${data.totalAdPlays.toLocaleString()}</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Ad Plays</p>
                  </td>
                  <td width="50%" style="padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #059669;">${data.listenersReached.toLocaleString()}</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Listeners Reached</p>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 20px; text-align: center; border-right: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #d97706;">${data.citiesReached}</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Cities Reached</p>
                  </td>
                  <td width="50%" style="padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #7c3aed;">$${data.costPerImpression.toFixed(3)}</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Cost Per Impression</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fill Rate -->
          <tr>
            <td style="padding: 16px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; padding: 16px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
                      Ad Spot Utilization
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">
                      <strong>${data.adSpotsUsed}</strong> of <strong>${data.adSpotsAllocated}</strong> allocated spots used
                      (<strong>${data.fillRate.toFixed(1)}%</strong> fill rate)
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Daypart Performance -->
          <tr>
            <td style="padding: 16px 40px;">
              <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
                Plays by Daypart
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Daypart
                  </th>
                  <th style="padding: 8px 12px; text-align: right; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Plays
                  </th>
                </tr>
                ${daypartRows}
              </table>
            </td>
          </tr>

          <!-- Reach Summary -->
          <tr>
            <td style="padding: 16px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border-radius: 8px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #111827;">
                      Your Reach This Month
                    </p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #374151; line-height: 1.6;">
                      Your ads were heard by <strong>${data.listenersReached.toLocaleString()} listeners</strong>
                      across <strong>${data.citiesReached} cities</strong> including ${topCities}.
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">
                      At industry standard radio rates, this exposure would cost approximately
                      <strong style="color: #059669;">$${data.estimatedMarketValue.toLocaleString()}</strong>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
                Want to increase your reach? Upgrading your tier gives you more ad spots and priority placement.
              </p>
              <a href="mailto:sponsors@truefansradio.com?subject=Sponsorship%20Upgrade%20Inquiry%20-%20${encodeURIComponent(data.sponsorName)}"
                 style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">
                Discuss Upgrading
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #374151;">
                Thank you for supporting ${stationName}
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                Your sponsorship helps us bring incredible independent music to listeners everywhere.
                Together, we are building something real.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate a plain-text/markdown version of the ROI report (for clipboard/email body).
 */
export function generateRoiMarkdown(data: RoiEmailData): string {
  const stationName = data.stationName || "TrueFans Radio";
  const topCities = data.cityList.slice(0, 8).join(", ") || "Various locations";

  const daypartLines = Object.entries(data.daypartBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([daypart, plays]) => `  - ${formatDaypart(daypart)}: ${plays} plays`)
    .join("\n");

  return `# ${stationName} - Sponsor ROI Report
## ${data.sponsorName} | ${data.month}

### Key Metrics
- Ad Plays: ${data.totalAdPlays.toLocaleString()}
- Listeners Reached: ${data.listenersReached.toLocaleString()}
- Cities Reached: ${data.citiesReached} (${topCities})
- Cost Per Impression: $${data.costPerImpression.toFixed(3)}

### Ad Spot Utilization
- Spots Used: ${data.adSpotsUsed} / ${data.adSpotsAllocated}
- Fill Rate: ${data.fillRate.toFixed(1)}%

### Plays by Daypart
${daypartLines}

### Reach Summary
Your ads were heard by ${data.listenersReached.toLocaleString()} listeners across ${data.citiesReached} cities.

At industry standard radio rates, this exposure would cost approximately $${data.estimatedMarketValue.toLocaleString()}.

---
Tier: ${data.tier} | Monthly Investment: $${data.monthlyAmount}
Thank you for supporting ${stationName}.
`;
}

function formatDaypart(daypart: string): string {
  const labels: Record<string, string> = {
    morning: "Morning (6am-10am)",
    midday: "Midday (10am-3pm)",
    afternoon: "Afternoon (3pm-7pm)",
    evening: "Evening (7pm-12am)",
    late_night: "Late Night (12am-6am)",
  };
  return labels[daypart] || daypart.charAt(0).toUpperCase() + daypart.slice(1);
}
