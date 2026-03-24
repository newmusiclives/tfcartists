import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { optionalAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/station-admin/wizard
 *
 * Saves progress for each wizard step.
 * Body: { step: number, stationId?: string, data: StepData }
 *
 * Step 1 - Station Setup:     { name, tagline, genre, timezone }
 * Step 2 - Import Music:      { stationId, songs: [{title, artist, album, genre, duration}] }
 * Step 3 - Configure DJs:     { stationId, djs: [{name, bio, voice, startHour, endHour}] }
 * Step 4 - Set Schedule:      { stationId, assignments: [{djId, dayOfWeek, hour}] }
 * Step 5 - Go Live:           { stationId }
 */
export async function POST(request: NextRequest) {
  try {
    await optionalAuth();
    const body = await request.json();
    const { step, stationId, data } = body;

    if (typeof step !== "number" || step < 1 || step > 5) {
      return NextResponse.json({ error: "Invalid step (must be 1-5)" }, { status: 400 });
    }

    // -----------------------------------------------------------------------
    // Step 1: Station Setup — create or update station
    // -----------------------------------------------------------------------
    if (step === 1) {
      const { name, tagline, genre, timezone } = data || {};
      if (!name || !name.trim()) {
        return NextResponse.json({ error: "Station name is required" }, { status: 400 });
      }
      if (!genre || !genre.trim()) {
        return NextResponse.json({ error: "Genre is required" }, { status: 400 });
      }

      const stationCode = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      if (stationId) {
        // Update existing station
        const station = await prisma.station.update({
          where: { id: stationId },
          data: {
            name: name.trim(),
            tagline: tagline?.trim() || null,
            genre: genre.trim(),
            formatType: genre.trim().toLowerCase(),
            stationCode,
            setupStep: 1,
            metadata: timezone ? { timezone } : undefined,
          },
        });
        return NextResponse.json({ station, step: 1 });
      } else {
        // Create new station
        const station = await prisma.station.create({
          data: {
            name: name.trim(),
            tagline: tagline?.trim() || null,
            genre: genre.trim(),
            formatType: genre.trim().toLowerCase(),
            stationCode,
            setupStep: 1,
            setupComplete: false,
            isActive: false,
            metadata: timezone ? { timezone } : undefined,
          },
        });
        return NextResponse.json({ station, step: 1 });
      }
    }

    // -----------------------------------------------------------------------
    // Step 2: Import Music — bulk import songs via CSV data
    // -----------------------------------------------------------------------
    if (step === 2) {
      if (!stationId) {
        return NextResponse.json({ error: "stationId is required" }, { status: 400 });
      }
      const songs = data?.songs || [];
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const song of songs) {
        try {
          if (!song.title || !song.artist) {
            skipped++;
            errors.push(`Skipped: missing title or artist`);
            continue;
          }
          await prisma.song.create({
            data: {
              stationId,
              title: song.title.trim(),
              artistName: song.artist.trim(),
              album: song.album?.trim() || null,
              genre: song.genre?.trim() || null,
              duration: song.duration ? parseInt(String(song.duration), 10) : null,
              rotationCategory: "C",
              isActive: true,
            },
          });
          imported++;
        } catch (e: any) {
          skipped++;
          errors.push(`Failed: ${song.title} - ${e.message?.slice(0, 80)}`);
        }
      }

      // Update setup step
      await prisma.station.update({
        where: { id: stationId },
        data: { setupStep: 2 },
      });

      return NextResponse.json({
        step: 2,
        results: { imported, skipped, errors: errors.slice(0, 20) },
      });
    }

    // -----------------------------------------------------------------------
    // Step 3: Configure DJs — create DJ records
    // -----------------------------------------------------------------------
    if (step === 3) {
      if (!stationId) {
        return NextResponse.json({ error: "stationId is required" }, { status: 400 });
      }
      const djList = data?.djs || [];
      const createdDJs: any[] = [];

      for (const dj of djList) {
        if (!dj.name?.trim()) continue;
        const slug = dj.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

        // Check for existing slug
        const existing = await prisma.dJ.findUnique({ where: { slug } });
        if (existing) {
          createdDJs.push(existing);
          continue;
        }

        const created = await prisma.dJ.create({
          data: {
            stationId,
            name: dj.name.trim(),
            slug,
            bio: dj.bio?.trim() || `${dj.name.trim()} is an AI DJ.`,
            ttsVoice: dj.voice || "alloy",
            ttsProvider: "openai",
            isActive: true,
            isWeekend: false,
          },
        });

        // Create a DJShow for the schedule if start/end hour provided
        if (typeof dj.startHour === "number" && typeof dj.endHour === "number") {
          const startTime = `${String(dj.startHour).padStart(2, "0")}:00`;
          const endTime = `${String(dj.endHour).padStart(2, "0")}:00`;
          const showSlug = `${slug}-show-${Date.now()}`;
          const durationMinutes = dj.endHour > dj.startHour
            ? (dj.endHour - dj.startHour) * 60
            : (24 - dj.startHour + dj.endHour) * 60;
          await prisma.dJShow.create({
            data: {
              djId: created.id,
              name: `${dj.name.trim()} Show`,
              slug: showSlug,
              dayOfWeek: 1, // Default to Monday; schedule step assigns all days
              startTime,
              endTime,
              duration: durationMinutes,
              isActive: true,
            },
          });
        }

        createdDJs.push(created);
      }

      // Auto-create default clock templates if none exist
      const existingTemplates = await prisma.clockTemplate.count({ where: { stationId } });
      const templates: any[] = [];
      if (existingTemplates === 0) {
        const defaults = [
          { name: "Morning Drive", clockType: "morning_drive", tempo: "upbeat", energyLevel: "high" },
          { name: "Midday Mix", clockType: "midday", tempo: "moderate", energyLevel: "medium" },
          { name: "Afternoon Drive", clockType: "evening", tempo: "upbeat", energyLevel: "high" },
          { name: "Evening", clockType: "evening", tempo: "laid_back", energyLevel: "low" },
          { name: "Late Night", clockType: "late_night", tempo: "laid_back", energyLevel: "low" },
          { name: "Weekend", clockType: "weekend", tempo: "moderate", energyLevel: "medium" },
        ];
        for (const tpl of defaults) {
          const t = await prisma.clockTemplate.create({
            data: { stationId, ...tpl, isActive: true },
          });
          templates.push(t);
        }
      }

      await prisma.station.update({
        where: { id: stationId },
        data: { setupStep: 3 },
      });

      return NextResponse.json({
        step: 3,
        djs: createdDJs.map((d) => ({ id: d.id, name: d.name, slug: d.slug, ttsVoice: d.ttsVoice })),
        templates: templates.map((t) => ({ id: t.id, name: t.name, clockType: t.clockType })),
      });
    }

    // -----------------------------------------------------------------------
    // Step 4: Set Schedule — create clock assignments
    // -----------------------------------------------------------------------
    if (step === 4) {
      if (!stationId) {
        return NextResponse.json({ error: "stationId is required" }, { status: 400 });
      }
      const assignments = data?.assignments || [];

      // Clear existing assignments for this station
      await prisma.clockAssignment.deleteMany({ where: { stationId } });

      // Get a default clock template
      const defaultTemplate = await prisma.clockTemplate.findFirst({
        where: { stationId, isActive: true },
        orderBy: { createdAt: "asc" },
      });

      if (!defaultTemplate) {
        return NextResponse.json({ error: "No clock templates found. Complete step 3 first." }, { status: 400 });
      }

      let created = 0;
      const dayTypeMap: Record<number, string> = {
        0: "sunday",
        1: "weekday",
        2: "weekday",
        3: "weekday",
        4: "weekday",
        5: "weekday",
        6: "saturday",
      };

      for (const assignment of assignments) {
        const { djId, dayOfWeek, hour } = assignment;
        if (!djId || typeof dayOfWeek !== "number" || typeof hour !== "number") continue;

        const dayType = dayTypeMap[dayOfWeek] || "weekday";
        const timeSlotStart = `${String(hour).padStart(2, "0")}:00`;
        const timeSlotEnd = `${String((hour + 1) % 24).padStart(2, "0")}:00`;

        try {
          await prisma.clockAssignment.create({
            data: {
              stationId,
              djId,
              clockTemplateId: defaultTemplate.id,
              dayType,
              timeSlotStart,
              timeSlotEnd,
              isActive: true,
            },
          });
          created++;
        } catch {
          // Unique constraint violations are expected for overlapping slots
        }
      }

      await prisma.station.update({
        where: { id: stationId },
        data: { setupStep: 4 },
      });

      return NextResponse.json({ step: 4, assignmentsCreated: created });
    }

    // -----------------------------------------------------------------------
    // Step 5: Go Live — mark station as launched
    // -----------------------------------------------------------------------
    if (step === 5) {
      if (!stationId) {
        return NextResponse.json({ error: "stationId is required" }, { status: 400 });
      }

      const station = await prisma.station.update({
        where: { id: stationId },
        data: {
          setupStep: 5,
          setupComplete: true,
          isActive: true,
          launchDate: new Date(),
        },
      });

      return NextResponse.json({ step: 5, station, launched: true });
    }

    return NextResponse.json({ error: "Unhandled step" }, { status: 400 });
  } catch (error) {
    return handleApiError(error, "/api/station-admin/wizard");
  }
}

