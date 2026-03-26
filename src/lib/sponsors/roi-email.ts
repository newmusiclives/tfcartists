/**
 * ROI Email Template Generator
 *
 * Generates sponsor ROI reports in multiple formats.
 * HTML email uses the branded base template from templates.ts.
 * Also provides a standalone HTML version for the API and a markdown version.
 */

import { sponsorROIEmail } from "@/lib/emails/templates";

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

/**
 * Generate a branded HTML email for the ROI report.
 * Uses the shared base template for consistent branding.
 */
export function generateRoiEmail(data: RoiEmailData): string {
  const { html } = sponsorROIEmail(data.sponsorName, data);
  return html;
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
