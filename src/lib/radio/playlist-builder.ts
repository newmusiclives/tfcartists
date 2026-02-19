/**
 * Playlist Builder — resolves a clock template into an ordered HourPlaylist
 * with real songs assigned to each music slot.
 */

import { prisma } from "@/lib/db";

// Minimum hours before a song can repeat, by rotation category
const REPEAT_COOLDOWN: Record<string, number> = {
  A: 4,
  B: 6,
  C: 8,
  D: 12,
  E: 8,
};

// Adjacent fallback categories
const FALLBACK_CATEGORIES: Record<string, string[]> = {
  A: ["B", "C"],
  B: ["C", "A"],
  C: ["B", "D"],
  D: ["C", "E"],
  E: ["D", "C"],
};

interface ClockSlot {
  position: number;
  minute: number;
  duration: number;
  category: string; // TOH, A, B, C, D, E, DJ, Sponsor, Feature, Imaging
  type: string;     // station_id, song, voice_break, ad, feature, sweeper
  notes?: string;
  featureSlot?: number;
  featuredTrack?: string;
}

interface ResolvedSlot extends ClockSlot {
  songId?: string;
  songTitle?: string;
  artistName?: string;
  voiceTrackId?: string;
  featureContentId?: string;
}

interface SongCandidate {
  id: string;
  title: string;
  artistName: string;
  rotationCategory: string;
  vocalGender: string;
  tempoCategory: string;
  playCount: number;
  lastPlayedAt: Date | null;
}

export interface BuildPlaylistOptions {
  stationId: string;
  djId: string;
  clockTemplateId: string;
  airDate: Date;  // Date only (time ignored)
  hourOfDay: number;
}

export interface BuildPlaylistResult {
  hourPlaylistId: string;
  slots: ResolvedSlot[];
  songsAssigned: number;
}

/**
 * Build an HourPlaylist by resolving real songs into each music slot
 * of the given clock template.
 */
export async function buildHourPlaylist(opts: BuildPlaylistOptions): Promise<BuildPlaylistResult> {
  const { stationId, djId, clockTemplateId, airDate, hourOfDay } = opts;

  // 1. Load the clock template
  const template = await prisma.clockTemplate.findUnique({
    where: { id: clockTemplateId },
  });
  if (!template || !template.clockPattern) {
    throw new Error(`Clock template ${clockTemplateId} not found or has no pattern`);
  }

  const clockSlots: ClockSlot[] = JSON.parse(template.clockPattern);

  // 2. Load candidate songs for this station
  const allSongs = await prisma.song.findMany({
    where: { stationId, isActive: true },
    select: {
      id: true,
      title: true,
      artistName: true,
      rotationCategory: true,
      vocalGender: true,
      tempoCategory: true,
      playCount: true,
      lastPlayedAt: true,
    },
  });

  // 3. Get recently played songs for cooldown filtering
  const cooldownHours = Math.max(...Object.values(REPEAT_COOLDOWN));
  const cooldownSince = new Date(airDate);
  cooldownSince.setHours(hourOfDay - cooldownHours, 0, 0, 0);

  const recentPlays = await prisma.trackPlayback.findMany({
    where: {
      djId,
      playedAt: { gte: cooldownSince },
    },
    select: { trackId: true, playedAt: true },
  });

  const recentPlayMap = new Map<string, Date>();
  for (const play of recentPlays) {
    if (play.trackId) {
      const existing = recentPlayMap.get(play.trackId);
      if (!existing || play.playedAt > existing) {
        recentPlayMap.set(play.trackId, play.playedAt);
      }
    }
  }

  // 4. Resolve each slot
  const resolvedSlots: ResolvedSlot[] = [];
  const usedSongIds = new Set<string>();
  const recentArtists: string[] = []; // Track artist order for separation
  const genderBalanceTarget = template.genderBalanceTarget || 0.5;
  let femaleCount = 0;
  let songCount = 0;
  let songsAssigned = 0;

  for (const slot of clockSlots) {
    const resolved: ResolvedSlot = { ...slot };

    if (slot.type === "song" && ["A", "B", "C", "D", "E"].includes(slot.category)) {
      const song = selectSong({
        candidates: allSongs,
        category: slot.category,
        usedSongIds,
        recentArtists,
        recentPlayMap,
        hourOfDay,
        airDate,
        genderBalanceTarget,
        femaleCount,
        songCount,
        templateTempo: template.tempo,
      });

      if (song) {
        resolved.songId = song.id;
        resolved.songTitle = song.title;
        resolved.artistName = song.artistName;
        usedSongIds.add(song.id);
        recentArtists.push(song.artistName);
        if (song.vocalGender === "female") femaleCount++;
        songCount++;
        songsAssigned++;
      }
    }

    resolvedSlots.push(resolved);
  }

  // 5. Normalize airDate to midnight
  const normalizedDate = new Date(airDate);
  normalizedDate.setHours(0, 0, 0, 0);

  // 6. Save to DB
  const hourPlaylist = await prisma.hourPlaylist.upsert({
    where: {
      stationId_djId_airDate_hourOfDay: {
        stationId,
        djId,
        airDate: normalizedDate,
        hourOfDay,
      },
    },
    update: {
      clockTemplateId,
      slots: JSON.stringify(resolvedSlots),
      status: "draft",
    },
    create: {
      stationId,
      djId,
      clockTemplateId,
      airDate: normalizedDate,
      hourOfDay,
      slots: JSON.stringify(resolvedSlots),
      status: "draft",
    },
  });

  return {
    hourPlaylistId: hourPlaylist.id,
    slots: resolvedSlots,
    songsAssigned,
  };
}

