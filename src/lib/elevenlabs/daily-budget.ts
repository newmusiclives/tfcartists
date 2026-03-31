/**
 * ElevenLabs Daily Character Budget
 *
 * Spreads the monthly character quota evenly across the billing period
 * so the station never runs out mid-month. When the daily budget is
 * exhausted, callers should fall back to Gemini/OpenAI TTS instead
 * of attempting ElevenLabs (which would fail or waste credits).
 *
 * Usage:
 *   const budget = await getElevenLabsDailyBudget();
 *   if (!budget.canUseElevenLabs) {
 *     // Skip ElevenLabs, use Gemini/OpenAI instead
 *   }
 *   // After generating:
 *   await trackElevenLabsChars(text.length);
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getElevenLabsQuota } from "./quota-guard";

// Config key for daily character tracking
const CONFIG_KEY_DAILY_CHARS = "elevenlabs:daily_chars"; // value: "YYYY-MM-DD:count"

// Reserve 10% of monthly quota as safety buffer (never allocate it to daily budgets)
const SAFETY_RESERVE_PERCENT = 0.10;

// Override: env var to set a hard daily cap (characters) regardless of plan
const HARD_DAILY_CAP = process.env.ELEVENLABS_DAILY_CHAR_CAP
  ? parseInt(process.env.ELEVENLABS_DAILY_CHAR_CAP, 10)
  : null;

export interface DailyBudgetInfo {
  canUseElevenLabs: boolean;
  dailyBudget: number;       // chars allocated for today
  usedToday: number;         // chars used so far today
  remainingToday: number;    // chars still available today
  monthlyRemaining: number;  // chars remaining in billing period
  reason?: string;           // why ElevenLabs was blocked (if blocked)
}

/**
 * Get today's ElevenLabs character budget and whether there's room to use it.
 *
 * Calculates daily budget as: (remaining monthly chars - safety buffer) / days left in period.
 * If today's usage exceeds the daily budget, returns canUseElevenLabs=false.
 */
export async function getElevenLabsDailyBudget(): Promise<DailyBudgetInfo> {
  const usedToday = await getTodayChars();

  // Fetch monthly quota from ElevenLabs API (cached snapshot if API fails)
  const quota = await getElevenLabsQuota();
  if (!quota) {
    // Can't determine quota — allow ElevenLabs but with a conservative fallback cap
    const fallbackCap = HARD_DAILY_CAP || 5000;
    const remaining = Math.max(0, fallbackCap - usedToday);
    return {
      canUseElevenLabs: remaining > 0,
      dailyBudget: fallbackCap,
      usedToday,
      remainingToday: remaining,
      monthlyRemaining: -1, // unknown
      reason: remaining <= 0 ? `Daily fallback cap of ${fallbackCap} chars reached` : undefined,
    };
  }

  // Calculate days remaining in billing period
  const daysLeft = daysUntilReset(quota.nextResetDate);

  // Safety buffer: reserve 10% of monthly limit
  const safetyBuffer = Math.round(quota.characterLimit * SAFETY_RESERVE_PERCENT);
  const usableRemaining = Math.max(0, quota.charactersRemaining - safetyBuffer);

  // Daily budget: spread remaining usable characters over remaining days
  // Minimum 1 day to avoid division by zero
  let dailyBudget = Math.round(usableRemaining / Math.max(1, daysLeft));

  // Apply hard cap if set
  if (HARD_DAILY_CAP !== null) {
    dailyBudget = Math.min(dailyBudget, HARD_DAILY_CAP);
  }

  // Minimum daily budget of 1000 chars (a few essential voice tracks)
  dailyBudget = Math.max(1000, dailyBudget);

  const remainingToday = Math.max(0, dailyBudget - usedToday);

  if (remainingToday <= 0) {
    logger.info("ElevenLabs daily budget exhausted — falling back to Gemini/OpenAI", {
      dailyBudget,
      usedToday,
      monthlyRemaining: quota.charactersRemaining,
      daysLeft,
    });
  }

  return {
    canUseElevenLabs: remainingToday > 0,
    dailyBudget,
    usedToday,
    remainingToday,
    monthlyRemaining: quota.charactersRemaining,
    reason: remainingToday <= 0
      ? `Daily ElevenLabs budget of ${dailyBudget.toLocaleString()} chars exhausted (${usedToday.toLocaleString()} used)`
      : undefined,
  };
}

/**
 * Track characters consumed by an ElevenLabs TTS call.
 * Call this AFTER a successful ElevenLabs generation.
 */
export async function trackElevenLabsChars(charCount: number): Promise<void> {
  const today = todayKey();
  const key = CONFIG_KEY_DAILY_CHARS;

  try {
    const existing = await prisma.config.findUnique({ where: { key } });
    const parsed = parseDaily(existing?.value);

    if (parsed.date === today) {
      // Same day — increment
      await prisma.config.update({
        where: { key },
        data: { value: `${today}:${parsed.count + charCount}` },
      });
    } else {
      // New day — reset counter
      await prisma.config.upsert({
        where: { key },
        update: { value: `${today}:${charCount}` },
        create: { key, value: `${today}:${charCount}` },
      });
    }
  } catch {
    // Don't let tracking failures block TTS calls
  }
}

/**
 * Get characters used today.
 */
async function getTodayChars(): Promise<number> {
  try {
    const config = await prisma.config.findUnique({
      where: { key: CONFIG_KEY_DAILY_CHARS },
    });
    const parsed = parseDaily(config?.value);
    return parsed.date === todayKey() ? parsed.count : 0;
  } catch {
    return 0;
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDaily(value: string | null | undefined): { date: string; count: number } {
  if (!value) return { date: "", count: 0 };
  const [date, countStr] = value.split(":");
  return { date: date || "", count: parseInt(countStr || "0", 10) || 0 };
}

/**
 * Calculate days until the next ElevenLabs billing reset.
 * Defaults to days remaining in current calendar month if no reset date.
 */
function daysUntilReset(nextResetDate: string | null): number {
  const now = new Date();
  if (nextResetDate) {
    const reset = new Date(nextResetDate);
    const diffMs = reset.getTime() - now.getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }
  // Fallback: days remaining in calendar month
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.max(1, lastDay - now.getDate() + 1);
}
