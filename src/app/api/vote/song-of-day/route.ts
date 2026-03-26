import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getOrCreateTodayCandidates() {
  const date = todayKey();
  const key = `sotd:${date}`;

  const existing = await prisma.systemConfig.findUnique({ where: { key } });
  if (existing) {
    return JSON.parse(existing.value);
  }

  // Pick 3 random songs
  const songCount = await prisma.song.count();
  if (songCount === 0) {
    return { date, candidates: [], votes: {} };
  }

  const indices = new Set<number>();
  const max = Math.min(songCount, 3);
  while (indices.size < max) {
    indices.add(Math.floor(Math.random() * songCount));
  }

  const candidates = [];
  for (const idx of indices) {
    const song = await prisma.song.findFirst({
      skip: idx,
      take: 1,
      select: {
        id: true,
        title: true,
        artistName: true,
        genre: true,
        artworkUrl: true,
        fileUrl: true,
      },
    });
    if (song) candidates.push(song);
  }

  const data = {
    date,
    candidates,
    votes: Object.fromEntries(candidates.map((c) => [c.id, 0])),
  };

  await prisma.systemConfig.create({
    data: {
      key,
      value: JSON.stringify(data),
      category: "sotd",
      label: `Song of the Day — ${date}`,
      encrypted: false,
    },
  });

  return data;
}

export async function GET(request: NextRequest) {
  try {
    const todayData = await getOrCreateTodayCandidates();

    // Get previous 7 days winners
    const winners: Array<{ date: string; song: any; voteCount: number }> = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const pastKey = `sotd:${d.toISOString().slice(0, 10)}`;
      const pastConfig = await prisma.systemConfig.findUnique({ where: { key: pastKey } });
      if (pastConfig) {
        try {
          const pastData = JSON.parse(pastConfig.value);
          if (pastData.candidates?.length > 0 && pastData.votes) {
            // Find the winner (most votes)
            let maxVotes = 0;
            let winnerId = pastData.candidates[0]?.id;
            for (const [songId, count] of Object.entries(pastData.votes)) {
              if ((count as number) > maxVotes) {
                maxVotes = count as number;
                winnerId = songId;
              }
            }
            const winner = pastData.candidates.find((c: any) => c.id === winnerId);
            if (winner) {
              winners.push({
                date: pastData.date,
                song: winner,
                voteCount: maxVotes,
              });
            }
          }
        } catch {
          // skip
        }
      }
    }

    // Check if this IP already voted (via cookie info in response)
    const hasVoted = request.cookies.get(`sotd_voted_${todayKey()}`)?.value === "1";

    return NextResponse.json({
      date: todayData.date,
      candidates: todayData.candidates,
      votes: todayData.votes,
      hasVoted,
      previousWinners: winners,
    });
  } catch (error) {
    logger.error("Failed to get song of the day", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to get song of the day" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { songId } = await request.json();
    if (!songId) {
      return NextResponse.json({ error: "songId required" }, { status: 400 });
    }

    const date = todayKey();
    const cookieName = `sotd_voted_${date}`;

    // Check for existing vote via cookie
    if (request.cookies.get(cookieName)?.value === "1") {
      return NextResponse.json({ error: "Already voted today" }, { status: 429 });
    }

    const key = `sotd:${date}`;
    const config = await prisma.systemConfig.findUnique({ where: { key } });
    if (!config) {
      return NextResponse.json({ error: "No candidates for today" }, { status: 404 });
    }

    const data = JSON.parse(config.value);

    // Verify song is a candidate
    if (!data.candidates.some((c: any) => c.id === songId)) {
      return NextResponse.json({ error: "Song is not a candidate today" }, { status: 400 });
    }

    // Increment vote
    data.votes[songId] = (data.votes[songId] || 0) + 1;

    await prisma.systemConfig.update({
      where: { key },
      data: { value: JSON.stringify(data) },
    });

    logger.info("Song of the day vote cast", { songId, date });

    const response = NextResponse.json({
      success: true,
      votes: data.votes,
    });

    // Set cookie to prevent double-voting
    response.cookies.set(cookieName, "1", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    logger.error("Failed to cast vote", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}
