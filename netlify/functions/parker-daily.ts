import { Handler, schedule } from "@netlify/functions";

const handler: Handler = schedule("0 7 * * *", async () => {
  try {
    const baseUrl = process.env.URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cronSecret = process.env.CRON_SECRET || "development-secret";

    const response = await fetch(`${baseUrl}/api/cron/parker-daily`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${cronSecret}`,
      },
    });

    const result = await response.json();

    console.log("Parker Daily Cron completed:", result);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Parker Daily Cron failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Cron job failed" }),
    };
  }
});

export { handler };
