/**
 * API Route Authentication Helpers
 *
 * Provides reusable auth checks for API routes.
 * Uses NextAuth session to verify identity and role.
 */

import { auth } from "@/lib/auth/config";

export type UserRole = "admin" | "riley" | "harper" | "elliot" | "cassidy";

/**
 * Get the current session, or null if not authenticated.
 */
export async function getSession() {
  return auth();
}

/**
 * Require any authenticated user. Returns session or null.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

/**
 * Require a specific role (or admin). Returns session or null.
 */
export async function requireRole(...roles: UserRole[]) {
  const session = await auth();
  if (!session?.user?.role) return null;
  // Admin always has access
  if (session.user.role === "admin") return session;
  if (roles.includes(session.user.role as UserRole)) return session;
  return null;
}

/**
 * Require admin role. Returns session or null.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "admin") return null;
  return session;
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
