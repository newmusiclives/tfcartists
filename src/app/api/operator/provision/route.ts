import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { STATION_TEMPLATES } from "@/lib/station-templates";
import { manifest } from "@/lib/payments/manifest";
import { z } from "zod";

export const dynamic = "force-dynamic";

const provisionSchema = z.object({
  templateId: z.string(),
  stationName: z.string().min(2),
  callSign: z.string().regex(/^[A-Z]{2,5}$/i).optional(),
  plan: z.enum(["starter", "pro", "enterprise", "network"]).default("starter"),
});

/**
 * POST /api/operator/provision
 * One-click station provisioning from a template.
 * Creates station, DJs, clock templates, schedule, and Manifest subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = provisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { templateId, stationName, callSign, plan } = parsed.data;

    // Find template
    const template = STATION_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Get or verify organization
    const orgId = session.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found for this user" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check station limit
    const stationCount = await prisma.station.count({
      where: { organizationId: orgId, deletedAt: null },
    });
    if (stationCount >= org.maxStations) {
      return NextResponse.json(
        { error: `Station limit reached (${org.maxStations}). Upgrade your plan for more.` },
        { status: 403 }
      );
    }

    // Provision everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create station
      const station = await tx.station.create({
        data: {
          name: stationName,
          callSign: callSign?.toUpperCase() || null,
          stationCode: callSign?.toLowerCase() || stationName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          genre: template.genre,
          formatType: template.formatType,
          tagline: template.tagline,
          description: template.description,
          primaryColor: template.primaryColor,
          secondaryColor: template.secondaryColor,
          musicEra: template.musicEra,
          organizationId: orgId,
          setupStep: 5,
          setupComplete: true,
          isActive: true,
          launchDate: new Date(),
        },
      });

      // 2. Create DJs from template presets
      const createdDJs = [];
      for (const preset of template.djPresets) {
        const djSlug = `${preset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${station.id.slice(-6)}`;
        const dj = await tx.dJ.create({
          data: {
            stationId: station.id,
            name: preset.name,
            slug: djSlug,
            tagline: preset.tagline,
            bio: preset.bio,
            personalityTraits: preset.traits,
            voiceDescription: preset.voiceDescription,
            colorPrimary: preset.colorPrimary,
            vibe: preset.vibe,
            age: preset.age,
            isWeekend: preset.isWeekend,
            isActive: true,
          },
        });
        createdDJs.push(dj);
      }

      // 3. Create clock templates
      const clockDefs = [
        { name: "Morning Drive", clockType: "morning_drive", tempo: "upbeat", energyLevel: "high" },
        { name: "Midday Mix", clockType: "midday", tempo: "moderate", energyLevel: "medium" },
        { name: "Evening Wind-Down", clockType: "evening", tempo: "laid_back", energyLevel: "low" },
        { name: "Late Night", clockType: "late_night", tempo: "laid_back", energyLevel: "low" },
        { name: "Weekend Vibes", clockType: "weekend", tempo: "moderate", energyLevel: "medium" },
      ];

      const clockTemplates = [];
      for (const ct of clockDefs) {
        const tpl = await tx.clockTemplate.create({
          data: { stationId: station.id, ...ct },
        });
        clockTemplates.push(tpl);
      }

      // 4. Auto-generate schedule (weekday DJs across 6am-6pm)
      const timeBlocks = [
        { start: "06:00", end: "09:00" },
        { start: "09:00", end: "12:00" },
        { start: "12:00", end: "15:00" },
        { start: "15:00", end: "18:00" },
      ];

      const weekdayDJs = createdDJs.filter(d => !d.isWeekend);
      const morningTemplate = clockTemplates.find(t => t.clockType === "morning_drive");
      const middayTemplate = clockTemplates.find(t => t.clockType === "midday");
      const eveningTemplate = clockTemplates.find(t => t.clockType === "evening");

      for (const [i, block] of timeBlocks.entries()) {
        if (weekdayDJs.length === 0) break;
        const dj = weekdayDJs[i % weekdayDJs.length];
        const tpl = i === 0 ? morningTemplate : i < 3 ? middayTemplate : eveningTemplate;

        for (const dayType of ["weekday", "saturday", "sunday"]) {
          await tx.clockAssignment.create({
            data: {
              stationId: station.id,
              djId: dj.id,
              clockTemplateId: tpl?.id || clockTemplates[0].id,
              dayType,
              timeSlotStart: block.start,
              timeSlotEnd: block.end,
            },
          });
        }
      }

      return { station, djs: createdDJs, clockTemplates };
    });

    // 5. Create Manifest Financial subscription (non-blocking)
    let checkoutUrl: string | null = null;
    if (manifest.isConfigured() && plan !== "starter") {
      try {
        const sub = await manifest.createStationSubscription({
          organizationId: orgId,
          plan,
          email: org.ownerEmail,
          organizationName: org.name,
        });
        checkoutUrl = sub.checkoutUrl;
      } catch (error) {
        // Don't block provisioning if payment setup fails
      }
    }

    return NextResponse.json({
      success: true,
      station: {
        id: result.station.id,
        name: result.station.name,
        genre: result.station.genre,
      },
      djCount: result.djs.length,
      clockTemplateCount: result.clockTemplates.length,
      checkoutUrl,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/operator/provision");
  }
}
