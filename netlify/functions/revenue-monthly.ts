import { Handler, schedule } from "@netlify/functions";

const handler: Handler = schedule("0 2 1 * *", async () => {
  try {
    const baseUrl = process.env.URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cronSecret = process.env.CRON_SECRET || "development-secret";

    const response = await fetch(`${baseUrl}/api/cron/revenue-monthly`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${cronSecret}`,
      },
    });

    const result = await response.json();

    console.log("Revenue Monthly Cron completed:", result);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Revenue Monthly Cron failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Cron job failed" }),
    };
  }
});

export { handler };
