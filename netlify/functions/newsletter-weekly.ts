import { Handler, schedule } from "@netlify/functions";

/**
 * Weekly newsletter digest — runs every Monday at 3 PM MT (10 PM UTC).
 * Generates and sends the weekly playlist digest and artist spotlights.
 */
const handler: Handler = schedule("0 22 * * 1", async () => {
  try {
    const baseUrl = process.env.URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cronSecret = process.env.CRON_SECRET || "development-secret";

    const response = await fetch(`${baseUrl}/api/cron/newsletter-weekly`, {
      method: "GET",
      headers: { Authorization: `Bearer ${cronSecret}` },
    });

    const result = await response.json();
    console.log("Newsletter Weekly completed:", result);

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error("Newsletter Weekly failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Cron job failed" }) };
  }
});

export { handler };
