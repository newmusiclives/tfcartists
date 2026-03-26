import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { listenerName, message, djSlug } = await request.json();

    if (!listenerName || !message) {
      return NextResponse.json(
        { error: "listenerName and message are required" },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message must be under 500 characters" },
        { status: 400 }
      );
    }

    const id = `sht_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const key = `shoutout:${id}`;

    // Resolve DJ name if slug provided
    let djName: string | null = null;
    if (djSlug) {
      const dj = await prisma.dJ.findUnique({
        where: { slug: djSlug },
        select: { name: true },
      });
      djName = dj?.name || null;
    }

    const shoutoutData = {
      id,
      listenerName,
      message,
      djSlug: djSlug || null,
      djName,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await prisma.systemConfig.create({
      data: {
        key,
        value: JSON.stringify(shoutoutData),
        category: "shoutout",
        label: `Shoutout from ${listenerName}`,
        encrypted: false,
      },
    });

    logger.info("Shoutout submitted", { id, listenerName, djSlug });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error("Failed to submit shoutout", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to submit shoutout" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { category: "shoutout" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const shoutouts = configs
      .map((c) => {
        try {
          return { key: c.key, ...JSON.parse(c.value) };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({ shoutouts });
  } catch (error) {
    logger.error("Failed to list shoutouts", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to list shoutouts" }, { status: 500 });
  }
}
