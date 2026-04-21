import { schedule } from "@netlify/functions";
import { runVoiceTracksDaily } from "../../src/lib/cron/voice-tracks-daily-runner";

const handler = schedule("0 12 * * *", async () => {
  if (process.env.STATION_PAUSED === "true") {
    console.log("[kill-switch] STATION_PAUSED=true, skipping");
    return { statusCode: 200, body: JSON.stringify({ paused: true }) };
  }
  try {
    console.log("Voice Tracks Daily Cron starting (direct runner)");

    const result = await runVoiceTracksDaily();

    console.log("Voice Tracks Daily Cron completed:", JSON.stringify(result));

    return {
      statusCode: result.success ? 200 : 500,
      body: JSON.stringify(result),
    };
  } catch (error) {
    const message = error instanceof Error
      ? `${error.message}\n${error.stack}`
      : String(error);
    console.error("Voice Tracks Daily Cron failed:", message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Cron job failed", details: message }),
    };
  }
});

export { handler };
