import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { unauthorized, forbidden, handleApiError } from "@/lib/api/errors";

/**
 * Wrap an API handler with authentication and role checks.
 */
export async function withAuth(
  handler: (request: NextRequest, session: any) => Promise<NextResponse>,
  allowedRoles: string[]
): Promise<(request: NextRequest) => Promise<NextResponse>> {
  return async (request: NextRequest) => {
    try {
      const session = await auth();
      if (!session?.user) {
        return unauthorized();
      }
      const role = (session.user as any).role;
      if (!allowedRoles.includes(role) && !allowedRoles.includes("admin")) {
        if (role !== "admin") {
          return forbidden(`Role '${role}' does not have access`);
        }
      }
      return await handler(request, session);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Default allowed sort fields for pagination.
 * Prevents order-by injection by whitelisting valid column names.
 */
const DEFAULT_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "name",
  "email",
  "status",
  "pipelineStage",
  "airplayTier",
  "businessName",
  "contactName",
  "genre",
  "monthlyBudget",
  "tier",
  "xpLevel",
  "rotationCategory",
  "title",
  "artist",
]);

/**
 * Parse pagination parameters from request search params.
 * @param allowedSortFields - Optional custom whitelist of sortable fields
 */
export function withPagination(
  searchParams: URLSearchParams,
  allowedSortFields?: Set<string>
) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  const requestedSort = searchParams.get("sortBy") || "createdAt";
  const allowed = allowedSortFields || DEFAULT_SORT_FIELDS;
  const sortBy = allowed.has(requestedSort) ? requestedSort : "createdAt";

  const rawOrder = searchParams.get("sortOrder");
  const sortOrder = rawOrder === "asc" ? "asc" : "desc";
  const search = searchParams.get("search") || "";

  return { page, limit, skip, sortBy, sortOrder, search };
}

/**
 * Consistent success response envelope.
 */
export function successResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}
