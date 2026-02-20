import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { aiProvider } from "@/lib/ai/providers";
import { withRateLimit } from "@/lib/rate-limit/limiter";

export const dynamic = "force-dynamic";

// Weekday DJ schedule: slug, shift start hour, shift end hour, time description
const WEEKDAY_DJS = [
  { slug: "hank-westwood", startHour: 6, endHour: 9, timeDesc: "6 AM to 9 AM morning" },
  { slug: "loretta-merrick", startHour: 9, endHour: 12, timeDesc: "9 AM to noon midmorning" },
  { slug: "doc-holloway", startHour: 12, endHour: 15, timeDesc: "noon to 3 PM afternoon" },
  { slug: "cody-rampart", startHour: 15, endHour: 18, timeDesc: "3 PM to 6 PM afternoon drive" },
];

// Handoff pairs: outgoing DJ index → incoming DJ index
const HANDOFFS = [
  { fromIdx: 0, toIdx: 1, hour: 9, groupId: "hank-to-loretta" },
  { fromIdx: 1, toIdx: 2, hour: 12, groupId: "loretta-to-doc" },
  { fromIdx: 2, toIdx: 3, hour: 15, groupId: "doc-to-cody" },
];

interface DJRecord {
  id: string;
  name: string;
  slug: string;
  gptSystemPrompt: string | null;
  catchPhrases: string | null;
  additionalKnowledge: string | null;
  gptTemperature: number;
}

function buildPersonaContext(dj: DJRecord): string {
  const parts: string[] = [];
  if (dj.gptSystemPrompt) parts.push(dj.gptSystemPrompt);
  if (dj.catchPhrases) parts.push(`Catch phrases: ${dj.catchPhrases}`);
  if (dj.additionalKnowledge) parts.push(dj.additionalKnowledge);
  return parts.join("\n\n") || `You are ${dj.name}, a radio DJ.`;
}

