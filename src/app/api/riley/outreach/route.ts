import { NextRequest, NextResponse } from "next/server";
import { riley } from "@/lib/ai/riley-agent";
import { prisma } from "@/lib/db";
import { RILEY_INTENTS } from "@/lib/ai/riley-personality";

/**
 * POST /api/riley/outreach
 * Trigger Riley to reach out to a specific artist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistId } = body;

    if (!artistId) {
      return NextResponse.json(
        { error: "Missing required field: artistId" },
        { status: 400 }
      );
    }

    // Get artist
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Create initial conversation if doesn't exist
    let conversation = await prisma.conversation.findFirst({
      where: {
        artistId,
        isActive: true,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          artistId,
          channel: "sms",
          isActive: true,
        },
      });
    }

    // Generate initial outreach message
    const message = await riley.generateResponse({
      artistId: artist.id,
      artistName: artist.name,
      genre: artist.genre || undefined,
      conversationHistory: [],
      intent: RILEY_INTENTS.INITIAL_OUTREACH,
    });

    // Send the message
    await riley.sendMessage(artistId, message, RILEY_INTENTS.INITIAL_OUTREACH);

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error sending outreach:", error);
    return NextResponse.json({ error: "Failed to send outreach" }, { status: 500 });
  }
}
