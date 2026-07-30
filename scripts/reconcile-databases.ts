/**
 * Database reconciliation.
 *
 * TrueFans RADIO runs on two stores that hold overlapping concepts:
 *
 *   platform (Prisma/Postgres)  Station, Song, Artist, DJ, TrackPlayback   ids are cuid
 *   playout  (FastAPI/Postgres) stations, songs, artists, plays            ids are uuid
 *
 * They use DIFFERENT ID SPACES. Any code that hardcodes an id from one system
 * into the other is fragile by construction, and that is not hypothetical: a
 * station uuid was hardcoded in the playout API's report_track_played, the
 * stations row was later recreated with a new id, and every play insert failed
 * on a foreign key for four months without anyone noticing.
 *
 * This joins the two on `station_code` - the stable human key - and reports
 * drift. It is READ ONLY. It never writes to either database, because an
 * automated "fix" across two sources of truth is how you lose data.
 *
 *   npx tsx scripts/reconcile-databases.ts
 *   npx tsx scripts/reconcile-databases.ts --json     # machine readable
 *   npx tsx scripts/reconcile-databases.ts --strict   # exit 1 on any drift (CI/cron)
 */

import { PrismaClient } from "@prisma/client";

const PLAYOUT_API =
  process.env.RAILWAY_BACKEND_URL ||
  "https://tfc-radio-backend-production.up.railway.app";

const prisma = new PrismaClient();

interface PlayoutStation {
  id: string;
  station_code: string;
  station_name: string;
  is_active: boolean;
  total_songs: number;
  total_djs: number;
}

interface Finding {
  severity: "error" | "warning" | "info";
  area: string;
  message: string;
  detail?: string;
}

const findings: Finding[] = [];

function add(severity: Finding["severity"], area: string, message: string, detail?: string) {
  findings.push({ severity, area, message, detail });
}

