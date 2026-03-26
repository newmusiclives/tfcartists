import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getOrgScope } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks/deliveries
 * List webhook delivery history for the current organization.
 * Query params: endpointId?, event?, success?, limit?, offset?
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const orgScope = getOrgScope(session);

    const params = req.nextUrl.searchParams;
    const endpointId = params.get("endpointId");
    const event = params.get("event");
    const success = params.get("success");
    const limit = Math.min(parseInt(params.get("limit") || "50", 10), 200);
    const offset = parseInt(params.get("offset") || "0", 10);

    // Build where clause scoped to organization's endpoints
    const where: Record<string, unknown> = {
      endpoint: orgScope.organizationId
        ? { organizationId: orgScope.organizationId }
        : {},
    };

    if (endpointId) where.endpointId = endpointId;
    if (event) where.event = event;
    if (success === "true") where.success = true;
    if (success === "false") where.success = false;

    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        orderBy: { deliveredAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          endpoint: { select: { name: true, url: true } },
        },
      }),
      prisma.webhookDelivery.count({ where }),
    ]);

    const result = deliveries.map((d) => ({
      id: d.id,
      endpointId: d.endpointId,
      endpointName: d.endpoint.name,
      endpointUrl: d.endpoint.url,
      event: d.event,
      payload: d.payload,
      statusCode: d.statusCode,
      response: d.response,
      success: d.success,
      error: d.error,
      duration: d.duration,
      deliveredAt: d.deliveredAt.toISOString(),
    }));

    return NextResponse.json({
      deliveries: result,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    return handleApiError(error, "/api/webhooks/deliveries");
  }
}
