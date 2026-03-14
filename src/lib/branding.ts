import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * White-Label Branding Utilities
 *
 * Fetches per-organization branding (colors, logo, name) from the
 * Organization model so each operator deployment can render its
 * own look-and-feel without code changes.
 */

export interface OrganizationBranding {
  orgId: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}

/** Sensible defaults when no org branding is found. */
const DEFAULT_BRANDING: Omit<OrganizationBranding, "orgId"> = {
  name: process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO",
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#78350f", // amber-700
  secondaryColor: "#f59e0b", // amber-500
  logoUrl: null,
};

/**
 * Fetch branding for a specific organization by ID.
 * Falls back to defaults when the org is not found or has no branding set.
 */
export async function getOrganizationBranding(
  orgId: string
): Promise<OrganizationBranding> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
      },
    });

    if (!org) {
      logger.warn("Organization not found for branding lookup", { orgId });
      return { orgId, ...DEFAULT_BRANDING };
    }

    return {
      orgId: org.id,
      name: org.name,
      primaryColor: org.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: org.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      logoUrl: org.logoUrl || DEFAULT_BRANDING.logoUrl,
    };
  } catch (error) {
    logger.error("Failed to fetch organization branding", { orgId, error });
    return { orgId, ...DEFAULT_BRANDING };
  }
}

/**
 * Look up an organization by its custom domain and return branding.
 * Used in middleware / API routes to resolve the current operator
 * from the incoming request hostname.
 */
export async function getBrandingFromDomain(
  domain: string
): Promise<OrganizationBranding | null> {
  try {
    // Normalise: strip port, lowercase
    const cleanDomain = domain.split(":")[0].toLowerCase();

    const org = await prisma.organization.findFirst({
      where: {
        domain: cleanDomain,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
      },
    });

    if (!org) {
      return null;
    }

    return {
      orgId: org.id,
      name: org.name,
      primaryColor: org.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: org.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      logoUrl: org.logoUrl || DEFAULT_BRANDING.logoUrl,
    };
  } catch (error) {
    logger.error("Failed to fetch branding by domain", { domain, error });
    return null;
  }
}
