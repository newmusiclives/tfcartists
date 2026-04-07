import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { withRateLimit } from "@/lib/rate-limit/limiter";
import { generateSponsorAdAudio } from "@/lib/radio/sponsor-ad-tts";

export const dynamic = "force-dynamic";

/**
 * Bulk-regenerate sponsor ad audio for a station. Clears existing audio for
 * each ad with a scriptText then re-runs the Gemini TTS pipeline. Replaces
 * the legacy hardcoded-OpenAI implementation — all sponsor TTS now flows
 * through the same Gemini-only path used elsewhere.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, "ai");
    if (rateLimited) return rateLimited;

    const { stationId } = await request.json();
    if (!stationId) {
      return NextResponse.json({ error: "stationId is required" }, { status: 400 });
    }

    const ads = await prisma.sponsorAd.findMany({
      where: { stationId, scriptText: { not: null } },
      select: { id: true, adTitle: true },
    });

    const results: Array<{
      adId: string;
      adTitle: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const ad of ads) {
      // Clear existing audio so generateSponsorAdAudio doesn't bail on its
      // "audio already exists" guard.
      await prisma.sponsorAd.update({
        where: { id: ad.id },
        data: { audioFilePath: null, audioDataUri: null, durationSeconds: null },
      });

      try {
        await generateSponsorAdAudio(ad.id);
        results.push({ adId: ad.id, adTitle: ad.adTitle, success: true });
      } catch (err) {
        results.push({
          adId: ad.id,
          adTitle: ad.adTitle,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.length - succeeded;

    return NextResponse.json({
      message: `Generated ${succeeded} of ${results.length} sponsor ad audio files${failed > 0 ? ` (${failed} failed)` : ""}`,
      results,
    });
  } catch (error) {
    return handleApiError(error, "/api/sponsor-ads/generate-audio");
  }
}
