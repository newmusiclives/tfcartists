import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes max lock

/**
 * Acquire a lock for a cron job. Returns true if lock acquired, false if already running.
 */
export async function acquireCronLock(jobName: string): Promise<boolean> {
  const lockKey = `cron_lock:${jobName}`;

  try {
    const existing = await prisma.config.findUnique({ where: { key: lockKey } });

    if (existing) {
      const lockTime = parseInt(existing.value, 10);
      if (Date.now() - lockTime < LOCK_TIMEOUT_MS) {
        logger.warn(`Cron job ${jobName} is already running (locked ${Math.round((Date.now() - lockTime) / 1000)}s ago)`);
        return false;
      }
      // Lock expired — previous run may have crashed
      logger.warn(`Cron lock for ${jobName} expired — previous run may have crashed`);
    }

    await prisma.config.upsert({
      where: { key: lockKey },
      update: { value: String(Date.now()) },
      create: { key: lockKey, value: String(Date.now()) },
    });

    return true;
  } catch {
    return true; // Don't prevent execution on lock errors
  }
}

/**
 * Release a cron job lock.
 */
export async function releaseCronLock(jobName: string): Promise<void> {
  try {
    await prisma.config.deleteMany({ where: { key: `cron_lock:${jobName}` } });
  } catch {
    // Non-critical
  }
}

/**
 * Wrapper that acquires lock, runs handler, releases lock.
 */
export async function withCronLock(
  jobName: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const acquired = await acquireCronLock(jobName);
  if (!acquired) {
    return Response.json({
      success: false,
      message: `${jobName} is already running — skipped to prevent overlap`,
    });
  }

  try {
    return await handler();
  } finally {
    await releaseCronLock(jobName);
  }
}
