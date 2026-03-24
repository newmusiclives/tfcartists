/**
 * Audit Logging System
 *
 * Tracks important actions across the platform for security and compliance.
 * Stores audit entries in the RileyActivity/HarperActivity/ElliotActivity/CassidyActivity tables
 * and provides a unified interface via a dedicated AuditLog approach using metadata.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export type AuditAction =
  | "artist.created"
  | "artist.updated"
  | "artist.deleted"
  | "artist.tier_changed"
  | "sponsor.created"
  | "sponsor.updated"
  | "sponsor.deleted"
  | "sponsor.deal_closed"
  | "listener.created"
  | "listener.status_changed"
  | "scout.activated"
  | "scout.commission_paid"
  | "dj.created"
  | "dj.updated"
  | "dj.deleted"
  | "station.updated"
  | "submission.reviewed"
  | "submission.tier_assigned"
  | "revenue.pool_created"
  | "revenue.payout_processed"
  | "auth.login"
  | "auth.logout"
  | "admin.settings_changed"
  | "webhook.received"
  | "webhook.failed";

interface AuditEntry {
  action: AuditAction;
  userId?: string;
  userRole?: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    // Determine which team activity table to use based on the action prefix
    const prefix = entry.action.split(".")[0];

    switch (prefix) {
      case "artist":
        await prisma.rileyActivity.create({
          data: {
            action: entry.action,
            artistId: entry.resourceId,
            details: {
              ...entry.details,
              userId: entry.userId,
              userRole: entry.userRole,
              ipAddress: entry.ipAddress,
            },
            successful: true,
          },
        });
        break;

      case "sponsor":
        await prisma.harperActivity.create({
          data: {
            action: entry.action,
            sponsorId: entry.resourceId,
            details: {
              ...entry.details,
              userId: entry.userId,
              userRole: entry.userRole,
              ipAddress: entry.ipAddress,
            },
            successful: true,
          },
        });
        break;

      case "listener":
      case "scout":
        await prisma.elliotActivity.create({
          data: {
            action: entry.action,
            teamMember: entry.userRole || "system",
            listenerId: entry.resourceId,
            details: {
              ...entry.details,
              userId: entry.userId,
              ipAddress: entry.ipAddress,
            },
            successful: true,
          },
        });
        break;

      case "submission":
        await prisma.cassidyActivity.create({
          data: {
            action: entry.action,
            submissionId: entry.resourceId,
            details: {
              ...entry.details,
              userId: entry.userId,
              userRole: entry.userRole,
              ipAddress: entry.ipAddress,
            },
            successful: true,
          },
        });
        break;

      default:
        // For auth, admin, webhook, revenue, station, dj events — use RileyActivity as general log
        await prisma.rileyActivity.create({
          data: {
            action: entry.action,
            artistId: entry.resourceId,
            details: {
              ...entry.details,
              resourceType: entry.resourceType,
              userId: entry.userId,
              userRole: entry.userRole,
              ipAddress: entry.ipAddress,
            },
            successful: true,
          },
        });
    }

    logger.debug("Audit log created", { action: entry.action, resourceId: entry.resourceId });
  } catch (error) {
    // Audit logging should never break the main flow
    logger.error("Failed to create audit log", {
      action: entry.action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Helper to extract IP from NextRequest
export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Log an admin action for audit trail.
 * Stored in the Config table with a prefix for lightweight tracking.
 */
export async function logAdminAction(opts: {
  userId: string;
  action: string;
  target: string;
  details?: string;
}): Promise<void> {
  try {
    const key = `audit:${Date.now()}:${opts.userId}`;
    await prisma.config.create({
      data: {
        key,
        value: JSON.stringify({
          action: opts.action,
          target: opts.target,
          details: opts.details,
          userId: opts.userId,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch {
    logger.warn("Failed to log audit action", opts);
  }
}

/**
 * Get recent admin actions.
 */
export async function getRecentAuditLog(limit = 50): Promise<Array<{
  action: string;
  target: string;
  details?: string;
  userId: string;
  timestamp: string;
}>> {
  const entries = await prisma.config.findMany({
    where: { key: { startsWith: "audit:" } },
    orderBy: { key: "desc" },
    take: limit,
  });

  return entries.map(e => {
    try { return JSON.parse(e.value); } catch { return { action: "unknown", target: e.key, userId: "unknown", timestamp: "" }; }
  });
}
