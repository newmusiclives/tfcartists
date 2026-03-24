import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const MONTHLY_BUDGET = parseFloat(process.env.AI_MONTHLY_BUDGET || "200"); // $200/month default
const ALERT_THRESHOLDS = [0.5, 0.75, 0.9, 1.0]; // Alert at 50%, 75%, 90%, 100%

/**
 * Get total AI spend for the current month.
 */
export async function getMonthlySpend(): Promise<number> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Sum all daily spend entries for this month
  const entries = await prisma.config.findMany({
    where: {
      key: { startsWith: `ai_spend:${yearMonth}` },
    },
  });

  return entries.reduce((sum, entry) => sum + parseFloat(entry.value || "0"), 0);
}

/**
 * Check monthly spend against budget and log alerts.
 * Returns the current spend percentage.
 */
export async function checkMonthlyCostAlerts(): Promise<{
  monthlySpend: number;
  budget: number;
  percentage: number;
  alertLevel: string | null;
}> {
  const monthlySpend = await getMonthlySpend();
  const percentage = monthlySpend / MONTHLY_BUDGET;

  // Find the highest threshold we've crossed
  let alertLevel: string | null = null;
  const alertKey = `ai_cost_alert:${new Date().toISOString().slice(0, 7)}`;

  for (const threshold of ALERT_THRESHOLDS.reverse()) {
    if (percentage >= threshold) {
      alertLevel = `${Math.round(threshold * 100)}%`;

      // Check if we've already alerted for this threshold this month
      const existingAlert = await prisma.config.findUnique({
        where: { key: `${alertKey}:${threshold}` },
      });

      if (!existingAlert) {
        // Log the alert
        if (threshold >= 1.0) {
          logger.error("AI MONTHLY BUDGET EXCEEDED", { monthlySpend, budget: MONTHLY_BUDGET, percentage: `${Math.round(percentage * 100)}%` });
        } else if (threshold >= 0.9) {
          logger.error("AI monthly spend at 90% of budget", { monthlySpend, budget: MONTHLY_BUDGET });
        } else {
          logger.warn(`AI monthly spend at ${Math.round(threshold * 100)}% of budget`, { monthlySpend, budget: MONTHLY_BUDGET });
        }

        // Record that we've alerted for this threshold
        await prisma.config.upsert({
          where: { key: `${alertKey}:${threshold}` },
          update: { value: new Date().toISOString() },
          create: { key: `${alertKey}:${threshold}`, value: new Date().toISOString() },
        }).catch(() => {}); // Non-blocking
      }

      break;
    }
  }

  return { monthlySpend, budget: MONTHLY_BUDGET, percentage, alertLevel };
}

/**
 * Check if monthly budget is exceeded (hard stop).
 */
export async function isMonthlyBudgetExceeded(): Promise<boolean> {
  const monthlySpend = await getMonthlySpend();
  return monthlySpend >= MONTHLY_BUDGET;
}
