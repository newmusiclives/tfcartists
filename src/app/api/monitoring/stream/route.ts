import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const ICECAST_STREAM_URL = process.env.ICECAST_URL || "/stream/americana-hq.mp3";
const ICECAST_STATUS_URL = process.env.ICECAST_STATUS_URL || "/stream/status-json.xsl";
const HISTORY_KEY = "stream_health_history";
const MAX_HISTORY = 288; // 24 hours at 5-minute intervals

export interface StreamHealthPoint {
  timestamp: string;
  online: boolean;
  responseTimeMs: number;
  bitrate?: number;
  listeners?: number;
  serverName?: string;
  mountPoint?: string;
}

/**
 * Check stream health by hitting Icecast HEAD + status endpoint.
 */
async function checkStreamHealth(): Promise<StreamHealthPoint> {
  const timestamp = new Date().toISOString();
  const start = Date.now();

  // 1. Check stream reachability via HEAD request
  let online = false;
  let responseTimeMs = 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(ICECAST_STREAM_URL, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    responseTimeMs = Date.now() - start;
    online = res.ok || res.status === 200;
  } catch {
    responseTimeMs = Date.now() - start;
    online = false;
  }

  // 2. Try to get detailed status from Icecast status-json.xsl
  let bitrate: number | undefined;
  let listeners: number | undefined;
  let serverName: string | undefined;
  let mountPoint: string | undefined;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const statusRes = await fetch(ICECAST_STATUS_URL, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (statusRes.ok) {
      const data = await statusRes.json();
      const icestats = data?.icestats;

      if (icestats) {
        serverName = icestats.server_id;

        // Source can be an object or array of objects
        const sources = Array.isArray(icestats.source)
          ? icestats.source
          : icestats.source
            ? [icestats.source]
            : [];

        // Find our mount point
        const mount = sources.find(
          (s: any) =>
            s.listenurl?.includes("americana-hq") ||
            s.server_name?.includes("americana")
        ) || sources[0];

        if (mount) {
          bitrate = mount.bitrate ? Number(mount.bitrate) : undefined;
          listeners = mount.listeners != null ? Number(mount.listeners) : undefined;
          mountPoint = mount.listenurl || mount.server_name || "/americana-hq.mp3";
          if (!online && mount.listenurl) {
            // Status reports a source — stream is online
            online = true;
          }
        }
      }
    }
  } catch {
    // Status endpoint not available — not critical
  }

  return { timestamp, online, responseTimeMs, bitrate, listeners, serverName, mountPoint };
}

/**
 * Get stored health history from SystemConfig.
 */
async function getHealthHistory(): Promise<StreamHealthPoint[]> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: HISTORY_KEY },
    });
    if (config?.value) {
      return JSON.parse(config.value);
    }
  } catch {
    // First run or parse error
  }
  return [];
}

/**
 * Store a new health data point, keeping last MAX_HISTORY entries.
 */
async function storeHealthPoint(point: StreamHealthPoint): Promise<void> {
  const history = await getHealthHistory();
  history.push(point);

  // Trim to max size
  const trimmed = history.slice(-MAX_HISTORY);

  await prisma.systemConfig.upsert({
    where: { key: HISTORY_KEY },
    create: {
      key: HISTORY_KEY,
      value: JSON.stringify(trimmed),
      category: "monitoring",
      label: "Stream Health History",
      encrypted: false,
    },
    update: {
      value: JSON.stringify(trimmed),
    },
  });
}

/**
 * GET /api/monitoring/stream
 *
 * Returns current stream health plus historical data for dashboard.
 */
export async function GET() {
  try {
    const current = await checkStreamHealth();

    // Store the data point
    await storeHealthPoint(current);

    // Get full history for response
    const history = await getHealthHistory();

    // Calculate uptime percentages
    const now = Date.now();
    const h24 = history.filter(
      (p) => now - new Date(p.timestamp).getTime() < 24 * 60 * 60 * 1000
    );
    const h7d = history; // We only store 24h, so 7d/30d come from incidents
    const uptime24h =
      h24.length > 0
        ? (h24.filter((p) => p.online).length / h24.length) * 100
        : 100;

    // Detect incidents (consecutive offline periods)
    const incidents = detectIncidents(history);

    return NextResponse.json({
      current,
      history: h24,
      uptime: {
        last24h: Math.round(uptime24h * 100) / 100,
      },
      incidents,
    });
  } catch (error) {
    logger.error("Stream health check failed", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to check stream health" },
      { status: 500 }
    );
  }
}

interface Incident {
  start: string;
  end: string | null;
  durationMs: number;
}

function detectIncidents(history: StreamHealthPoint[]): Incident[] {
  const incidents: Incident[] = [];
  let incidentStart: string | null = null;

  for (const point of history) {
    if (!point.online && !incidentStart) {
      incidentStart = point.timestamp;
    } else if (point.online && incidentStart) {
      incidents.push({
        start: incidentStart,
        end: point.timestamp,
        durationMs:
          new Date(point.timestamp).getTime() -
          new Date(incidentStart).getTime(),
      });
      incidentStart = null;
    }
  }

  // Ongoing incident
  if (incidentStart) {
    incidents.push({
      start: incidentStart,
      end: null,
      durationMs: Date.now() - new Date(incidentStart).getTime(),
    });
  }

  return incidents.reverse(); // Most recent first
}
