import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTodaySpend } from "@/lib/ai/spend-tracker";
import { getCircuitState } from "@/lib/ai/circuit-breaker";

// Known circuit breaker services
const CIRCUIT_SERVICES = ["openai", "anthropic", "google-tts", "railway", "icecast"];

// Known cron jobs
const CRON_JOBS = [
  "features-daily",
  "parker-daily",
  "cassidy-daily",
  "riley-daily",
  "harper-daily",
  "elliot-daily",
  "voice-tracks-daily",
  "voice-tracks-hour",
];

interface HealthComponent {
  status: "healthy" | "degraded" | "down";
  message?: string;
  lastCheck?: string;
}

/**
 * GET /api/monitoring/health
 * Returns system health status with checks for DB, crons, AI spend, and circuit breakers.
 */
export async function GET() {
  const components: Record<string, HealthComponent> = {};
  let overallStatus: "healthy" | "degraded" | "down" = "healthy";

  // 1. Database connection check
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    components.database = {
      status: latency > 2000 ? "degraded" : "healthy",
      message: `Connected (${latency}ms)`,
      lastCheck: new Date().toISOString(),
    };
    if (latency > 2000) overallStatus = "degraded";
  } catch (err) {
    components.database = {
      status: "down",
      message: `Connection failed: ${String(err).slice(0, 200)}`,
      lastCheck: new Date().toISOString(),
    };
    overallStatus = "down";
  }

  // 2. Cron job status — check last run times from CronLog
  try {
    const cronStatuses: Record<string, { status: string; lastRun: string | null; lastStatus: string | null }> = {};

    for (const jobName of CRON_JOBS) {
      const lastLog = await prisma.cronLog.findFirst({
        where: { jobName },
        orderBy: { startedAt: "desc" },
        select: { status: true, startedAt: true },
      });

      if (!lastLog) {
        cronStatuses[jobName] = { status: "unknown", lastRun: null, lastStatus: null };
      } else {
        const hoursSinceRun = (Date.now() - new Date(lastLog.startedAt).getTime()) / (1000 * 60 * 60);
        const isStale = hoursSinceRun > 36; // Daily jobs should run within 36h
        const isHourlyStale = jobName.includes("hour") && hoursSinceRun > 3;

        cronStatuses[jobName] = {
          status: lastLog.status === "error" ? "error" : (isStale || isHourlyStale) ? "stale" : "ok",
          lastRun: lastLog.startedAt.toISOString(),
          lastStatus: lastLog.status,
        };

        if (lastLog.status === "error") overallStatus = overallStatus === "down" ? "down" : "degraded";
      }
    }

    const failedCrons = Object.values(cronStatuses).filter((c) => c.status === "error").length;
    const staleCrons = Object.values(cronStatuses).filter((c) => c.status === "stale").length;

    components.cronJobs = {
      status: failedCrons > 0 ? "degraded" : staleCrons > 2 ? "degraded" : "healthy",
      message: `${failedCrons} failed, ${staleCrons} stale out of ${CRON_JOBS.length} jobs`,
      lastCheck: new Date().toISOString(),
    };

    // Include detailed cron data
    (components.cronJobs as any).details = cronStatuses;
  } catch {
    components.cronJobs = {
      status: "down",
      message: "Failed to query cron logs",
      lastCheck: new Date().toISOString(),
    };
  }

  // 3. AI spend status
  try {
    const todaySpend = await getTodaySpend();
    const dailyLimit = parseFloat(process.env.AI_DAILY_SPEND_LIMIT || "10");
    const pctUsed = dailyLimit > 0 ? (todaySpend / dailyLimit) * 100 : 0;

    components.aiSpend = {
      status: pctUsed >= 100 ? "down" : pctUsed >= 80 ? "degraded" : "healthy",
      message: `$${todaySpend.toFixed(2)} / $${dailyLimit.toFixed(2)} today (${pctUsed.toFixed(0)}%)`,
      lastCheck: new Date().toISOString(),
    };

    (components.aiSpend as any).details = {
      todaySpend,
      dailyLimit,
      percentUsed: pctUsed,
    };

    if (pctUsed >= 100) overallStatus = overallStatus === "down" ? "down" : "degraded";
  } catch {
    components.aiSpend = {
      status: "degraded",
      message: "Could not read AI spend data",
      lastCheck: new Date().toISOString(),
    };
  }

  // 4. Circuit breaker states
  const circuitDetails: Record<string, { isOpen: boolean; failures: number; lastFailure: number }> = {};
  let openCircuits = 0;

  for (const service of CIRCUIT_SERVICES) {
    const state = getCircuitState(service);
    circuitDetails[service] = {
      isOpen: state.isOpen,
      failures: state.failures,
      lastFailure: state.lastFailure,
    };
    if (state.isOpen) openCircuits++;
  }

  components.circuitBreakers = {
    status: openCircuits > 2 ? "down" : openCircuits > 0 ? "degraded" : "healthy",
    message: `${openCircuits} open out of ${CIRCUIT_SERVICES.length} circuits`,
    lastCheck: new Date().toISOString(),
  };
  (components.circuitBreakers as any).details = circuitDetails;

  if (openCircuits > 0) overallStatus = overallStatus === "down" ? "down" : "degraded";

  // 5. Recent errors count (last 24h)
  try {
    const errorConfigs = await prisma.config.findMany({
      where: { key: { startsWith: "error:" } },
      select: { key: true, value: true },
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentErrors = errorConfigs.filter((e) => {
      try {
        const data = JSON.parse(e.value);
        return data.timestamp > oneDayAgo;
      } catch {
        return false;
      }
    });

    components.recentErrors = {
      status: recentErrors.length > 50 ? "degraded" : recentErrors.length > 0 ? "degraded" : "healthy",
      message: `${recentErrors.length} errors in last 24h`,
      lastCheck: new Date().toISOString(),
    };

    if (recentErrors.length > 50) overallStatus = overallStatus === "down" ? "down" : "degraded";
  } catch {
    components.recentErrors = {
      status: "degraded",
      message: "Could not read error data",
      lastCheck: new Date().toISOString(),
    };
  }

  // 6. API response time stats
  try {
    const timerConfigs = await prisma.config.findMany({
      where: { key: { startsWith: "api_timer:" } },
      select: { key: true, value: true },
    });

    let slowEndpoints = 0;
    const timerDetails: Record<string, any> = {};

    for (const tc of timerConfigs) {
      try {
        const data = JSON.parse(tc.value);
        const endpoint = tc.key.replace("api_timer:", "");
        timerDetails[endpoint] = data;
        if (data.avgMs > 5000) slowEndpoints++;
      } catch {
        // skip malformed
      }
    }

    components.apiResponseTimes = {
      status: slowEndpoints > 3 ? "degraded" : "healthy",
      message: `${slowEndpoints} slow endpoints, ${timerConfigs.length} tracked`,
      lastCheck: new Date().toISOString(),
    };
    (components.apiResponseTimes as any).details = timerDetails;
  } catch {
    components.apiResponseTimes = {
      status: "healthy",
      message: "No response time data yet",
      lastCheck: new Date().toISOString(),
    };
  }

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    components,
  });
}
