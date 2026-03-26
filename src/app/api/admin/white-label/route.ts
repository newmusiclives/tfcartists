import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getOrgScope } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { invalidateBrandingCache } from "@/lib/branding-resolver";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/white-label
 *
 * Returns the white-label settings for the current user's organization.
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const orgScope = getOrgScope(session);

    if (!orgScope.organizationId && !session?.user?.organizationId) {
      // Super-admin without org context — need orgId param or return empty
      return NextResponse.json({
        customDomain: null,
        customLogo: null,
        customFavicon: null,
        customColors: null,
        customFooterText: null,
        whiteLabel: false,
      });
    }

    const orgId = orgScope.organizationId || session?.user?.organizationId;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        domain: true,
        customDomain: true,
        customLogo: true,
        customFavicon: true,
        customColors: true,
        customFooterText: true,
        whiteLabel: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: org.id,
      name: org.name,
      domain: org.domain,
      customDomain: org.customDomain,
      customLogo: org.customLogo,
      customFavicon: org.customFavicon,
      customColors: org.customColors,
      customFooterText: org.customFooterText,
      whiteLabel: org.whiteLabel,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
      secondaryColor: org.secondaryColor,
    });
  } catch (error) {
    return handleApiError(error, "/api/admin/white-label");
  }
}

/**
 * PUT /api/admin/white-label
 *
 * Updates white-label settings for the current user's organization.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const orgScope = getOrgScope(session);
    const orgId = orgScope.organizationId || session?.user?.organizationId;

    if (!orgId) {
      return NextResponse.json(
        { error: "No organization context. Admin users must specify an organization." },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate customDomain format if provided
    if (body.customDomain !== undefined && body.customDomain !== null && body.customDomain !== "") {
      const domain = body.customDomain.toLowerCase().trim();
      // Basic domain validation
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(domain)) {
        return NextResponse.json(
          { error: "Invalid domain format. Example: radio.yourbrand.com" },
          { status: 400 }
        );
      }
      // Check uniqueness (exclude current org)
      const existing = await prisma.organization.findFirst({
        where: {
          customDomain: domain,
          id: { not: orgId },
          deletedAt: null,
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "This domain is already registered to another organization." },
          { status: 409 }
        );
      }
      body.customDomain = domain;
    }

    // Validate customColors if provided
    if (body.customColors !== undefined && body.customColors !== null) {
      const validKeys = ["primary", "secondary", "accent", "background"];
      const colors = body.customColors;
      if (typeof colors !== "object" || Array.isArray(colors)) {
        return NextResponse.json(
          { error: "customColors must be an object with keys: primary, secondary, accent, background" },
          { status: 400 }
        );
      }
      // Only allow valid color keys
      const filtered: Record<string, string> = {};
      for (const key of validKeys) {
        if (colors[key] && typeof colors[key] === "string") {
          filtered[key] = colors[key];
        }
      }
      body.customColors = Object.keys(filtered).length > 0 ? filtered : null;
    }

    // Whitelist allowed fields
    const allowedFields = [
      "customDomain",
      "customLogo",
      "customFavicon",
      "customColors",
      "customFooterText",
      "whiteLabel",
    ];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key];
      }
    }

    // Ensure whiteLabel is boolean
    if ("whiteLabel" in updateData) {
      updateData.whiteLabel = Boolean(updateData.whiteLabel);
    }

    // Allow empty string to clear customDomain
    if (updateData.customDomain === "") {
      updateData.customDomain = null;
    }

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: updateData,
      select: {
        id: true,
        customDomain: true,
        customLogo: true,
        customFavicon: true,
        customColors: true,
        customFooterText: true,
        whiteLabel: true,
      },
    });

    // Invalidate branding cache so changes take effect immediately
    invalidateBrandingCache(orgId);

    logger.info("White-label settings updated", {
      orgId,
      updatedFields: Object.keys(updateData),
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "/api/admin/white-label");
  }
}
