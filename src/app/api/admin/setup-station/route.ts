import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/setup-station
 * Creates a new station with organization, DJs, and initial schedule.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const {
      stationName,
      callSign,
      tagline,
      genre,
      timezone,
      description,
      primaryColor,
      secondaryColor,
      customDomain,
      format,
      hoursPerDay,
      djCount,
      streamUrl,
      streamPort,
      mountPoint,
    } = body;

    if (!stationName || !genre) {
      return NextResponse.json(
        { error: "Station name and genre are required" },
        { status: 400 }
      );
    }

    const slug = stationName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const ownerName = session.user?.name || "Admin";
    const ownerEmail = session.user?.email || "admin@station.local";

    // Create organization
    const org = await prisma.organization.create({
      data: {
        name: stationName,
        slug,
        domain: customDomain || null,
        ownerName,
        ownerEmail,
        primaryColor: primaryColor || "#78350f",
        secondaryColor: secondaryColor || "#f59e0b",
      },
    });

    // Create station
    const station = await prisma.station.create({
      data: {
        name: stationName,
        callSign: callSign || null,
        tagline: tagline || null,
        genre,
        description: description || null,
        stationCode: slug,
        formatType: format || "personality",
        organizationId: org.id,
      },
    });

    // Create default AI DJ personalities
    const djTemplates = [
      { name: "Morning Maven", bio: "Warm, upbeat morning host who loves coffee and good vibes", slug: "morning-maven" },
      { name: "Midday Mike", bio: "Laid-back, knowledgeable music curator who loves deep cuts", slug: "midday-mike" },
      { name: "Drive Time Dana", bio: "Energetic, fun afternoon drive host who keeps things moving", slug: "drive-time-dana" },
      { name: "Night Owl", bio: "Chill, introspective evening host for winding down", slug: "night-owl" },
      { name: "The Specialist", bio: "Genre expert who dives deep into music history and trivia", slug: "the-specialist" },
      { name: "Weekend Warrior", bio: "Fun, party-ready weekend host who loves live music", slug: "weekend-warrior" },
      { name: "Sunday Sessions", bio: "Mellow, acoustic-focused host for lazy Sundays", slug: "sunday-sessions" },
      { name: "The Curator", bio: "Thoughtful, discovery-focused host who spotlights new artists", slug: "the-curator" },
    ];

    const djsToCreate = djTemplates.slice(0, djCount || 4);
    for (const template of djsToCreate) {
      await prisma.dJ.create({
        data: {
          name: template.name,
          slug: `${slug}-${template.slug}`,
          bio: template.bio,
          stationId: station.id,
        },
      });
    }

    logger.info("Station setup complete", {
      stationId: station.id,
      orgId: org.id,
      stationName,
      djCount: djsToCreate.length,
    });

    return NextResponse.json({
      success: true,
      stationId: station.id,
      organizationId: org.id,
      stationName,
      djCount: djsToCreate.length,
    });
  } catch (error) {
    return handleApiError(error, "/api/admin/setup-station");
  }
}