async function fetchPlayoutStations(): Promise<PlayoutStation[] | null> {
  try {
    const res = await fetch(`${PLAYOUT_API}/api/stations/`, {
      headers: { Accept: "application/json" },
      redirect: "follow",
    });
    if (!res.ok) {
      add("error", "playout", `Playout API returned HTTP ${res.status} for /api/stations/`);
      return null;
    }
    const data = (await res.json()) as { stations: PlayoutStation[] };
    return data.stations ?? [];
  } catch (error) {
    add(
      "error",
      "playout",
      "Could not reach the playout API",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

async function reconcileStations(playout: PlayoutStation[]) {
  const platform = await prisma.station.findMany({
    select: { id: true, stationCode: true, name: true, isActive: true },
  });

  const platformByCode = new Map(
    platform.filter((s) => s.stationCode).map((s) => [s.stationCode as string, s])
  );
  const playoutByCode = new Map(playout.map((s) => [s.station_code, s]));

  // A station the playout engine can serve but the platform does not know about
  for (const [code, p] of playoutByCode) {
    if (platformByCode.has(code)) continue;

    // An inactive station with no songs is scaffolding, not drift. Reporting it
    // as an error trains people to ignore the report, which defeats the point.
    const isDormant = !p.is_active && (p.total_songs ?? 0) === 0;
    add(
      isDormant ? "info" : "error",
      "stations",
      isDormant
        ? `"${code}" exists only in the playout database (inactive, no songs - ignoring)`
        : `"${code}" exists in the playout database but not in the platform`,
      isDormant
        ? undefined
        : `playout id ${p.id}. Anything the platform records for this station has nowhere to land.`
    );
  }

  // A station the platform sells but playout cannot serve
  for (const [code, p] of platformByCode) {
    if (!playoutByCode.has(code)) {
      add(
        "error",
        "stations",
        `"${code}" exists in the platform but not in the playout database`,
        `platform id ${p.id}. This station cannot go to air.`
      );
    }
  }

  // When NOTHING matches by code, the two systems have simply never agreed on
  // station identity. Suggest a mapping by comparing catalogue size rather than
  // leaving the operator with two lists and no interpretation.
  const unmatchedPlatform = [...platformByCode].filter(([c]) => !playoutByCode.has(c));
  const unmatchedPlayout = [...playoutByCode].filter(([c]) => !platformByCode.has(c));

  if (unmatchedPlatform.length && unmatchedPlayout.length) {
    for (const [platCode, plat] of unmatchedPlatform) {
      const platCount = await prisma.song.count({ where: { stationId: plat.id } });
      for (const [playCode, play] of unmatchedPlayout) {
        if (!play.total_songs || !platCount) continue;
        const diff = Math.abs(platCount - play.total_songs);
        const pct = (diff / Math.max(platCount, play.total_songs)) * 100;
        if (pct <= 10) {
          add(
            "warning",
            "stations",
            `"${platCode}" and "${playCode}" look like the SAME station under different codes`,
            `catalogue sizes ${platCount} vs ${play.total_songs} (${pct.toFixed(1)}% apart). ` +
              `Align station_code across both systems, or record the mapping explicitly - ` +
              `until then neither side can attribute plays, rights or revenue to the other.`
          );
        }
      }
    }
  }

  // Matched pairs: report the mapping and flag divergent state
  for (const [code, plat] of platformByCode) {
    const play = playoutByCode.get(code);
    if (!play) continue;

    add(
      "info",
      "stations",
      `"${code}" mapped`,
      `platform ${plat.id}  <->  playout ${play.id}`
    );

    if (plat.isActive !== play.is_active) {
      add(
        "warning",
        "stations",
        `"${code}" active flag disagrees`,
        `platform isActive=${plat.isActive}, playout is_active=${play.is_active}`
      );
    }
  }

  return { platformByCode, playoutByCode };
}

async function reconcileSongs(
  platformByCode: Map<string, { id: string }>,
  playoutByCode: Map<string, PlayoutStation>
) {
  for (const [code, plat] of platformByCode) {
    const play = playoutByCode.get(code);
    if (!play) continue;

    const platformCount = await prisma.song.count({ where: { stationId: plat.id } });
    const playoutCount = play.total_songs;

    if (platformCount === 0 && playoutCount > 0) {
      add(
        "warning",
        "songs",
        `"${code}": playout has ${playoutCount} songs, the platform has none`,
        "The platform cannot report on, clear rights for, or bill against music it does not know about."
      );
    } else if (playoutCount === 0 && platformCount > 0) {
      add(
        "warning",
        "songs",
        `"${code}": the platform has ${platformCount} songs, playout has none`,
        "Nothing can actually be broadcast."
      );
    } else if (platformCount !== playoutCount) {
      const diff = Math.abs(platformCount - playoutCount);
      const pct = playoutCount ? Math.round((diff / playoutCount) * 100) : 100;
      add(
        pct > 10 ? "warning" : "info",
        "songs",
        `"${code}": song counts differ by ${diff} (${pct}%)`,
        `platform ${platformCount}, playout ${playoutCount}`
      );
    }
  }
}

async function checkPlayRecording() {
  // The exact failure that went unnoticed: audio streaming while nothing is
  // recorded. Catching a stalled play feed is the point of this check.
  try {
    const res = await fetch(`${PLAYOUT_API}/api/now_playing`);
    if (!res.ok) {
      add("warning", "plays", `now_playing returned HTTP ${res.status}`);
      return;
    }
    const np = (await res.json()) as {
      on_air?: boolean;
      stale_seconds?: number;
      title?: string;
    };

    if (np.on_air === false) {
      add(
        "info",
        "plays",
        "Playout reports OFF AIR",
        `last play ${np.stale_seconds ?? "?"}s ago`
      );
    } else if (typeof np.stale_seconds === "number" && np.stale_seconds > 900) {
      add(
        "error",
        "plays",
        `No play recorded for ${np.stale_seconds}s while the station claims to be on air`,
        "This is the signature of a broken play-reporting path, not a quiet station."
      );
    }
  } catch (error) {
    add(
      "warning",
      "plays",
      "Could not check play recording",
      error instanceof Error ? error.message : String(error)
    );
  }

  // Platform-side playback recording
  const latest = await prisma.trackPlayback.findFirst({
    orderBy: { playedAt: "desc" },
    select: { playedAt: true },
  });
  if (!latest) {
    add("warning", "plays", "The platform has never recorded a track playback");
  } else {
    const ageHours = Math.round((Date.now() - latest.playedAt.getTime()) / 3_600_000);
    if (ageHours > 24) {
      add(
        "warning",
        "plays",
        `The platform's most recent playback is ${ageHours}h old`,
        "Analytics, royalty reporting and the fairness protocol are all stale."
      );
    }
  }
}

async function main() {
  const json = process.argv.includes("--json");
  const strict = process.argv.includes("--strict");

  const playout = await fetchPlayoutStations();

  if (playout) {
    const { platformByCode, playoutByCode } = await reconcileStations(playout);
    await reconcileSongs(platformByCode, playoutByCode);
  }
  await checkPlayRecording();

  await prisma.$disconnect();

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");

  if (json) {
    console.log(
      JSON.stringify(
        { ok: errors.length === 0, errors: errors.length, warnings: warnings.length, findings },
        null,
        2
      )
    );
  } else {
    console.log("\n  DATABASE RECONCILIATION");
    console.log("  " + "=".repeat(74));
    console.log("  platform (Prisma, cuid ids)  <->  playout (FastAPI, uuid ids)");
    console.log("  Joined on station_code, because the two id spaces never match.\n");

    for (const area of ["stations", "songs", "plays", "playout"]) {
      const inArea = findings.filter((f) => f.area === area);
      if (!inArea.length) continue;
      console.log(`  ${area.toUpperCase()}`);
      for (const f of inArea) {
        const mark = f.severity === "error" ? "FAIL" : f.severity === "warning" ? "WARN" : "    ";
        console.log(`    ${mark}  ${f.message}`);
        if (f.detail) console.log(`          ${f.detail}`);
      }
      console.log();
    }

    console.log("  " + "-".repeat(74));
    console.log(`  ${errors.length} error(s), ${warnings.length} warning(s)`);
    if (!errors.length && !warnings.length) {
      console.log("  The two databases agree.");
    }
    console.log();
  }

  if (strict && errors.length) process.exit(1);
}

main().catch(async (error) => {
  console.error("Reconciliation failed:", error);
  await prisma.$disconnect();
  process.exit(2);
});
