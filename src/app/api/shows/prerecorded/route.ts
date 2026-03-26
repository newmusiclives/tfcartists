import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, audioUrl, scheduledDate, scheduledHour, djId, description, stationId } = body;

    if (!title || !audioUrl || !scheduledDate || scheduledHour === undefined) {
      return NextResponse.json(
        { error: "title, audioUrl, scheduledDate, and scheduledHour are required" },
        { status: 400 }
      );
    }

    const id = `prs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const key = `prerecorded_show:${id}`;

    const showData = {
      id,
      title,
      audioUrl,
      scheduledDate,
      scheduledHour: Number(scheduledHour),
      djId: djId || null,
      description: description || "",
      stationId: stationId || null,
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };

    await prisma.systemConfig.create({
      data: {
        key,
        value: JSON.stringify(showData),
        category: "prerecorded_show",
        label: `Pre-recorded: ${title}`,
        encrypted: false,
      },
    });

    logger.info("Pre-recorded show scheduled", { id, title, scheduledDate, scheduledHour });

    return NextResponse.json({ success: true, id, show: showData });
  } catch (error) {
    logger.error("Failed to schedule pre-recorded show", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to schedule show" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { category: "prerecorded_show" },
      orderBy: { createdAt: "desc" },
    });

    const shows = configs
      .map((c) => {
        try {
          return { key: c.key, ...JSON.parse(c.value) };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({ shows });
  } catch (error) {
    logger.error("Failed to list pre-recorded shows", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to list shows" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const key = id.startsWith("prerecorded_show:") ? id : `prerecorded_show:${id}`;

    const config = await prisma.systemConfig.findUnique({ where: { key } });
    if (!config) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    // Mark as cancelled instead of deleting
    const data = JSON.parse(config.value);
    data.status = "cancelled";
    data.cancelledAt = new Date().toISOString();

    await prisma.systemConfig.update({
      where: { key },
      data: { value: JSON.stringify(data) },
    });

    logger.info("Pre-recorded show cancelled", { id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to cancel pre-recorded show", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to cancel show" }, { status: 500 });
  }
}
