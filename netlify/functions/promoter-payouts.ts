import { Handler, schedule } from "@netlify/functions";

/**
 * Promoter payouts — runs weekly on Sundays at 8 PM MT (3 AM UTC Monday).
 * Processes listener promoter commissions from the 5-stream referral system.
 */
const handler: Handler = schedule("0 3 * * 1", async () => {
  if (process.env.STATION_PAUSED === "true") {
    console.log("[kill-switch] STATION_PAUSED=true, skipping");
    return { statusCode: 200, body: JSON.stringify({ paused: true }) };
  }
  try {
    const baseUrl = process.env.URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cronSecret = process.env.CRON_SECRET || "development-secret";

    const response = await fetch(`${baseUrl}/api/cron/promoter-payouts`, {
      method: "GET",
      headers: { Authorization: `Bearer ${cronSecret}` },
    });

    const result = await response.json();
    console.log("Promoter Payouts completed:", result);

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error("Promoter Payouts failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Cron job failed" }) };
  }
});

export { handler };
