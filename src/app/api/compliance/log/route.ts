import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { STATION_TIMEZONE } from "@/lib/timezone";

export const dynamic = "force-dynamic";

interface LogEntry {
  time: string;
  type: "song" | "ad" | "voicetrack" | "imaging";
  title: string;
  artist: string;
  duration: number | null;
  djOnDuty: string;
}

/**
 * GET /api/compliance/log?date=2026-03-25&hour=8
 *
 * Returns a chronological program log for the given date.
 * Optionally filtered by hour (0-23).
 * Falls back to HourPlaylist slots when no TrackPlayback data exists.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const hourStr = searchParams.get("hour");

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { error: "date query parameter required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const hour = hourStr !== null ? parseInt(hourStr, 10) : null;
    if (hour !== null && (isNaN(hour) || hour < 0 || hour > 23)) {
      return NextResponse.json(
        { error: "hour must be 0-23" },
        { status: 400 }
      );
    }

    // Build date range in Mountain Time -> UTC
    const dayStart = mountainDateToUTC(dateStr, hour ?? 0);
    const dayEnd = mountainDateToUTC(
      dateStr,
      hour !== null ? hour + 1 : 24
    );

    // 1. Try TrackPlayback first
    const playbacks = await prisma.trackPlayback.findMany({
      where: {
        playedAt: { gte: dayStart, lt: dayEnd },
      },
      include: {
        dj: { select: { name: true } },
      },
      orderBy: { playedAt: "asc" },
    });

    if (playbacks.length > 0) {
      const entries: LogEntry[] = playbacks.map((pb) => ({
        time: formatMountainTime(pb.playedAt),
        type: classifyPlayback(pb),
        title: pb.trackTitle,
        artist: pb.artistName,
        duration: pb.duration ?? null,
        djOnDuty: pb.dj?.name ?? "Automation",
      }));

      return NextResponse.json({
        date: dateStr,
        hour: hour ?? "all",
        source: "playback",
        totalEntries: entries.length,
        entries,
      });
    }

    // 2. Fallback: reconstruct from HourPlaylist slots
    const airDate = new Date(`${dateStr}T00:00:00Z`);

    const playlists = await prisma.hourPlaylist.findMany({
      where: {
        airDate,
        ...(hour !== null ? { hourOfDay: hour } : {}),
      },
      orderBy: { hourOfDay: "asc" },
    });

    const entries: LogEntry[] = [];

    for (const pl of playlists) {
      const djRecord = await prisma.dJ.findUnique({
        where: { id: pl.djId },
        select: { name: true },
      });
      const djName = djRecord?.name ?? "Automation";

      let slots: any[] = [];
      try {
        slots = typeof pl.slots === "string" ? JSON.parse(pl.slots) : pl.slots as any[];
      } catch {
        continue;
      }

      for (const slot of slots) {
        const minute = slot.minute ?? slot.position ?? 0;
        const hourPadded = String(pl.hourOfDay).padStart(2, "0");
        const minutePadded = String(minute).padStart(2, "0");

        entries.push({
          time: `${dateStr} ${hourPadded}:${minutePadded}:00 MT`,
          type: classifySlot(slot.type ?? slot.category ?? "song"),
          title: slot.songTitle ?? slot.title ?? slot.type ?? "Unknown",
          artist: slot.artistName ?? "",
          duration: slot.duration ?? null,
          djOnDuty: djName,
        });
      }
    }

    return NextResponse.json({
      date: dateStr,
      hour: hour ?? "all",
      source: "playlist",
      totalEntries: entries.length,
      entries,
    });
  } catch (err) {
    logger.error("Compliance log API error", { error: err });
    return NextResponse.json(
      { error: "Failed to fetch compliance log" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountainDateToUTC(dateStr: string, hour: number): Date {
  // Create a date in Mountain Time, then find the UTC equivalent
  // Mountain Time is UTC-7 (standard) or UTC-6 (daylight)
  const fakeLocal = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00`);
  // Use Intl to figure out the real offset
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: STATION_TIMEZONE,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(fakeLocal);
  const tzPart = parts.find((p) => p.type === "timeZoneName");
  // Parse offset like "GMT-6" or "GMT-7"
  const offsetMatch = tzPart?.value?.match(/GMT([+-]?\d+)/);
  const offsetHours = offsetMatch ? parseInt(offsetMatch[1], 10) : -7;

  // Mountain Time offset is negative (behind UTC), so UTC = local - offset
  const utc = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00Z`);
  utc.setHours(utc.getHours() - offsetHours);
  return utc;
}

function formatMountainTime(date: Date): string {
  return (
    date.toLocaleString("en-US", {
      timeZone: STATION_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }) + " MT"
  );
}

function classifyPlayback(pb: {
  trackTitle: string;
  metadata?: any;
}): LogEntry["type"] {
  const meta = pb.metadata as Record<string, any> | null;
  if (meta?.type === "ad" || meta?.type === "sponsor") return "ad";
  if (meta?.type === "voicetrack" || meta?.type === "voice_track") return "voicetrack";
  if (meta?.type === "imaging" || meta?.type === "jingle" || meta?.type === "sweeper") return "imaging";
  // Heuristic fallback
  const t = pb.trackTitle.toLowerCase();
  if (t.includes("sponsor") || t.includes("ad spot")) return "ad";
  if (t.includes("voice track") || t.includes("voicetrack") || t.includes("dj intro")) return "voicetrack";
  if (t.includes("jingle") || t.includes("sweeper") || t.includes("imaging") || t.includes("station id")) return "imaging";
  return "song";
}

function classifySlot(type: string): LogEntry["type"] {
  const t = type.toLowerCase();
  if (t.includes("ad") || t.includes("sponsor") || t === "commercial") return "ad";
  if (t.includes("voice") || t.includes("dj") || t === "intro" || t === "back_announce") return "voicetrack";
  if (t.includes("imaging") || t.includes("jingle") || t.includes("sweeper") || t === "station_id") return "imaging";
  return "song";
}