interface SelectSongOptions {
  candidates: SongCandidate[];
  category: string;
  usedSongIds: Set<string>;
  recentArtists: string[];
  recentPlayMap: Map<string, Date>;
  hourOfDay: number;
  airDate: Date;
  genderBalanceTarget: number;
  femaleCount: number;
  songCount: number;
  templateTempo: string | null;
}

function selectSong(opts: SelectSongOptions): SongCandidate | null {
  const {
    candidates, category, usedSongIds, recentArtists, recentPlayMap,
    hourOfDay, airDate, genderBalanceTarget, femaleCount, songCount, templateTempo,
  } = opts;

  // Try requested category first, then fallbacks
  const categoriesToTry = [category, ...(FALLBACK_CATEGORIES[category] || [])];

  for (const cat of categoriesToTry) {
    const eligible = candidates.filter((song) => {
      // Must match category
      if (song.rotationCategory !== cat) return false;

      // Exclude already used in this hour
      if (usedSongIds.has(song.id)) return false;

      // Artist separation: no same artist within last 3 songs
      const last3Artists = recentArtists.slice(-3);
      if (last3Artists.includes(song.artistName)) return false;

      // Cooldown check
      const cooldownMs = (REPEAT_COOLDOWN[cat] || 8) * 60 * 60 * 1000;
      const lastPlayed = recentPlayMap.get(song.id);
      if (lastPlayed) {
        const broadcastTime = new Date(airDate);
        broadcastTime.setHours(hourOfDay, 0, 0, 0);
        if (broadcastTime.getTime() - lastPlayed.getTime() < cooldownMs) return false;
      }

      return true;
    });

    if (eligible.length === 0) continue;

    // Score candidates
    const maxPlayCount = Math.max(...eligible.map((s) => s.playCount), 1);
    const currentFemaleRatio = songCount > 0 ? femaleCount / songCount : 0;

    const scored = eligible.map((song) => {
      const randomScore = Math.random() * 0.4;
      const freshScore = (1 - song.playCount / maxPlayCount) * 0.3;

      // Tempo match
      let tempoScore = 0.1; // neutral default
      if (templateTempo) {
        const tempoMap: Record<string, string[]> = {
          upbeat: ["fast", "very_fast"],
          moderate: ["medium"],
          laid_back: ["slow", "very_slow"],
        };
        const desiredTempos = tempoMap[templateTempo] || ["medium"];
        if (desiredTempos.includes(song.tempoCategory)) tempoScore = 0.2;
      }

      // Gender balance — favor underrepresented gender
      let varietyScore = 0.05;
      if (songCount > 0) {
        const needsFemale = currentFemaleRatio < genderBalanceTarget;
        if (needsFemale && song.vocalGender === "female") varietyScore = 0.1;
        if (!needsFemale && song.vocalGender === "male") varietyScore = 0.1;
      }

      return {
        song,
        score: randomScore + freshScore + tempoScore + varietyScore,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].song;
  }

  return null;
}
