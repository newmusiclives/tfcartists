import { NextRequest, NextResponse } from "next/server";
import { getOrganizationBranding, getBrandingFromDomain } from "@/lib/branding";
import { prisma } from "@/lib/db";
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
 * Response includes extended white-label fields when available.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const domainParam = searchParams.get("domain");
    const cacheHeaders = {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    };

    // Helper: enrich basic branding with white-label fields
    async function enrichBranding(basicOrgId: string) {
      try {
        const org = await prisma.organization.findUnique({
          where: { id: basicOrgId },
          select: {
            id: true,
            name: true,
            primaryColor: true,
            secondaryColor: true,
            logoUrl: true,
            customLogo: true,
            customFavicon: true,
            customColors: true,
            customFooterText: true,
            whiteLabel: true,
          },
        });

        if (!org) return null;

        const customColors = (org.customColors as Record<string, string>) || {};

        return {
          orgId: org.id,
          name: org.name,
          primaryColor: customColors.primary || org.primaryColor || "#78350f",
          secondaryColor: customColors.secondary || org.secondaryColor || "#f59e0b",
          logoUrl: org.customLogo || org.logoUrl || null,
          logo: org.customLogo || org.logoUrl || null,
          favicon: org.customFavicon || null,
          accentColor: customColors.accent || "#d97706",
          backgroundColor: customColors.background || "#fffbeb",
          footerText: org.customFooterText || "Powered by TrueFans",
          whiteLabel: org.whiteLabel ?? false,
        };
      } catch {
        return null;
      }
    }

    // 1. Explicit orgId
    if (orgId) {
      const enriched = await enrichBranding(orgId);
      if (enriched) {
        return NextResponse.json(enriched, { headers: cacheHeaders });
      }
      // Fall back to basic branding
      const branding = await getOrganizationBranding(orgId);
      return NextResponse.json(branding, { headers: cacheHeaders });
    }

    // 2. Explicit domain param or infer from Host header
    const domain = domainParam || request.headers.get("host") || "";

    if (domain) {
      // First try customDomain lookup
      try {
        const cleanDomain = domain.split(":")[0].toLowerCase();
        const org = await prisma.organization.findFirst({
          where: {
            OR: [
              { customDomain: cleanDomain },
              { domain: cleanDomain },
            ],
            deletedAt: null,
          },
          select: { id: true },
        });

        if (org) {
          const enriched = await enrichBranding(org.id);
          if (enriched) {
            return NextResponse.json(enriched, { headers: cacheHeaders });
          }
        }
      } catch {
        // Fall through to legacy lookup
      }

      // Legacy: getBrandingFromDomain
      const branding = await getBrandingFromDomain(domain);
      if (branding) {
        return NextResponse.json(branding, { headers: cacheHeaders });
      }
    }

    // 3. Fallback — return default branding (no org matched)
    const defaultBranding = {
      orgId: null,
      name: process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO",
      primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#78350f",
      secondaryColor: "#f59e0b",
      logoUrl: null,
      favicon: null,
      accentColor: "#d97706",
      backgroundColor: "#fffbeb",
      footerText: "Powered by TrueFans",
      whiteLabel: false,
    };

    return NextResponse.json(defaultBranding, { headers: cacheHeaders });
  } catch (error) {
    logger.error("Branding API error", { error });
    return NextResponse.json(
      { error: "Failed to fetch branding" },
      { status: 500 }
    );
  }
}
