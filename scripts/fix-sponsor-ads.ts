/**
 * Fix sponsor ad scripts and regenerate audio for all 12 ads.
 *
 * Fixes:
 *   - "TrueFans Collective" → "TrueFans CONNECT"
 *   - "truefans dot live" → "truefans connect dot com"
 *   - Regenerates TTS audio for all 12 ads (ephemeral /tmp/ on Railway)
 *
 * Run with: npx tsx scripts/fix-sponsor-ads.ts
 */

const RAILWAY_API =
  process.env.RAILWAY_BACKEND_URL ||
  "https://tfc-radio-backend-production.up.railway.app";

// Admin auth
const ADMIN_USER = "admin";
const ADMIN_PASS = "TFCradio2024!";

// ── Updated TFC scripts ────────────────────────────────────────────────

const TFC_AD_UPDATES: Record<string, { ad_name: string; script_text: string }> = {
  "a0000001-0000-0000-0000-000000000010": {
    ad_name: "Direct Support",
    script_text:
      "At TrueFans CONNECT, ninety-two percent of every dollar goes directly to independent artists. No middlemen, no major label cuts. Just real support for real music. Learn more at truefans connect dot com.",
  },
  "a0000001-0000-0000-0000-000000000011": {
    ad_name: "Live Donation",
    script_text:
      "Love what you hear on North Country Radio? With TrueFans CONNECT, your donations go straight to the artists. Ninety-two cents of every dollar. Support independent music today at truefans connect dot com.",
  },
  "a0000001-0000-0000-0000-000000000012": {
    ad_name: "No Middlemen",
    script_text:
      "TrueFans CONNECT is changing how artists get paid. No middlemen taking a cut. Ninety-two percent goes directly to the musicians you love. Real fans supporting real artists. truefans connect dot com.",
  },
};

// All 12 ad IDs for audio regeneration
const ALL_AD_IDS = Array.from({ length: 12 }, (_, i) => {
  const suffix = String(i + 1).padStart(12, "0");
  return `a0000001-0000-0000-0000-${suffix}`;
});

// ── Auth helper ────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${RAILWAY_API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${ADMIN_USER}&password=${encodeURIComponent(ADMIN_PASS)}`,
  });
  if (!res.ok) {
    throw new Error(`Auth failed: ${res.status}`);
  }
  const data = await res.json();
  return data.token || data.access_token || "";
}

// ── CSRF helper ────────────────────────────────────────────────────────

