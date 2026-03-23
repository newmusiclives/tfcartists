import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { messageDelivery } from "@/lib/messaging/delivery-service";
import { amplifyPcm, pcmToWav, saveAudioFile } from "@/lib/radio/voice-track-tts";
import { mixVoiceWithMusicBed } from "@/lib/radio/audio-mixer";
import OpenAI from "openai";
import { getConfig } from "@/lib/config";
import { logCronExecution, isCronSuspended } from "@/lib/cron/log";

export const dynamic = "force-dynamic";

/**
 * Cassidy Daily Submission Review Cron Job
 * Runs every day at 4:20 AM
 *
 * Tasks:
 * 1. Process pending submissions — auto-assign to judges via SubmissionReview
 * 2. Check for stale in-review submissions (>7 days)
 * 3. Auto-place judged submissions that meet tier thresholds
 * 4. Log daily review metrics
 */
export async function GET(req: NextRequest) {
  const _cronStart = Date.now();
  const _cronStartedAt = new Date();
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = env.CRON_SECRET;
    if (!cronSecret) {
      logger.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron attempt", { path: "/api/cron/cassidy-daily" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this job is suspended
    const suspended = await isCronSuspended("cassidy-daily");
    if (suspended) return suspended;

    logger.info("Starting Cassidy daily submission review");

    const results = {
      assigned: 0,
      staleReassigned: 0,
      autoPlaced: 0,
      imagingRegenerated: 0,
      adAudioGenerated: 0,
      errors: 0,
    };

    // 1. Find pending submissions not yet assigned to any judge
    const pendingSubmissions = await prisma.submission.findMany({
      where: {
        status: "PENDING",
      },
      take: 20,
    });

    // Get active judges
    const judges = await prisma.judge.findMany({
      where: { isActive: true },
    });

    if (judges.length > 0 && pendingSubmissions.length > 0) {
      for (const submission of pendingSubmissions) {
        try {
          // Round-robin assign to judges via SubmissionReview
          const judge = judges[results.assigned % judges.length];

          await prisma.submissionReview.create({
            data: {
              submissionId: submission.id,
              judgeId: judge.id,
            },
          });

          // Move submission to IN_REVIEW
          await prisma.submission.update({
            where: { id: submission.id },
            data: {
              status: "IN_REVIEW",
              judgingStartedAt: new Date(),
            },
          });

          // Sync IN_REVIEW to GHL
          messageDelivery.syncCassidyStage({
            email: submission.artistEmail || undefined,
            name: submission.artistName,
            trackTitle: submission.trackTitle,
            stage: "in_review",
          }).catch(() => {});

          results.assigned++;
        } catch (error) {
          logger.error("Submission assignment failed", { submissionId: submission.id, error });
          results.errors++;
        }
      }
    }

    // 2. Check for stale in-review submissions (>7 days without completion)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const staleSubmissions = await prisma.submission.findMany({
      where: {
        status: "IN_REVIEW",
        judgingStartedAt: { lte: sevenDaysAgo },
        judgingCompletedAt: null,
      },
      take: 10,
    });

    for (const submission of staleSubmissions) {
      try {
        if (judges.length > 0) {
          // Assign additional judge review
          const nextJudge = judges[results.staleReassigned % judges.length];
          await prisma.submissionReview.create({
            data: {
              submissionId: submission.id,
              judgeId: nextJudge.id,
            },
          }).catch((err) => {
            // Ignore duplicate constraint, log other errors
            if (!err.message?.includes("Unique constraint")) {
              logger.error("Failed to create review assignment", { submissionId: submission.id, error: err.message });
            }
          });

          // Reset judging timer
          await prisma.submission.update({
            where: { id: submission.id },
            data: { judgingStartedAt: new Date() },
          });
        }
        results.staleReassigned++;
      } catch (error) {
        logger.error("Stale reassignment failed", { submissionId: submission.id, error });
        results.errors++;
      }
    }

    // 3. Auto-place JUDGED submissions that have a tier awarded
    const judgedSubmissions = await prisma.submission.findMany({
      where: {
        status: "JUDGED",
        tierAwarded: { not: null },
      },
    });

    // Fetch station once for Song creation
    const station = await prisma.station.findFirst();

    for (const submission of judgedSubmissions) {
      try {
        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            status: "PLACED",
            awardedAt: submission.awardedAt || new Date(),
          },
        });

        // Sync PLACED to GHL
        messageDelivery.syncCassidyStage({
          email: submission.artistEmail || undefined,
          name: submission.artistName,
          trackTitle: submission.trackTitle,
          stage: "placed",
          tier: submission.tierAwarded || undefined,
        }).catch(() => {});

        // Create Song record so placed track enters radio rotation
        if (station && submission.trackFileUrl) {
          await prisma.song.create({
            data: {
              stationId: station.id,
              title: submission.trackTitle,
              artistName: submission.artistName,
              fileUrl: submission.trackFileUrl,
              duration: submission.trackDuration,
              genre: submission.genre,
              rotationCategory: "E",
              tempoCategory: "medium",
              vocalGender: "unknown",
              isActive: true,
            },
          });
        }

        results.autoPlaced++;
      } catch (error) {
        logger.error("Auto-placement failed", { submissionId: submission.id, error });
        results.errors++;
      }
    }

    // 4. Regenerate imaging scripts that were generated without a music bed
    if (station) {
      try {
        const activeMusicBeds = await prisma.musicBed.findMany({
          where: { stationId: station.id, isActive: true },
        });

        if (activeMusicBeds.length > 0) {
          const imagingVoices = await prisma.stationImagingVoice.findMany({
            where: { stationId: station.id, isActive: true },
          });

          // Check if any scripts have audioFilePath but hasMusicBed is false/missing
          let needsRegen = false;
          for (const voice of imagingVoices) {
            const metadata = voice.metadata as Record<string, unknown> | null;
            const scripts = (metadata?.scripts || {}) as Record<string, Array<{ audioFilePath?: string; hasMusicBed?: boolean }>>;
            for (const type of Object.keys(scripts)) {
              for (const script of scripts[type] || []) {
                if (script.audioFilePath && !script.hasMusicBed) {
                  needsRegen = true;
                  break;
                }
              }
              if (needsRegen) break;
            }
            if (needsRegen) break;
          }

          if (needsRegen) {
            logger.info("Imaging scripts need regeneration with music beds — triggering internal regen");

            // Call the generate-audio route internally
            const baseUrl = process.env.NEXTAUTH_URL
              || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

            const regenResponse = await fetch(`${baseUrl}/api/station-imaging/generate-audio`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                stationId: station.id,
                types: ["station_id", "sweeper", "promo"],
              }),
            });

            if (regenResponse.ok) {
              const regenData = await regenResponse.json();
              const regenCount = regenData.results?.filter((r: { success: boolean }) => r.success).length || 0;
              results.imagingRegenerated = regenCount;
              logger.info("Imaging regeneration complete", { regenerated: regenCount });
            } else {
              logger.error("Imaging regeneration request failed", { status: regenResponse.status });
              results.errors++;
            }
          }
        }
      } catch (error) {
        logger.error("Imaging regeneration step failed", { error });
        results.errors++;
      }
    }

    // 5. Generate audio for sponsor ads that have scriptText but no audioFilePath
    try {
      const adsNeedingAudio = await prisma.sponsorAd.findMany({
        where: {
          scriptText: { not: null },
          audioFilePath: null,
          isActive: true,
        },
        include: { musicBed: true },
      });

      if (adsNeedingAudio.length > 0) {
        const apiKey = await getConfig("OPENAI_API_KEY");
        if (!apiKey) {
          logger.warn("OPENAI_API_KEY not configured — skipping ad audio generation");
        } else {
          const openai = new OpenAI({ apiKey });

          // Pick a default voice from station imaging settings
          let openaiVoice: "onyx" | "nova" = "onyx";
          if (station) {
            const imagingVoice = await prisma.stationImagingVoice.findFirst({
              where: { stationId: station.id, isActive: true },
            });
            if (imagingVoice?.voiceType === "female") {
              openaiVoice = "nova";
            }
          }

          logger.info(`Generating audio for ${adsNeedingAudio.length} sponsor ads`);

          for (const ad of adsNeedingAudio) {
            try {
              const response = await openai.audio.speech.create({
                model: "tts-1-hd",
                voice: openaiVoice,
                input: ad.scriptText!,
                response_format: "pcm",
              });

              const rawPcm = Buffer.from(await response.arrayBuffer());
              const boostedPcm = amplifyPcm(rawPcm, 3.5);

              // Mix with music bed if the ad has one assigned
              let finalPcm = boostedPcm;
              if (ad.musicBed?.filePath) {
                finalPcm = mixVoiceWithMusicBed(boostedPcm, ad.musicBed.filePath, {
                  voiceGain: 1.0,
                  bedGain: 0.7,
                  fadeInMs: 300,
                  fadeOutMs: 800,
                });
              }

              const wavBuffer = pcmToWav(finalPcm);

              const safeName = ad.adTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
              const filename = `ad-${safeName}-${ad.id.slice(-6)}.wav`;
              const audioFilePath = saveAudioFile(wavBuffer, "commercials", filename);

              // Duration: 24kHz 16-bit mono = 48000 bytes/sec
              const durationSeconds = Math.round((finalPcm.length / 48000) * 10) / 10;

              await prisma.sponsorAd.update({
                where: { id: ad.id },
                data: { audioFilePath, durationSeconds },
              });

              results.adAudioGenerated++;
            } catch (error) {
              logger.error("Ad audio generation failed", { adId: ad.id, adTitle: ad.adTitle, error });
              results.errors++;
            }
          }
        }
      }
    } catch (error) {
      logger.error("Ad audio generation step failed", { error });
      results.errors++;
    }

    logger.info("Cassidy daily submission review completed", results);

    await logCronExecution({ jobName: "cassidy-daily", status: "success", duration: Date.now() - _cronStart, summary: results as Record<string, unknown>, startedAt: _cronStartedAt });

    return NextResponse.json({
      success: true,
      message: "Cassidy daily submission review completed",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Cassidy daily submission review failed", { error });

    await logCronExecution({ jobName: "cassidy-daily", status: "error", duration: Date.now() - _cronStart, error: error instanceof Error ? error.message : String(error), startedAt: _cronStartedAt });

    return NextResponse.json(
      {
        error: "Daily automation failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
