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

// Adjacent fallback categories (used when a category has songs but none are
// eligible due to cooldown / artist separation — NOT for empty categories)
const FALLBACK_CATEGORIES: Record<string, string[]> = {
  A: ["B", "C"],
  B: ["C", "A"],
  C: ["B", "D"],
  D: ["C", "B"],
  E: ["D", "C"],
};

// When a category has zero songs, redistribute its clock slots to these
// alternatives (cycled round-robin so slots spread across categories).
const EMPTY_CATEGORY_REMAP: Record<string, string[]> = {
  A: ["B", "C"],
  B: ["A", "C"],
  C: ["B", "D"],
  D: ["C", "B"],
  E: ["B", "C", "D"],
};

// =============================================================================
// CATEGORY E SCALING
// =============================================================================
//
// As the number of Category E artists grows, E tracks gradually replace
// D, C, and B slots. A slots are NEVER replaced — they're power rotation.
//
// Scale thresholds (by number of active E-category songs):
//   0-9 songs:     No replacement. E only fills E-designated clock slots.
//   10-49 songs:   D slots begin converting to E (0% at 10, 100% at 49)
//   50-99 songs:   C slots begin converting to E (0% at 50, 100% at 99)
//   100-199 songs: B slots begin converting to E (0% at 100, 100% at 199)
//
// PROTECTION RULE: 20% of B, C, and D slots are ALWAYS reserved for the
// main music library — they will never be replaced by E tracks, regardless
// of how many E artists exist. This ensures variety and discovery.
//
const LIBRARY_PROTECTION_RATE = 0.2; // 20% of B/C/D always from library

interface EScaleConfig {
  /** Category to potentially replace */
  category: string;
  /** E song count where replacement starts */
  startAt: number;
  /** E song count where replacement reaches maximum */
  fullAt: number;
}

const E_SCALE_TIERS: EScaleConfig[] = [
  { category: "D", startAt: 10, fullAt: 49 },
  { category: "C", startAt: 50, fullAt: 99 },
  { category: "B", startAt: 100, fullAt: 199 },
];

/**
 * Calculate the probability that a given B/C/D slot should be replaced
 * by a Category E track, based on the current E inventory size.
 * Returns 0 (never replace) to 0.8 (max replacement, respecting 20% protection).
 */
function eReplacementProbability(slotCategory: string, eSongCount: number): number {
  if (slotCategory === "A") return 0; // A is never replaced

  const tier = E_SCALE_TIERS.find(t => t.category === slotCategory);
  if (!tier) return 0;

  if (eSongCount < tier.startAt) return 0;
  if (eSongCount >= tier.fullAt) return 1 - LIBRARY_PROTECTION_RATE; // max 80%

  // Linear ramp between startAt and fullAt
  const progress = (eSongCount - tier.startAt) / (tier.fullAt - tier.startAt);
  return progress * (1 - LIBRARY_PROTECTION_RATE); // 0% to 80%
}

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
  isFeatured: boolean;
}

