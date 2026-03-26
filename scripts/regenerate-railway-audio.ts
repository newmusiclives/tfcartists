/**
 * Regenerate sponsor ad audio on Railway after deploy.
 *
 * Railway uses ephemeral /tmp/ storage — audio files are lost on each deploy.
 * Run this script after any Railway deploy to regenerate all sponsor ad TTS audio.
 *
 * Usage: npx tsx scripts/regenerate-railway-audio.ts
 *
 * Can also be called from a post-deploy webhook or cron job.
 */

const RAILWAY_API =
  process.env.RAILWAY_BACKEND_URL ||
  "https://tfc-radio-backend-production.up.railway.app";

const ADMIN_USER = "admin";
const ADMIN_PASS = "TFCradio2024!";

async function getAuthToken(): Promise<{ csrfToken: string; cookies: string }> {
  const res = await fetch(`${RAILWAY_API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${ADMIN_USER}&password=${encodeURIComponent(ADMIN_PASS)}`,
    redirect: "manual",
  });

  const csrfToken = res.headers.get("x-csrf-token") || "";
  const setCookies = res.headers.getSetCookie?.() || [];
  const cookies = setCookies.map((c: string) => c.split(";")[0]).join("; ");

  return { csrfToken, cookies };
}

async function main() {
  console.log(`Connecting to Railway backend: ${RAILWAY_API}`);

  // Authenticate
  const { csrfToken, cookies } = await getAuthToken();
  console.log("Authenticated successfully");

  // Get all sponsor ads
  const adsRes = await fetch(`${RAILWAY_API}/api/sponsor-ads`, {
    headers: { Cookie: cookies },
  });

  if (!adsRes.ok) {
    console.error(`Failed to fetch ads: ${adsRes.status}`);
    process.exit(1);
  }

  const ads = await adsRes.json();
  console.log(`Found ${ads.length} sponsor ads to regenerate`);

  let success = 0;
  let failed = 0;

  for (const ad of ads) {
    try {
      const res = await fetch(`${RAILWAY_API}/api/sponsor-ads/${ad.id}/regenerate`, {
        method: "POST",
        headers: {
          Cookie: cookies,
          "X-CSRF-Token": csrfToken,
        },
      });

      if (res.ok) {
        console.log(`  ✓ Regenerated: ${ad.ad_name || ad.id}`);
        success++;
      } else {
        console.error(`  ✗ Failed (${res.status}): ${ad.ad_name || ad.id}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ✗ Error: ${ad.ad_name || ad.id} — ${err}`);
      failed++;
    }

    // Small delay to avoid overwhelming TTS API
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\nDone: ${success} regenerated, ${failed} failed`);
}

main().catch(console.error);
