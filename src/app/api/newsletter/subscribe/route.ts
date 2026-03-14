import { NextRequest, NextResponse } from "next/server";
import { subscribe } from "@/lib/newsletter/newsletter-service";
import { handleApiError } from "@/lib/api/errors";
import { withRateLimit } from "@/lib/rate-limit/limiter";
import { optionalAuth, getOrgScope } from "@/lib/api/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, "api");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const session = await optionalAuth();
    const orgScope = session ? getOrgScope(session) : {};

    const result = await subscribe({
      email: parsed.data.email,
      name: parsed.data.name,
      organizationId: orgScope.organizationId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "/api/newsletter/subscribe");
  }
}
