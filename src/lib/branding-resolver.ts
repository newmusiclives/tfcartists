import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { headers, cookies } from "next/headers";

/**
 * Branding Resolver
 *
 * Resolves the full white-label branding for the current request.
 * Resolution order:
 *   1. x-org-id header (set by middleware for custom domain requests)
 *   2. x-org-id cookie (set by middleware, persists across navigations)
 *   3. Explicit orgId passed in (e.g. from session)
 *   4. Environment variable defaults
 *
 * Results are cached in-memory with a 5-minute TTL.
 */

export interface ResolvedBranding {
  orgId: string | null;
  stationName: string;
  logo: string | null;
  favicon: string | null;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  footerText: string;
  whiteLabel: boolean;
}

const DEFAULT_BRANDING: ResolvedBranding = {
  orgId: null,
  stationName: process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO",
  logo: null,
  favicon: null,
  colors: {
    primary: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#78350f",
    secondary: "#f59e0b",
    accent: "#d97706",
    background: "#fffbeb",
  },
  footerText: "Powered by TrueFans",
  whiteLabel: false,
};

// In-memory cache: orgId -> { branding, expiresAt }
const brandingCache = new Map<
  string,
  { branding: ResolvedBranding; expiresAt: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch branding for an organization from the database.
 */
async function fetchOrgBranding(orgId: string): Promise<ResolvedBranding> {
  const cached = brandingCache.get(orgId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.branding;
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        customLogo: true,
        customFavicon: true,
        customColors: true,
        customFooterText: true,
        whiteLabel: true,
      },
    });

    if (!org) {
      return { ...DEFAULT_BRANDING, orgId };
    }

    const customColors = (org.customColors as Record<string, string>) || {};

    const branding: ResolvedBranding = {
      orgId: org.id,
      stationName: org.name,
      logo: org.customLogo || org.logoUrl || null,
      favicon: org.customFavicon || null,
      colors: {
        primary:
          customColors.primary ||
          org.primaryColor ||
          DEFAULT_BRANDING.colors.primary,
        secondary:
          customColors.secondary ||
          org.secondaryColor ||
          DEFAULT_BRANDING.colors.secondary,
        accent: customColors.accent || DEFAULT_BRANDING.colors.accent,
        background:
          customColors.background || DEFAULT_BRANDING.colors.background,
      },
      footerText:
        org.customFooterText || DEFAULT_BRANDING.footerText,
      whiteLabel: org.whiteLabel ?? false,
    };

    brandingCache.set(orgId, {
      branding,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return branding;
  } catch (error) {
    logger.error("Failed to resolve org branding", { orgId, error });
    return { ...DEFAULT_BRANDING, orgId };
  }
}

/**
 * Resolve branding from the current server-side request context.
 * Call this in Server Components or API routes.
 */
export async function resolveBranding(
  explicitOrgId?: string
): Promise<ResolvedBranding> {
  // 1. Explicit orgId takes priority
  if (explicitOrgId) {
    return fetchOrgBranding(explicitOrgId);
  }

  // 2. Check header set by middleware (custom domain resolution)
  try {
    const headerStore = await headers();
    const headerOrgId = headerStore.get("x-org-id");
    if (headerOrgId) {
      return fetchOrgBranding(headerOrgId);
    }
  } catch {
    // headers() may not be available in all contexts
  }

  // 3. Check cookie (persisted from middleware)
  try {
    const cookieStore = await cookies();
    const cookieOrgId = cookieStore.get("x-org-id")?.value;
    if (cookieOrgId) {
      return fetchOrgBranding(cookieOrgId);
    }
  } catch {
    // cookies() may not be available in all contexts
  }

  // 4. Fallback to defaults
  return DEFAULT_BRANDING;
}

/**
 * Invalidate the branding cache for a specific org.
 * Call this after updating white-label settings.
 */
export function invalidateBrandingCache(orgId: string): void {
  brandingCache.delete(orgId);
}
