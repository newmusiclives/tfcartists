import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/recommendations?stationId=x&type=similar|expand|trending
 *
 * AI Music Recommendations for station operators.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stationId = searchParams.get("stationId");
    const type = searchParams.get("type") || "similar";

    if (!stationId) {
      return NextResponse.json(
        { error: "stationId is required" },
        { status: 400 }
      );
    }

    switch (type) {
      case "similar":
        return await getSimilarRecommendations(stationId);
      case "expand":
        return await getExpansionSuggestions(stationId);
      case "trending":
        return await getTrendingSongs(stationId);
      case "profile":
        return await getStationProfile(stationId);
      case "rotation-health":
        return await getRotationHealth(stationId);
      default:
        return NextResponse.json(
          { error: "Invalid type. Use: similar, expand, trending, profile, rotation-health" },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error, "/api/recommendations");
  }
}

// ─── Similar: Find hidden gems matching popular song profiles ───────────────

async function getSimilarRecommendations(stationId: string) {
  // Get top 20 most-played songs for this station
  const topSongs = await prisma.song.findMany({
    where: { stationId, isActive: true },
    orderBy: { playCount: "desc" },
    take: 20,
  });

  if (topSongs.length === 0) {
    return NextResponse.json({ recommendations: [], message: "No songs in library yet" });
  }

  // Build average profile from top songs
  const genreCounts: Record<string, number> = {};
  let totalBpm = 0;
  let bpmCount = 0;
  let totalEnergy = 0;
  let energyCount = 0;
  const tempoCounts: Record<string, number> = {};
  const vocalCounts: Record<string, number> = {};

  for (const song of topSongs) {
    if (song.genre) genreCounts[song.genre] = (genreCounts[song.genre] || 0) + 1;
    if (song.bpm) { totalBpm += song.bpm; bpmCount++; }
    if (song.energy !== null) { totalEnergy += song.energy; energyCount++; }
    if (song.tempoCategory) tempoCounts[song.tempoCategory] = (tempoCounts[song.tempoCategory] || 0) + 1;
    if (song.vocalGender) vocalCounts[song.vocalGender] = (vocalCounts[song.vocalGender] || 0) + 1;
  }

  const avgBpm = bpmCount > 0 ? Math.round(totalBpm / bpmCount) : null;
  const avgEnergy = energyCount > 0 ? totalEnergy / energyCount : null;
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  // Find low-playCount songs that match the profile
  const where: Record<string, unknown> = {
    stationId,
    isActive: true,
    playCount: { lt: 5 }, // Hidden gems = barely played
  };

  if (topGenres.length > 0) {
    where.genre = { in: topGenres };
  }

  const candidates = await prisma.song.findMany({
    where,
    orderBy: { playCount: "asc" },
    take: 50,
  });

  // Score each candidate by similarity to the popular profile
  const scored = candidates.map((song) => {
    let score = 0;

    // Genre match (most important)
    if (song.genre && topGenres.includes(song.genre)) {
      const rank = topGenres.indexOf(song.genre);
      score += (5 - rank) * 10; // Top genre = 50pts, 2nd = 40pts...
    }

    // BPM proximity (within 20 BPM = good)
    if (avgBpm && song.bpm) {
      const diff = Math.abs(song.bpm - avgBpm);
      if (diff <= 20) score += (20 - diff) * 1.5;
    }

    // Energy proximity
    if (avgEnergy !== null && song.energy !== null) {
      const diff = Math.abs(song.energy - avgEnergy);
      score += (1 - diff) * 20; // Perfect match = 20pts
    }

    // Tempo category match
    if (song.tempoCategory && tempoCounts[song.tempoCategory]) {
      score += 10;
    }

    // Vocal gender match
    if (song.vocalGender && vocalCounts[song.vocalGender]) {
      score += 5;
    }

    return { ...song, similarityScore: Math.round(score) };
  });

  // Sort by score descending, take top 10
  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  const recommendations = scored.slice(0, 10);

  return NextResponse.json({
    recommendations,
    profile: { topGenres, avgBpm, avgEnergy },
  });
}

// ─── Expand: AI-suggested artists/genres to add ─────────────────────────────

