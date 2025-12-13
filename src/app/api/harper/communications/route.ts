import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/harper/communications
 * Get conversation history for a sponsor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sponsorId = searchParams.get("sponsorId");

    if (!sponsorId) {
      return NextResponse.json({ error: "sponsorId is required" }, { status: 400 });
    }

    // Get all conversations for this sponsor
    const conversations = await prisma.sponsorConversation.findMany({
      where: { sponsorId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get sponsor details
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      select: {
        businessName: true,
        contactName: true,
        stage: true,
        sponsorshipTier: true,
        lastContactedAt: true,
      },
    });

    logger.info("Harper communications retrieved", { sponsorId, conversationCount: conversations.length });

    return NextResponse.json({
      success: true,
      sponsor,
      conversations,
      messageCount: conversations.reduce((sum, conv) => sum + conv.messages.length, 0),
    });
  } catch (error: any) {
    logger.error("Failed to retrieve Harper communications", { error: error.message });
    return NextResponse.json(
      { error: "Failed to retrieve communications", details: error.message },
      { status: 500 }
    );
  }
}
