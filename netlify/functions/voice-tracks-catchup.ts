import { Handler, schedule } from "@netlify/functions";

/**
 * Voice track catch-up — runs every 10 minutes from 6 AM to 6 PM MT.
 * (13:00-01:00 UTC, covering 6 AM - 6 PM Mountain Time year-round)
 *
 * Finds voice tracks stuck at "script_ready" (TTS failed or timed out)
 * and processes them one at a time. Each call handles up to 3 tracks.
 */
const handler: Handler = schedule("*/10 13-23,0 * * *", async () => {
  if (process.env.STATION_PAUSED === "true") {
    console.log("[kill-switch] STATION_PAUSED=true, skipping");
    return { statusCode: 200, body: JSON.stringify({ paused: true }) };
  }
  try {
    const baseUrl = process.env.URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cronSecret = process.env.CRON_SECRET || "development-secret";

    const res = await fetch(`${baseUrl}/api/cron/voice-tracks-catchup?limit=3`, {
      method: "GET",
      headers: { Authorization: `Bearer ${cronSecret}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Catchup failed:", res.status, text.substring(0, 200));
      return { statusCode: 500, body: JSON.stringify({ error: "Catchup failed" }) };
    }

    const result = await res.json();
    console.log(
      `Voice Tracks Catchup: processed=${result.processed}, failed=${result.failed}, remaining=${result.remaining}, duration=${result.durationMs}ms`
    );

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error("Voice Tracks Catchup failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Cron job failed" }) };
  }
});

export { handler };
