import { Handler, schedule } from "@netlify/functions";

/**
 * Pull play history from the playout engine every 15 minutes.
 *
 * Analytics, royalty reporting and the fairness protocol all read
 * TrackPlayback, and nothing wrote it before this - the platform's most recent
 * playback was over a day stale. Fifteen minutes keeps those figures close
 * enough to live without hammering the playout API; the sync is idempotent, so
 * a missed run is made up by the next one rather than losing plays.
 *
 * Deliberately NOT gated on STATION_PAUSED: if the station is paused we still
 * want the plays that happened before the pause to land.
 */
const handler: Handler = schedule("*/15 * * * *", async () => {
  try {
    const baseUrl =
      process.env.URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cronSecret = process.env.CRON_SECRET || "development-secret";

    const res = await fetch(`${baseUrl}/api/cron/sync-plays`, {
      method: "GET",
      headers: { Authorization: `Bearer ${cronSecret}` },
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Play sync failed:", res.status, JSON.stringify(body));
      return { statusCode: 500, body: JSON.stringify({ error: "Play sync failed" }) };
    }

    console.log(
      `Play sync: inserted ${body.inserted ?? 0}, held ${body.alreadyHeld ?? 0}, latest ${body.latestAfter ?? "n/a"}`,
    );
    return { statusCode: 200, body: JSON.stringify(body) };
  } catch (error) {
    console.error("Play sync failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Cron job failed" }) };
  }
});

export { handler };
