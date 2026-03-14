import { NextRequest, NextResponse } from "next/server";
import { getOrganizationBranding, getBrandingFromDomain } from "@/lib/branding";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/branding
 *
 * Returns white-label branding for the current operator.
 *
 * Resolution order:
 *   1. ?orgId=<id>  — explicit organization ID (admin / preview)
 *   2. ?domain=<d>  — explicit domain lookup
 *   3. Host header  — infer from the incoming request domain
 *
 * Response shape:
 * {
 *   orgId: string,
 *   name: string,
 *   primaryColor: string,    // hex
 *   secondaryColor: string,  // hex
 *   logoUrl: string | null,
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const domainParam = searchParams.get("domain");

    // 1. Explicit orgId
    if (orgId) {
      const branding = await getOrganizationBranding(orgId);
      return NextResponse.json(branding, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }

    // 2. Explicit domain param or infer from Host header
    const domain = domainParam || request.headers.get("host") || "";

    if (domain) {
      const branding = await getBrandingFromDomain(domain);

      if (branding) {
        return NextResponse.json(branding, {
          headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
        });
      }
    }

    // 3. Fallback — return default branding (no org matched)
    const defaultBranding = {
      orgId: null,
      name: process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO",
      primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#78350f",
      secondaryColor: "#f59e0b",
      logoUrl: null,
    };

    return NextResponse.json(defaultBranding, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    logger.error("Branding API error", { error });
    return NextResponse.json(
      { error: "Failed to fetch branding" },
      { status: 500 }
    );
  }
}