async function generateScript(
  systemPrompt: string,
  userPrompt: string,
  temperature: number
): Promise<string> {
  const result = await aiProvider.chat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature, maxTokens: 200 }
  );
  return result.content.trim();
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, "ai");
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { stationId } = body;

    if (!stationId) {
      return NextResponse.json(
        { error: "stationId is required" },
        { status: 400 }
      );
    }

    // Look up all 4 weekday DJs
    const djSlugs = WEEKDAY_DJS.map((d) => d.slug);
    const djs = await prisma.dJ.findMany({
      where: { slug: { in: djSlugs } },
      select: {
        id: true,
        name: true,
        slug: true,
        gptSystemPrompt: true,
        catchPhrases: true,
        additionalKnowledge: true,
        gptTemperature: true,
      },
    });

    const djBySlug = new Map(djs.map((d) => [d.slug, d]));

    const missing = djSlugs.filter((s) => !djBySlug.has(s));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `DJs not found: ${missing.join(", ")}` },
        { status: 404 }
      );
    }

    const created: string[] = [];
    const skipped: string[] = [];

    // --- Show Intros (4 records) ---
    for (const schedule of WEEKDAY_DJS) {
      const dj = djBySlug.get(schedule.slug)!;
      const name = `${dj.name} Show Intro`;

      const existing = await prisma.showTransition.findFirst({
        where: {
          stationId,
          transitionType: "show_intro",
          fromDjId: dj.id,
        },
      });

      if (existing) {
        skipped.push(name);
        continue;
      }

      const persona = buildPersonaContext(dj);
      const script = await generateScript(
        persona,
        `Write a show opening for ${dj.name} starting their ${schedule.timeDesc} shift on North Country Radio. MUST be under 30 words. In character. No stage directions, just the spoken words.`,
        dj.gptTemperature
      );

      await prisma.showTransition.create({
        data: {
          stationId,
          transitionType: "show_intro",
          name,
          description: `${dj.name} opens their show`,
          scriptText: script,
          dayOfWeek: 1, // Monday (represents weekday)
          hourOfDay: schedule.startHour,
          timeContext: schedule.startHour < 12 ? "morning_drive" : "midday",
          fromDjId: dj.id,
          durationSeconds: 15,
          isActive: true,
        },
      });

      created.push(name);
    }

    // --- Show Outros (4 records) ---
    for (const schedule of WEEKDAY_DJS) {
      const dj = djBySlug.get(schedule.slug)!;
      const name = `${dj.name} Show Outro`;

      const existing = await prisma.showTransition.findFirst({
        where: {
          stationId,
          transitionType: "show_outro",
          fromDjId: dj.id,
        },
      });

      if (existing) {
        skipped.push(name);
        continue;
      }

      const persona = buildPersonaContext(dj);
      const script = await generateScript(
        persona,
        `Write a sign-off for ${dj.name} ending their ${schedule.timeDesc} shift on North Country Radio. MUST be under 20 words. In character. Warm and brief. No stage directions, just the spoken words.`,
        dj.gptTemperature
      );

      await prisma.showTransition.create({
        data: {
          stationId,
          transitionType: "show_outro",
          name,
          description: `${dj.name} signs off`,
          scriptText: script,
          dayOfWeek: 1,
          hourOfDay: schedule.endHour - 1, // last hour of shift
          timeContext: schedule.endHour <= 12 ? "morning_drive" : "midday",
          fromDjId: dj.id,
          durationSeconds: 10,
          isActive: true,
        },
      });

      created.push(name);
    }

    // --- Handoff Crosstalk (3 pairs × 2 parts = 6 records) ---
    for (const handoff of HANDOFFS) {
      const fromDj = djBySlug.get(WEEKDAY_DJS[handoff.fromIdx].slug)!;
      const toDj = djBySlug.get(WEEKDAY_DJS[handoff.toIdx].slug)!;

      // Part 1: outgoing DJ wraps up and tosses to incoming DJ
      const part1Name = `${fromDj.name} → ${toDj.name} Handoff Pt.1`;
      const existingPt1 = await prisma.showTransition.findFirst({
        where: {
          stationId,
          transitionType: "handoff",
          handoffGroupId: handoff.groupId,
          handoffPart: 1,
        },
      });

      if (!existingPt1) {
        const fromPersona = buildPersonaContext(fromDj);
        const script1 = await generateScript(
          fromPersona,
          `Write ${fromDj.name} tossing to ${toDj.name} on North Country Radio. MUST be under 20 words. In character. No stage directions, just the spoken words.`,
          fromDj.gptTemperature
        );

        await prisma.showTransition.create({
          data: {
            stationId,
            transitionType: "handoff",
            name: part1Name,
            description: `${fromDj.name} tosses to ${toDj.name}`,
            scriptText: script1,
            dayOfWeek: 1,
            hourOfDay: handoff.hour,
            fromDjId: fromDj.id,
            toDjId: toDj.id,
            handoffGroupId: handoff.groupId,
            handoffPart: 1,
            handoffPartName: "Toss",
            durationSeconds: 10,
            isActive: true,
          },
        });
        created.push(part1Name);
      } else {
        skipped.push(part1Name);
      }

      // Part 2: incoming DJ takes over
      const part2Name = `${fromDj.name} → ${toDj.name} Handoff Pt.2`;
      const existingPt2 = await prisma.showTransition.findFirst({
        where: {
          stationId,
          transitionType: "handoff",
          handoffGroupId: handoff.groupId,
          handoffPart: 2,
        },
      });

      if (!existingPt2) {
        const toPersona = buildPersonaContext(toDj);
        const script2 = await generateScript(
          toPersona,
          `Write ${toDj.name} taking over from ${fromDj.name} on North Country Radio. MUST be under 20 words. In character, upbeat. No stage directions, just the spoken words.`,
          toDj.gptTemperature
        );

        await prisma.showTransition.create({
          data: {
            stationId,
            transitionType: "handoff",
            name: part2Name,
            description: `${toDj.name} takes over from ${fromDj.name}`,
            scriptText: script2,
            dayOfWeek: 1,
            hourOfDay: handoff.hour,
            fromDjId: fromDj.id,
            toDjId: toDj.id,
            handoffGroupId: handoff.groupId,
            handoffPart: 2,
            handoffPartName: "Takeover",
            durationSeconds: 10,
            isActive: true,
          },
        });
        created.push(part2Name);
      } else {
        skipped.push(part2Name);
      }
    }

    return NextResponse.json({
      message: `Created ${created.length} transitions, skipped ${skipped.length} existing`,
      created,
      skipped,
      total: created.length + skipped.length,
    });
  } catch (error) {
    return handleApiError(error, "/api/show-transitions/seed-weekday");
  }
}