async function getExpansionSuggestions(stationId: string) {
  const apiKey = await getConfig("OPENAI_API_KEY");
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured. Add it in Settings." },
      { status: 503 }
    );
  }

  // Build station profile
  const allSongs = await prisma.song.findMany({
    where: { stationId, isActive: true },
    select: { genre: true, artistName: true, bpm: true, energy: true },
  });

  if (allSongs.length === 0) {
    return NextResponse.json({ suggestions: [], message: "No songs in library yet" });
  }

  const genreCounts: Record<string, number> = {};
  const artistCounts: Record<string, number> = {};

  for (const song of allSongs) {
    if (song.genre) genreCounts[song.genre] = (genreCounts[song.genre] || 0) + 1;
    artistCounts[song.artistName] = (artistCounts[song.artistName] || 0) + 1;
  }

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([g, c]) => `${g} (${c} songs)`);

  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([a]) => a);

  const prompt = `You are a music programming consultant for a radio station. Based on the station's current library profile, suggest 6 artists and/or genres they should add to expand their sound while staying on-brand.

Current library (${allSongs.length} songs):
- Top genres: ${topGenres.join(", ")}
- Top artists: ${topArtists.join(", ")}

For each suggestion, respond in this exact JSON format:
{
  "suggestions": [
    {
      "artistName": "Artist Name",
      "genre": "Genre",
      "reason": "One sentence explaining why this fits the station's sound"
    }
  ]
}

Focus on:
1. Artists similar to their top artists but not already in library
2. Adjacent genres that would complement their sound
3. A mix of established and emerging artists
Only respond with valid JSON, no other text.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json(
      { error: `OpenAI API error: ${response.status}`, detail: err },
      { status: 502 }
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";

  let suggestions;
  try {
    const parsed = JSON.parse(content);
    suggestions = parsed.suggestions || [];
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      suggestions = parsed.suggestions || [];
    } else {
      suggestions = [];
    }
  }

  // Check which suggested artists are already in the library
  const existingArtists = new Set(
    allSongs.map((s) => s.artistName.toLowerCase())
  );

  const enriched = suggestions.map(
    (s: { artistName: string; genre: string; reason: string }) => ({
      ...s,
      alreadyInLibrary: existingArtists.has(s.artistName.toLowerCase()),
    })
  );

  return NextResponse.json({ suggestions: enriched, stationProfile: { topGenres, topArtists } });
}

// ─── Trending: Songs gaining play velocity ──────────────────────────────────

async function getTrendingSongs(stationId: string) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Get all songs for this station
  const songs = await prisma.song.findMany({
    where: { stationId, isActive: true },
    select: { id: true, title: true, artistName: true, genre: true, rotationCategory: true, artworkUrl: true, playCount: true },
  });

  if (songs.length === 0) {
    return NextResponse.json({ trending: [], message: "No songs in library yet" });
  }

  // Get recent playbacks via matching title+artist (since TrackPlayback has no stationId)
  const songIdentifiers = songs.map((s) => ({
    title: s.title,
    artist: s.artistName,
  }));

  // Get plays from last 7 days
  const recentPlays = await prisma.trackPlayback.findMany({
    where: {
      playedAt: { gte: sevenDaysAgo },
      OR: songIdentifiers.map((si) => ({
        trackTitle: si.title,
        artistName: si.artist,
      })),
    },
    select: { trackTitle: true, artistName: true },
  });

  // Get plays from 7-14 days ago
  const priorPlays = await prisma.trackPlayback.findMany({
    where: {
      playedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      OR: songIdentifiers.length > 0
        ? songIdentifiers.map((si) => ({
            trackTitle: si.title,
            artistName: si.artist,
          }))
        : undefined,
    },
    select: { trackTitle: true, artistName: true },
  });

  // Count plays per song key
  const recentCounts: Record<string, number> = {};
  const priorCounts: Record<string, number> = {};

  const makeKey = (title: string, artist: string) =>
    `${title.toLowerCase()}|||${artist.toLowerCase()}`;

  for (const p of recentPlays) {
    const key = makeKey(p.trackTitle, p.artistName);
    recentCounts[key] = (recentCounts[key] || 0) + 1;
  }

  for (const p of priorPlays) {
    const key = makeKey(p.trackTitle, p.artistName);
    priorCounts[key] = (priorCounts[key] || 0) + 1;
  }

  // Calculate velocity for each song
  const trending = songs
    .map((song) => {
      const key = makeKey(song.title, song.artistName);
      const recent = recentCounts[key] || 0;
      const prior = priorCounts[key] || 0;

      let velocityPct = 0;
      if (prior === 0 && recent > 0) {
        velocityPct = 100; // New entry
      } else if (prior > 0) {
        velocityPct = Math.round(((recent - prior) / prior) * 100);
      }

      return {
        ...song,
        recentPlays: recent,
        priorPlays: prior,
        velocityPct,
        direction: recent > prior ? "up" : recent < prior ? "down" : "flat",
      };
    })
    .filter((s) => s.recentPlays > 0) // Only include songs with recent plays
    .sort((a, b) => b.velocityPct - a.velocityPct);

  return NextResponse.json({ trending: trending.slice(0, 20) });
}

// ─── Station Profile: Genre/BPM/Energy/Vocal breakdown ─────────────────────

async function getStationProfile(stationId: string) {
  const songs = await prisma.song.findMany({
    where: { stationId, isActive: true },
    select: {
      genre: true,
      bpm: true,
      energy: true,
      vocalGender: true,
      tempoCategory: true,
      rotationCategory: true,
      playCount: true,
    },
  });

  const totalSongs = songs.length;
  if (totalSongs === 0) {
    return NextResponse.json({ profile: null, message: "No songs in library yet" });
  }

  // Genre breakdown
  const genreCounts: Record<string, number> = {};
  for (const s of songs) {
    const g = s.genre || "Unknown";
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  }
  const genres = Object.entries(genreCounts)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / totalSongs) * 100) }))
    .sort((a, b) => b.count - a.count);

  // BPM distribution
  const bpmSongs = songs.filter((s) => s.bpm);
  const avgBpm = bpmSongs.length > 0
    ? Math.round(bpmSongs.reduce((sum, s) => sum + s.bpm!, 0) / bpmSongs.length)
    : null;
  const bpmRanges = [
    { label: "< 80", min: 0, max: 79, count: 0 },
    { label: "80-99", min: 80, max: 99, count: 0 },
    { label: "100-119", min: 100, max: 119, count: 0 },
    { label: "120-139", min: 120, max: 139, count: 0 },
    { label: "140+", min: 140, max: 999, count: 0 },
  ];
  for (const s of bpmSongs) {
    const range = bpmRanges.find((r) => s.bpm! >= r.min && s.bpm! <= r.max);
    if (range) range.count++;
  }

  // Energy distribution
  const energySongs = songs.filter((s) => s.energy !== null);
  const avgEnergy = energySongs.length > 0
    ? Math.round((energySongs.reduce((sum, s) => sum + s.energy!, 0) / energySongs.length) * 100) / 100
    : null;
  const energyBuckets = [
    { label: "Low (0-0.3)", min: 0, max: 0.3, count: 0 },
    { label: "Medium (0.3-0.6)", min: 0.3, max: 0.6, count: 0 },
    { label: "High (0.6-0.8)", min: 0.6, max: 0.8, count: 0 },
    { label: "Very High (0.8-1)", min: 0.8, max: 1.0, count: 0 },
  ];
  for (const s of energySongs) {
    const bucket = energyBuckets.find((b) => s.energy! >= b.min && s.energy! <= b.max);
    if (bucket) bucket.count++;
  }

  // Vocal gender split
  const vocalCounts: Record<string, number> = {};
  for (const s of songs) {
    const v = s.vocalGender || "unknown";
    vocalCounts[v] = (vocalCounts[v] || 0) + 1;
  }
  const vocalGenders = Object.entries(vocalCounts)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / totalSongs) * 100) }))
    .sort((a, b) => b.count - a.count);

  // Tempo breakdown
  const tempoCounts: Record<string, number> = {};
  for (const s of songs) {
    const t = s.tempoCategory || "medium";
    tempoCounts[t] = (tempoCounts[t] || 0) + 1;
  }
  const tempos = Object.entries(tempoCounts)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / totalSongs) * 100) }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    profile: {
      totalSongs,
      genres,
      avgBpm,
      bpmRanges,
      avgEnergy,
      energyBuckets,
      vocalGenders,
      tempos,
    },
  });
}

// ─── Rotation Health: Check balance of A/B/C/D/E categories ────────────────

async function getRotationHealth(stationId: string) {
  const songs = await prisma.song.findMany({
    where: { stationId, isActive: true },
    select: { rotationCategory: true, playCount: true },
  });

  const totalSongs = songs.length;
  if (totalSongs === 0) {
    return NextResponse.json({ health: null, message: "No songs in library yet" });
  }

  // Ideal distribution targets
  const idealPcts: Record<string, { min: number; max: number; label: string }> = {
    A: { min: 10, max: 20, label: "Power/Hits" },
    B: { min: 15, max: 25, label: "Secondary" },
    C: { min: 25, max: 40, label: "Medium" },
    D: { min: 10, max: 25, label: "Recurrent" },
    E: { min: 5, max: 15, label: "Independent/Featured" },
  };

  const categoryCounts: Record<string, { count: number; totalPlays: number }> = {};
  for (const s of songs) {
    const cat = s.rotationCategory || "C";
    if (!categoryCounts[cat]) categoryCounts[cat] = { count: 0, totalPlays: 0 };
    categoryCounts[cat].count++;
    categoryCounts[cat].totalPlays += s.playCount;
  }

  const categories = Object.entries(idealPcts).map(([cat, ideal]) => {
    const data = categoryCounts[cat] || { count: 0, totalPlays: 0 };
    const pct = Math.round((data.count / totalSongs) * 100);
    const avgPlays = data.count > 0 ? Math.round(data.totalPlays / data.count) : 0;

    let status: "healthy" | "low" | "high" = "healthy";
    if (pct < ideal.min) status = "low";
    else if (pct > ideal.max) status = "high";

    return {
      category: cat,
      label: ideal.label,
      count: data.count,
      pct,
      avgPlays,
      idealRange: `${ideal.min}-${ideal.max}%`,
      status,
    };
  });

  const overallHealthy = categories.every((c) => c.status === "healthy");

  return NextResponse.json({
    health: {
      totalSongs,
      categories,
      overallHealthy,
    },
  });
}
