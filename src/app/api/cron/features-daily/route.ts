import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

const POOL_TARGET = 3; // unused items per DJ per feature type

const LISTENER_NAMES = ["Jake", "Maggie", "Earl", "Sadie", "Beau", "Jolene", "Waylon", "Rosie"];
const INSTRUMENTS = ["guitar", "fiddle", "banjo", "mandolin", "pedal steel", "harmonica", "dobro", "upright bass"];
const THEMES = ["feel-good classics", "heartbreak anthems", "road trip songs", "front-porch favorites", "honky-tonk hits", "Sunday morning soul"];
const WEATHER_PHRASES = ["sunny and clear", "a little overcast", "cool and breezy", "warm with blue skies", "crisp and bright"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function todayDayName(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function djFirstName(fullName: string): string {
  return fullName.split(" ")[0] || fullName;
}

interface SongData {
  id: string;
  artistName: string;
  title: string;
  genre: string | null;
  album: string | null;
}

function fillTemplate(template: string, dj: string, song?: SongData): string {
  let script = template;
  const artistName = song?.artistName || "a rising artist";
  const songTitle = song?.title || "a great track";
  const genre = song?.genre || "Americana";
  const albumTitle = song?.album || "the album";

  script = script.replace(/\{artist_name\}/g, artistName);
  script = script.replace(/\{artist\}/g, artistName);
  script = script.replace(/\{song_title\}/g, songTitle);
  script = script.replace(/\{genre\}/g, genre);
  script = script.replace(/\{genre1\}/g, genre);
  script = script.replace(/\{genre2\}/g, "Country");
  script = script.replace(/\{dj_name\}/g, dj);
  script = script.replace(/\{date\}/g, todayFormatted());
  script = script.replace(/\{album_title\}/g, albumTitle);
  script = script.replace(/\{songwriter\}/g, artistName);
  script = script.replace(/\{producer\}/g, artistName);
  script = script.replace(/\{original_artist\}/g, artistName);
  script = script.replace(/\{cover_artist\}/g, "a fellow artist");
  script = script.replace(/\{listener_name\}/g, pick(LISTENER_NAMES));
  script = script.replace(/\{instrument\}/g, pick(INSTRUMENTS));
  script = script.replace(/\{year\}/g, String(new Date().getFullYear()));
  script = script.replace(/\{topic\}/g, "music and life");
  script = script.replace(/\{theme\}/g, pick(THEMES));
  script = script.replace(/\{weather\}/g, pick(WEATHER_PHRASES));
  script = script.replace(/\{from_name\}/g, "a fan");
  script = script.replace(/\{to_name\}/g, "someone special");
  script = script.replace(/\{message\}/g, "thinking of you");
  script = script.replace(/\{day_name\}/g, todayDayName());

  return script;
}

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = env.CRON_SECRET;
    if (!cronSecret) {
      logger.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron attempt", { path: "/api/cron/features-daily" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("Starting features-daily cron");

    // 1. Get station
    const station = await prisma.station.findFirst();
    if (!station) {
      return NextResponse.json({ error: "No station found" }, { status: 404 });
    }

    // 2. Fetch all active schedules with their feature types
    const schedules = await prisma.featureSchedule.findMany({
      where: { stationId: station.id, isActive: true },
      include: { featureType: true },
    });

    // 3. Fetch all DJs for name mapping
    const allDJs = await prisma.dJ.findMany({
      where: { stationId: station.id, isActive: true },
    });
    const djMap = new Map(allDJs.map((d) => [d.id, d.name]));

    // 4. Fetch all active songs for track-linked features
    const allSongs = await prisma.song.findMany({
      where: { stationId: station.id, isActive: true },
      select: { id: true, artistName: true, title: true, genre: true, album: true },
    });

    // 5. Build unique DJ+featureType combos from schedules
    const combos = new Map<string, { djId: string; djName: string; featureTypeId: string; trackPlacement: string | null; template: string | null }>();
    for (const sched of schedules) {
      if (!sched.djId || !sched.featureType.isActive) continue;
      const key = `${sched.djId}::${sched.featureTypeId}`;
      if (!combos.has(key)) {
        combos.set(key, {
          djId: sched.djId,
          djName: djMap.get(sched.djId) || sched.djName,
          featureTypeId: sched.featureTypeId,
          trackPlacement: sched.featureType.trackPlacement,
          template: sched.featureType.gptPromptTemplate,
        });
      }
    }

    // 5b. Expire stale unused content (older than 18 hours) so day-specific
    //     references like {date} and {day_name} stay accurate
    const staleThreshold = new Date(Date.now() - 18 * 60 * 60 * 1000);
    const { count: expired } = await prisma.featureContent.updateMany({
      where: {
        stationId: station.id,
        isUsed: false,
        generatedBy: "auto",
        createdAt: { lt: staleThreshold },
      },
      data: { isUsed: true },
    });
    if (expired > 0) {
      logger.info("Expired stale feature content", { expired });
    }

    let generated = 0;
    let skipped = 0;
    const byDj: Record<string, number> = {};

    // 6. For each combo, check pool and generate if needed
    for (const combo of combos.values()) {
      if (!combo.template) {
        skipped++;
        continue;
      }

      // Count existing unused content for this DJ + feature type
      const available = await prisma.featureContent.count({
        where: {
          stationId: station.id,
          featureTypeId: combo.featureTypeId,
          djPersonalityId: combo.djId,
          isUsed: false,
        },
      });

      const needed = POOL_TARGET - available;
      if (needed <= 0) {
        skipped++;
        continue;
      }

      const firstName = djFirstName(combo.djName);
      const isTrackLinked = combo.trackPlacement === "before" || combo.trackPlacement === "after";

      // Get song IDs already referenced by unused content for this feature type (for variety)
      const usedSongIds = isTrackLinked
        ? (
            await prisma.featureContent.findMany({
              where: {
                stationId: station.id,
                featureTypeId: combo.featureTypeId,
                isUsed: false,
                relatedSongId: { not: null },
              },
              select: { relatedSongId: true },
            })
          ).map((c) => c.relatedSongId).filter(Boolean) as string[]
        : [];

      const availableSongs = isTrackLinked
        ? allSongs.filter((s) => !usedSongIds.includes(s.id))
        : [];

      // Generate needed items
      for (let i = 0; i < needed; i++) {
        let song: SongData | undefined;
        if (isTrackLinked && availableSongs.length > 0) {
          // Pick a random song from available pool
          const idx = Math.floor(Math.random() * availableSongs.length);
          song = availableSongs[idx];
          // Remove so we don't pick the same song twice in this batch
          availableSongs.splice(idx, 1);
        } else if (isTrackLinked && allSongs.length > 0) {
          // Fallback: pick any random song if we've exhausted unique ones
          song = pick(allSongs);
        }

        const content = fillTemplate(combo.template, firstName, song);

        await prisma.featureContent.create({
          data: {
            stationId: station.id,
            featureTypeId: combo.featureTypeId,
            djPersonalityId: combo.djId,
            title: `${combo.featureTypeId.replace(/_/g, " ")} — ${combo.djName}`,
            content,
            generatedBy: "auto",
            relatedSongId: song?.id || null,
            contextData: JSON.stringify({
              artistName: song?.artistName || null,
              songTitle: song?.title || null,
              genre: song?.genre || null,
            }),
          },
        });

        generated++;
        byDj[combo.djName] = (byDj[combo.djName] || 0) + 1;
      }
    }

    logger.info("Features-daily cron completed", { generated, skipped, expired, byDj });

    return NextResponse.json({
      success: true,
      generated,
      skipped,
      expired,
      byDj,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Features-daily cron failed", { error });

    return NextResponse.json(
      {
        error: "Features daily cron failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