/**
 * GET /api/station-admin/wizard
 *
 * Returns the current wizard state for an in-progress station setup.
 */
export async function GET(request: NextRequest) {
  try {
    await optionalAuth();

    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get("stationId");

    if (stationId) {
      const station = await prisma.station.findUnique({
        where: { id: stationId },
        include: {
          stationDJs: {
            select: {
              id: true,
              name: true,
              slug: true,
              ttsVoice: true,
              bio: true,
              shows: { select: { startTime: true, endTime: true, dayOfWeek: true } },
            },
          },
          clockTemplates: {
            where: { isActive: true },
            select: { id: true, name: true, clockType: true },
          },
          clockAssignments: {
            where: { isActive: true },
            select: { id: true, djId: true, dayType: true, timeSlotStart: true, timeSlotEnd: true },
          },
          _count: { select: { songs: true } },
        },
      });

      if (!station) {
        return NextResponse.json({ error: "Station not found" }, { status: 404 });
      }

      return NextResponse.json({ station });
    }

    // Find in-progress station
    const inProgress = await prisma.station.findFirst({
      where: { setupComplete: false, setupStep: { gt: 0 } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        tagline: true,
        genre: true,
        setupStep: true,
        metadata: true,
      },
    });

    return NextResponse.json({ inProgress });
  } catch (error) {
    return handleApiError(error, "/api/station-admin/wizard");
  }
}
