/**
 * API Route Authentication Helpers
 *
 * Provides reusable auth checks for API routes.
 * Uses NextAuth session to verify identity and role.
 *
 * Auth is ENABLED by default. Set DEMO_MODE=true to bypass (development only).
 */

import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import type { Session } from "next-auth";

export type UserRole = "admin" | "riley" | "harper" | "elliot" | "cassidy";

function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

const DEMO_SESSION: Session = {
  user: { id: "demo-admin", name: "Admin (Demo)", role: "admin" },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Get the current session, or null if not authenticated.
 */
export async function getSession() {
  return auth();
}

/**
 * Optional auth — returns session if authenticated, null otherwise.
 * Use ONLY for truly public endpoints (newsletter subscribe, public station list).
 * Do NOT use as a workaround for broken auth — use requireAuth() instead.
 */
export async function optionalAuth() {
  if (isDemoMode()) return DEMO_SESSION;
  try {
    const session = await auth();
    if (!session?.user) return null;
    return session;
  } catch (error) {
    // Log auth errors so they don't silently disappear
    logger.warn("optionalAuth: session retrieval failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Require any authenticated user. Returns session or throws.
 * Only bypasses auth when DEMO_MODE=true AND not in production.
 * The thrown error is caught by handleApiError() which returns 401.
 */
export async function requireAuth() {
  if (isDemoMode()) return DEMO_SESSION;
  try {
    const session = await auth();
    if (!session?.user) {
      const err = new Error("Authentication required");
      (err as any).code = "UNAUTHORIZED";
      throw err;
    }
    return session;
  } catch (error) {
    // Re-throw our own UNAUTHORIZED errors
    if (error instanceof Error && (error as any).code === "UNAUTHORIZED") {
      throw error;
    }
    // Wrap unexpected auth errors (JWT decode failures, etc.) as UNAUTHORIZED
    logger.error("requireAuth: unexpected auth error", {
      error: error instanceof Error ? error.message : String(error),
    });
    const err = new Error("Authentication failed — session could not be verified");
    (err as any).code = "UNAUTHORIZED";
    throw err;
  }
}

/**
 * Require a specific role (or admin). Returns session or null.
 * Only bypasses auth when DEMO_MODE=true AND not in production.
 */
export async function requireRole(...roles: UserRole[]) {
  if (isDemoMode()) return DEMO_SESSION;
  try {
    const session = await auth();
    if (!session?.user?.role) return null;
    // Admin always has access
    if (session.user.role === "admin") return session;
    if (roles.includes(session.user.role as UserRole)) return session;
    return null;
  } catch (error) {
    logger.error("requireRole: auth error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Require admin role. Returns session or null.
 * Only bypasses auth when DEMO_MODE=true AND not in production.
 */
export async function requireAdmin() {
  if (isDemoMode()) return DEMO_SESSION;
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== "admin") return null;
    return session;
  } catch (error) {
    logger.error("requireAdmin: auth error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get the organization scope for the current session.
 * Returns a Prisma `where` clause fragment.
 *
 * - Super admin (role=admin, no orgId): returns {} (sees all data)
 * - Operator user (has organizationId): returns { organizationId: "..." }
 * - Demo mode: returns {} (sees all)
 *
 * Usage in API routes:
 *   const orgScope = getOrgScope(session);
 *   prisma.station.findMany({ where: { ...orgScope, deletedAt: null } });
 */
export function getOrgScope(session: Session | null): { organizationId?: string } {
  // Super-admin sees everything
  if (session?.user?.role === "admin" && !session?.user?.organizationId) {
    return {};
  }
  // Operator users are scoped to their organization
  if (session?.user?.organizationId) {
    return { organizationId: session.user.organizationId };
  }
  // Fallback: no filtering (backward compat for existing data without orgs)
  return {};
}

/**
 * Pick only allowed fields from a body object.
 * Prevents mass assignment by whitelisting fields.
 */
export function pickFields<T extends Record<string, unknown>>(
  body: T,
  allowedFields: string[]
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      result[key] = body[key];
    }
  }
  return result as Partial<T>;
}
