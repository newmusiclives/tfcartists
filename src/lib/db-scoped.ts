/**
 * Organization-Scoped Database Queries
 *
 * Provides helper functions that automatically apply organizationId filtering
 * to queries when the user belongs to an organization.
 *
 * Usage in API routes:
 *   const session = await requireAuth();
 *   const scope = orgWhere(session);
 *   const artists = await prisma.artist.findMany({ where: { ...scope, deletedAt: null } });
 *
 * For super-admins (no organizationId), returns empty object (no filtering).
 * For org users, returns { organizationId: "..." }.
 */

/**
 * Returns a Prisma where clause fragment for organization scoping.
 * Works with any model that has an optional organizationId field.
 */
export function orgWhere(session: any): { organizationId?: string } {
  // No session = no filtering (public routes)
  if (!session?.user) return {};

  // Super-admin with no org = see everything
  if (session.user.role === "admin" && !session.user.organizationId) return {};

  // Org user = filter to their org
  if (session.user.organizationId) {
    return { organizationId: session.user.organizationId };
  }

  // Fallback: no filtering (backward compat — no orgs assigned yet)
  return {};
}

/**
 * Returns the organizationId to set on newly created records.
 * Returns null if no org context (super-admin or no org assigned).
 */
export function orgIdForCreate(session: any): string | null {
  return session?.user?.organizationId || null;
}

/**
 * Returns a station-scoped where clause.
 * Combines organizationId + stationId filtering.
 */
export function stationWhere(
  session: any,
  stationId?: string | null
): { organizationId?: string; stationId?: string } {
  const scope: Record<string, string | undefined> = {};

  const orgScope = orgWhere(session);
  if (orgScope.organizationId) {
    scope.organizationId = orgScope.organizationId;
  }

  if (stationId) {
    scope.stationId = stationId;
  }

  return scope;
}

/**
 * Verify that a station belongs to the user's organization.
 * Returns the station if access is allowed, null if denied.
 *
 * Usage in API routes:
 *   const station = await verifyStationAccess(session, stationId);
 *   if (!station) return NextResponse.json({ error: "Station not found" }, { status: 404 });
 */
export async function verifyStationAccess(
  session: any,
  stationId: string
): Promise<any | null> {
  // Lazy import to avoid circular dependency
  const { prisma } = await import("@/lib/db");

  // Super-admin can access any station
  if (session?.user?.role === "admin" && !session?.user?.organizationId) {
    return prisma.station.findFirst({
      where: { id: stationId, deletedAt: null },
    });
  }

  // Org user: verify station belongs to their org
  if (session?.user?.organizationId) {
    return prisma.station.findFirst({
      where: {
        id: stationId,
        deletedAt: null,
        organizationId: session.user.organizationId,
      },
    });
  }

  // No org context (backward compat): allow access
  return prisma.station.findFirst({
    where: { id: stationId, deletedAt: null },
  });
}