async function getCsrf(): Promise<{ header: string; cookie: string }> {
  const res = await fetch(`${RAILWAY_API}/api/stations/`, { redirect: "manual" });
  const csrfHeader = res.headers.get("x-csrf-token") || "";
  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/csrf_token=([^;]+)/);
  return { header: csrfHeader, cookie: match ? `csrf_token=${match[1]}` : "" };
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Fixing Sponsor Ad Scripts + Regenerating Audio ===\n");

  // Get auth token and CSRF
  let authToken = "";
  try {
    authToken = await getAuthToken();
    console.log("Authenticated with admin token.\n");
  } catch (e) {
    console.log("Warning: Could not get auth token, proceeding without auth.\n");
  }

  const csrf = await getCsrf();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrf.header,
    Cookie: csrf.cookie,
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // ── Step 1: Update TFC ad scripts ──────────────────────────────────
  console.log("Step 1: Updating TrueFans CONNECT ad scripts...\n");

  for (const [adId, update] of Object.entries(TFC_AD_UPDATES)) {
    const body = {
      sponsor_name: "TrueFans CONNECT",
      ad_name: update.ad_name,
      script_text: update.script_text,
    };

    const res = await fetch(`${RAILWAY_API}/api/sponsor-ads/${adId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (res.ok) {
      console.log(`  UPDATED: TrueFans CONNECT - ${update.ad_name}`);
    } else {
      const errText = await res.text().catch(() => "");
      console.error(`  FAILED: ${adId} — ${res.status} ${errText}`);
    }
  }

  // ── Step 2: Regenerate audio for all 12 ads ────────────────────────
  console.log("\nStep 2: Regenerating audio for all 12 ads...\n");

  let regenerated = 0;
  let failed = 0;
  const persistedAudioMap = new Map<string, string>(); // adId → base64 data URI

  for (const adId of ALL_AD_IDS) {
    // First get the ad details to show which one we're processing
    const detailRes = await fetch(`${RAILWAY_API}/api/sponsor-ads/${adId}`, {
      headers,
    });
    let adLabel = adId;
    if (detailRes.ok) {
      const detail = await detailRes.json();
      adLabel = `${detail.sponsor_name} - ${detail.ad_name}`;
    }

    const res = await fetch(
      `${RAILWAY_API}/api/sponsor-ads/${adId}/regenerate`,
      {
        method: "POST",
        headers,
      }
    );

    if (res.ok) {
      const data = await res.json();
      const path = data.audio_path || data.generated_audio_path || "ok";
      console.log(`  REGENERATED: ${adLabel} → ${path}`);
      regenerated++;

      // Step 3: Fetch the audio file and store as data URI in Netlify DB
      // This ensures audio survives Railway redeploys
      if (path && path !== "ok" && !path.startsWith("data:")) {
        try {
          const audioUrl = path.startsWith("http") ? path : `${RAILWAY_API}${path}`;
          const audioRes = await fetch(audioUrl, { headers });
          if (audioRes.ok) {
            const audioBuffer = await audioRes.arrayBuffer();
            const base64 = Buffer.from(audioBuffer).toString("base64");
            const dataUri = `data:audio/mp3;base64,${base64}`;
            persistedAudioMap.set(adId, dataUri);
            console.log(`  PERSISTED: ${adLabel} (${Math.round(base64.length / 1024)}KB as data URI)`);
          }
        } catch (e) {
          console.log(`  WARN: Could not persist audio for ${adLabel}`);
        }
      }
    } else {
      const errText = await res.text().catch(() => "");
      console.error(`  FAILED: ${adLabel} — ${res.status} ${errText.substring(0, 120)}`);
      failed++;
    }
  }

  // ── Step 3: Update Netlify DB with persisted audio ────────────────
  if (persistedAudioMap.size > 0) {
    console.log(`\nStep 3: Persisting ${persistedAudioMap.size} audio data URIs to Netlify DB...\n`);
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      for (const [adId, dataUri] of persistedAudioMap) {
        try {
          // Find ad by matching the Railway ID pattern to Netlify ad
          const ads = await prisma.sponsorAd.findMany({
            where: { isActive: true },
            select: { id: true, adTitle: true, sponsorName: true },
          });

          // Update all active ads with the audio data URI
          // Match by position in the array since IDs differ between Railway and Netlify
          if (ads.length > 0) {
            const idx = ALL_AD_IDS.indexOf(adId);
            if (idx >= 0 && idx < ads.length) {
              await prisma.sponsorAd.update({
                where: { id: ads[idx].id },
                data: { audioDataUri: dataUri },
              });
              console.log(`  STORED: ${ads[idx].sponsorName} - ${ads[idx].adTitle}`);
            }
          }
        } catch (e) {
          console.log(`  WARN: DB update failed for ${adId}`);
        }
      }

      await prisma.$disconnect();
    } catch (e) {
      console.log("  WARN: Could not connect to Netlify DB for persistence");
    }
  }

  // ── Summary ────────────────────────────────────────────────────────
  console.log("\n=== Done ===");
  console.log(`Scripts updated: ${Object.keys(TFC_AD_UPDATES).length}`);
  console.log(`Audio regenerated: ${regenerated}`);
  console.log(`Audio failed: ${failed}`);
  console.log(`Audio persisted to DB: ${persistedAudioMap.size}`);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
