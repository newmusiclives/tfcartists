import { NextRequest, NextResponse } from "next/server";
import { elliot } from "@/lib/ai/elliot-agent";
import { logger } from "@/lib/logger";

/**
 * POST /api/elliot/content
 * Generate viral content using Elliot's team
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, category, artistId, artistName, theme } = body;

    // Validate input
    if (!type || !category) {
      return NextResponse.json(
        { error: "Missing required fields: type, category" },
        { status: 400 }
      );
    }

    // Generate content
    const content = await elliot.generateContent({
      type,
      category,
      artistId,
      artistName,
      theme,
    });

    logger.info("Content generated via API", { type, category });

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    logger.error("Content generation API error", { error });

    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/elliot/content
 * List recent viral content
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "draft";
    const limit = parseInt(searchParams.get("limit") || "20");

    const { prisma } = await import("@/lib/db");

    const content = await prisma.viralContent.findMany({
      where: status !== "all" ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      content,
      count: content.length,
    });
  } catch (error) {
    logger.error("Failed to fetch content", { error });

    return NextResponse.json(
      {
        error: "Failed to fetch content",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
