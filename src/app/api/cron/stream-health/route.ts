import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { logCronExecution, isCronSuspended } from "@/lib/cron/log";
import { withCronLock } from "@/lib/cron/lock";

export const dynamic = "force-dynamic";

const ICECAST_STREAM_URL = process.env.ICECAST_URL || "/stream/americana-hq.mp3";
const ICECAST_STATUS_URL = process.env.ICECAST_STATUS_URL || "/stream/status-json.xsl";
const HISTORY_KEY = "stream_health_history";
const UPTIME_KEY = "stream_uptime_stats";
const MAX_HISTORY = 288; // 24 hours at 5-minute intervals

interface StreamHealthPoint {
  timestamp: string;
  online: boolean;
  responseTimeMs: number;
  bitrate?: number;
  listeners?: number;
  serverName?: string;
  mountPoint?: string;
}

interface UptimeStats {
  totalChecks: number;
  onlineChecks: number;
  firstCheck: string;
  lastCheck: string;
  // Rolling window counts for 7d and 30d
  checks7d: { timestamp: string; online: boolean }[];
  checks30d: { timestamp: string; online: boolean }[];
}

async function checkStreamHealth(): Promise<StreamHealthPoint> {
  const timestamp = new Date().toISOString();
  const start = Date.now();

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
        const sources = Array.isArray(icestats.source)
          ? icestats.source
          : icestats.source
            ? [icestats.source]
            : [];
        const mount = sources.find(
          (s: any) =>
            s.listenurl?.includes("americana-hq") ||
            s.server_name?.includes("americana")
        ) || sources[0];
        if (mount) {
          bitrate = mount.bitrate ? Number(mount.bitrate) : undefined;
          listeners = mount.listeners != null ? Number(mount.listeners) : undefined;
          mountPoint = mount.listenurl || mount.server_name || "/americana-hq.mp3";
          if (!online && mount.listenurl) online = true;
        }
      }
    }
  } catch {
    // Status endpoint unavailable
  }

  return { timestamp, online, responseTimeMs, bitrate, listeners, serverName, mountPoint };
}

async function getHealthHistory(): Promise<StreamHealthPoint[]> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: HISTORY_KEY },
    });
    if (config?.value) return JSON.parse(config.value);
  } catch {}
  return [];
}

async function storeHealthPoint(point: StreamHealthPoint): Promise<void> {
  const history = await getHealthHistory();
  history.push(point);
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
    update: { value: JSON.stringify(trimmed) },
  });
}

async function getUptimeStats(): Promise<UptimeStats> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: UPTIME_KEY },
    });
    if (config?.value) return JSON.parse(config.value);
  } catch {}
  return {
    totalChecks: 0,
    onlineChecks: 0,
    firstCheck: new Date().toISOString(),
    lastCheck: new Date().toISOString(),
    checks7d: [],
    checks30d: [],
  };
}

async function updateUptimeStats(point: StreamHealthPoint): Promise<UptimeStats> {
  const stats = await getUptimeStats();
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  stats.totalChecks++;
  if (point.online) stats.onlineChecks++;
  stats.lastCheck = point.timestamp;

  // Add to rolling windows
  const entry = { timestamp: point.timestamp, online: point.online };
  stats.checks7d.push(entry);
  stats.checks30d.push(entry);

  // Trim rolling windows
  stats.checks7d = stats.checks7d.filter(
    (c) => new Date(c.timestamp).getTime() > sevenDaysAgo
  );
  stats.checks30d = stats.checks30d.filter(
    (c) => new Date(c.timestamp).getTime() > thirtyDaysAgo
  );

  await prisma.systemConfig.upsert({
    where: { key: UPTIME_KEY },
    create: {
      key: UPTIME_KEY,
      value: JSON.stringify(stats),
      category: "monitoring",
      label: "Stream Uptime Statistics",
      encrypted: false,
    },
    update: { value: JSON.stringify(stats) },
  });

  return stats;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suspended = await isCronSuspended("stream-health");
  if (suspended) return suspended;

  return withCronLock("stream-health", async () => {
    const start = Date.now();
    const startedAt = new Date();

    try {
      // Check stream health
      const healthPoint = await checkStreamHealth();

      // Store history point
      await storeHealthPoint(healthPoint);

      // Update rolling uptime stats
      const uptimeStats = await updateUptimeStats(healthPoint);

      // Calculate uptime percentages
      const uptime7d =
        uptimeStats.checks7d.length > 0
          ? (uptimeStats.checks7d.filter((c) => c.online).length /
              uptimeStats.checks7d.length) *
            100
          : 100;
      const uptime30d =
        uptimeStats.checks30d.length > 0
          ? (uptimeStats.checks30d.filter((c) => c.online).length /
              uptimeStats.checks30d.length) *
            100
          : 100;

      // Log alert if stream is down
      if (!healthPoint.online) {
        logger.error("Stream is DOWN", {
          type: "stream_down",
          responseTimeMs: healthPoint.responseTimeMs,
          timestamp: healthPoint.timestamp,
        });
      }

      const summary = {
        online: healthPoint.online,
        responseTimeMs: healthPoint.responseTimeMs,
        listeners: healthPoint.listeners,
        uptime7d: Math.round(uptime7d * 100) / 100,
        uptime30d: Math.round(uptime30d * 100) / 100,
      };

      await logCronExecution({
        jobName: "stream-health",
        status: "success",
        duration: Date.now() - start,
        summary,
        startedAt,
      });

      return NextResponse.json({ success: true, ...summary });
    } catch (error) {
      await logCronExecution({
        jobName: "stream-health",
        status: "error",
        duration: Date.now() - start,
        error: String(error),
        startedAt,
      });
      return NextResponse.json(
        { error: "Stream health check failed" },
        { status: 500 }
      );
    }
  });
}
