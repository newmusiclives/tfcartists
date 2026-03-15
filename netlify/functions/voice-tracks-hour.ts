import { Handler, schedule } from "@netlify/functions";

/**
 * Hourly voice track catch-up — runs at :05 past every hour from 6 AM to 6 PM MT.
 * (13:05-01:05 UTC, covering 6 AM - 6 PM Mountain Time year-round including DST)
 *
 * First calls the dispatch endpoint to find pending hours, then processes each one.
 */
const handler: Handler = schedule("5 13-23,0 * * *", async () => {
  try {
    const baseUrl = process.env.URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cronSecret = process.env.CRON_SECRET || "development-secret";
    const authHeaders = { Authorization: `Bearer ${cronSecret}` };

    // 1. Get pending hours from dispatch endpoint
    const dispatchRes = await fetch(`${baseUrl}/api/cron/voice-tracks-dispatch`, {
      method: "GET",
      headers: authHeaders,
    });

    if (!dispatchRes.ok) {
      console.error("Dispatch failed:", dispatchRes.status);
      return { statusCode: 500, body: JSON.stringify({ error: "Dispatch failed" }) };
    }

    const dispatch = await dispatchRes.json();
    const pending = dispatch.pending || [];

    if (pending.length === 0) {
      console.log("Voice Tracks Hour: All hours already locked");
      return { statusCode: 200, body: JSON.stringify({ message: "All hours locked", pending: 0 }) };
    }

    // 2. Process each pending hour
    const results = [];
    for (const hour of pending) {
      const params = new URLSearchParams({
        stationId: hour.stationId,
        djId: hour.djId,
        clockTemplateId: hour.clockTemplateId,
        hour: String(hour.hourOfDay),
      });

      const res = await fetch(`${baseUrl}/api/cron/voice-tracks-hour?${params}`, {
        method: "GET",
        headers: authHeaders,
      });

      results.push({
        hour: hour.hourOfDay,
        dj: hour.djName,
        status: res.status,
        ok: res.ok,
      });
    }

    console.log("Voice Tracks Hour completed:", JSON.stringify(results));
    return { statusCode: 200, body: JSON.stringify({ processed: results.length, results }) };
  } catch (error) {
    console.error("Voice Tracks Hour failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Cron job failed" }) };
  }
});

export { handler };
