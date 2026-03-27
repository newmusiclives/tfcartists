import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const DAILY_SPEND_LIMIT = parseFloat(process.env.AI_DAILY_SPEND_LIMIT || "12"); // $12/day default (ElevenLabs Creator + AI)

interface SpendEntry {
  provider: string; // "openai" | "anthropic" | "google"
  operation: string; // "tts" | "chat" | "image"
  cost: number; // dollars
  tokens?: number;
  characters?: number;
}

/**
 * Log an AI API call and its cost to the database.
 */
export async function trackAiSpend(entry: SpendEntry): Promise<void> {
  try {
    await prisma.config.upsert({
      where: { key: `ai_spend:${todayKey()}` },
      update: {
        value: String(parseFloat((await getSpendValue()) || "0") + entry.cost),
      },
      create: {
        key: `ai_spend:${todayKey()}`,
        value: String(entry.cost),
      },
    });
  } catch {
    // Don't let tracking failures block AI calls
  }
}

/**
 * Check if the daily AI spend limit has been reached.
 * Returns true if spending should be blocked.
 */
export async function isAiSpendLimitReached(): Promise<boolean> {
  try {
    const spent = parseFloat((await getSpendValue()) || "0");
    if (spent >= DAILY_SPEND_LIMIT) {
      logger.warn("AI daily spend limit reached", { spent, limit: DAILY_SPEND_LIMIT });
      return true;
    }
    return false;
  } catch {
    return false; // Don't block on tracking errors
  }
}

/**
 * Get today's total spend.
 */
export async function getTodaySpend(): Promise<number> {
  const val = await getSpendValue();
  return parseFloat(val || "0");
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "2026-03-23"
}

async function getSpendValue(): Promise<string | null> {
  const config = await prisma.config.findUnique({
    where: { key: `ai_spend:${todayKey()}` },
  });
  return config?.value || null;
}