export interface BuildPlaylistOptions {
  stationId: string;
  djId: string;
  clockTemplateId: string;
  airDate: Date;  // Date only (time ignored)
  hourOfDay: number;
  /** Song IDs to exclude — used to prevent repeats across a DJ's multi-hour shift */
  excludeSongIds?: Set<string>;
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
      isFeatured: true,
    },
  });

  // 3. Get recently played songs for cooldown filtering
  //    TWO sources: TrackPlayback records (from actual airplay) AND
  //    already-locked playlists for today (prevents repeats even when
  //    Railway hasn't written playback records back to the database).
  const cooldownHours = Math.max(...Object.values(REPEAT_COOLDOWN));
  const cooldownSince = new Date(airDate);
  cooldownSince.setUTCHours(hourOfDay - cooldownHours, 0, 0, 0);

  const recentPlayMap = new Map<string, Date>();

  // Source A: TrackPlayback records (actual airplay history)
  const recentPlays = await prisma.trackPlayback.findMany({
    where: {
      djId,
      playedAt: { gte: cooldownSince },
    },
    select: { trackId: true, playedAt: true },
  });
  for (const play of recentPlays) {
    if (play.trackId) {
      const existing = recentPlayMap.get(play.trackId);
      if (!existing || play.playedAt > existing) {
        recentPlayMap.set(play.trackId, play.playedAt);
      }
    }
  }

  // Source B: Already-locked playlists for today — prevents repeats across
  //          adjacent hours even when TrackPlayback records don't exist yet.
  //          This is the PRIMARY repeat prevention for freshly-built playlists.
  const lockedPlaylists = await prisma.hourPlaylist.findMany({
    where: {
      stationId,
      airDate: new Date(new Date(airDate).setUTCHours(0, 0, 0, 0)),
      status: { in: ["locked", "aired", "draft"] },
      hourOfDay: { not: hourOfDay }, // exclude current hour (we're rebuilding it)
    },
    select: { slots: true, hourOfDay: true },
  });
  for (const lp of lockedPlaylists) {
    if (!lp.slots) continue;
    const lpSlots: Array<{ songId?: string }> = JSON.parse(
      typeof lp.slots === "string" ? lp.slots : JSON.stringify(lp.slots)
    );
    // Treat locked-playlist songs as "played" at the start of that hour
    const playedAt = new Date(airDate);
    playedAt.setUTCHours(lp.hourOfDay, 0, 0, 0);
    for (const slot of lpSlots) {
      if (slot.songId) {
        const existing = recentPlayMap.get(slot.songId);
        if (!existing || playedAt > existing) {
          recentPlayMap.set(slot.songId, playedAt);
        }
      }
    }
  }

  // 4. Check category inventory — detect empty categories for redistribution
  const categoryInventory = new Map<string, number>();
  for (const song of allSongs) {
    categoryInventory.set(
      song.rotationCategory,
      (categoryInventory.get(song.rotationCategory) || 0) + 1,
    );
  }
  const remapCounters = new Map<string, number>();

  // 5. Resolve each slot
  const resolvedSlots: ResolvedSlot[] = [];
  const usedSongIds = new Set<string>(opts.excludeSongIds || []);
  const recentArtists: string[] = []; // Track artist order for separation
  const genderBalanceTarget = template.genderBalanceTarget || 0.5;
  let femaleCount = 0;
  let songCount = 0;
  let songsAssigned = 0;
  let eFeaturedCounter = 0; // Tracks E-slot count for 1-in-4 featured rotation

  // Category E scaling: count E songs to determine replacement behavior
  const eSongCount = categoryInventory.get("E") || 0;

  for (const slot of clockSlots) {
    const resolved: ResolvedSlot = { ...slot };

    if (slot.type === "song" && ["A", "B", "C", "D", "E"].includes(slot.category)) {
      // If the requested category has zero songs, redistribute to a
      // populated alternative (round-robin so slots spread evenly).
      let effectiveCategory = slot.category;
      if ((categoryInventory.get(slot.category) || 0) === 0) {
        const remapOptions = (EMPTY_CATEGORY_REMAP[slot.category] || ["C"])
          .filter((c) => (categoryInventory.get(c) || 0) > 0);
        if (remapOptions.length > 0) {
          const counter = remapCounters.get(slot.category) || 0;
          effectiveCategory = remapOptions[counter % remapOptions.length];
          remapCounters.set(slot.category, counter + 1);
        }
      }

      // Category E scaling: B/C/D slots may be replaced by E based on
      // how many E songs exist. 20% of each category is always protected.
      if (
        eSongCount > 0 &&
        ["B", "C", "D"].includes(effectiveCategory) &&
        effectiveCategory === slot.category // only replace original slots, not already-remapped ones
      ) {
        const replaceProbability = eReplacementProbability(effectiveCategory, eSongCount);
        if (replaceProbability > 0 && Math.random() < replaceProbability) {
          effectiveCategory = "E";
        }
      }

      // Every 4th E-slot prefers featured artist tracks
      let preferFeatured = false;
      if (effectiveCategory === "E") {
        if (eFeaturedCounter % 4 === 0) preferFeatured = true;
        eFeaturedCounter++;
      }

      const song = selectSong({
        candidates: allSongs,
        category: effectiveCategory,
        usedSongIds,
        recentArtists,
        recentPlayMap,
        hourOfDay,
        airDate,
        genderBalanceTarget,
        femaleCount,
        songCount,
        templateTempo: template.tempo,
        preferFeatured,
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

  // 6. Normalize airDate to midnight UTC
  const normalizedDate = new Date(airDate);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  // 7. Save to DB
  // Check if a playlist already exists — if so, delete stale voice tracks
  // that reference songs from the previous build. Without this cleanup,
  // voice tracks back-announce the wrong songs (e.g. "that was Time Magraw"
  // when the current playlist has Florida Georgia Line at that position).
  const existingPlaylist = await prisma.hourPlaylist.findUnique({
    where: {
      stationId_djId_airDate_hourOfDay: {
        stationId,
        djId,
        airDate: normalizedDate,
        hourOfDay,
      },
    },
    select: { id: true, status: true },
  });

  if (existingPlaylist && existingPlaylist.status === "draft") {
    // Delete stale voice tracks so they'll be regenerated with correct song refs
    await prisma.voiceTrack.deleteMany({
      where: { hourPlaylistId: existingPlaylist.id },
    });
  }

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
  preferFeatured?: boolean;
}

function selectSong(opts: SelectSongOptions): SongCandidate | null {
  const {
    candidates, category, usedSongIds, recentArtists, recentPlayMap,
    hourOfDay, airDate, genderBalanceTarget, femaleCount, songCount, templateTempo,
    preferFeatured,
  } = opts;

  // If preferFeatured, try featured songs first, then fall back to normal selection
  if (preferFeatured) {
    const featuredResult = selectSong({
      ...opts,
      preferFeatured: false,
      candidates: candidates.filter((s) => s.isFeatured),
    });
    if (featuredResult) return featuredResult;
    // No eligible featured songs — fall through to normal selection
  }

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
        broadcastTime.setUTCHours(hourOfDay, 0, 0, 0);
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
