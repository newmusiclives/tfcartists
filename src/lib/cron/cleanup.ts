import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Clean up old data to prevent database bloat.
 * Called by a daily maintenance cron.
 */
export async function runDataCleanup(): Promise<{
  cronLogs: number;
  voiceTracks: number;
  sessions: number;
  aiSpend: number;
}> {
  const results = { cronLogs: 0, voiceTracks: 0, sessions: 0, aiSpend: 0 };

  // Delete cron logs older than 30 days
  const cronCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { count: cronLogs } = await prisma.cronLog.deleteMany({
    where: { createdAt: { lt: cronCutoff } },
  });
  results.cronLogs = cronLogs;

  // Delete voice tracks older than 7 days that are used
  const vtCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { count: voiceTracks } = await prisma.voiceTrack.deleteMany({
    where: { createdAt: { lt: vtCutoff }, status: { in: ["audio_ready", "error"] } },
  });
  results.voiceTracks = voiceTracks;

  // Close abandoned listener sessions (open > 24 hours)
  const sessionCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { count: sessions } = await prisma.listeningSession.updateMany({
    where: { startTime: { lt: sessionCutoff }, endTime: null },
    data: { endTime: new Date(), duration: 0 },
  });
  results.sessions = sessions;

  // Delete AI spend tracking entries older than 90 days
  const spendCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const oldSpendKeys = await prisma.config.findMany({
    where: { key: { startsWith: "ai_spend:" } },
    select: { key: true },
  });
  const keysToDelete = oldSpendKeys
    .filter(k => k.key < `ai_spend:${spendCutoff.toISOString().slice(0, 10)}`)
    .map(k => k.key);
  if (keysToDelete.length > 0) {
    const { count } = await prisma.config.deleteMany({ where: { key: { in: keysToDelete } } });
    results.aiSpend = count;
  }

  logger.info("Data cleanup completed", results);
  return results;
}
