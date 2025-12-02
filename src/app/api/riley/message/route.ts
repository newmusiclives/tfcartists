import { NextRequest, NextResponse } from "next/server";
import { riley } from "@/lib/ai/riley-agent";
import { prisma } from "@/lib/db";

/**
 * POST /api/riley/message
 * Handle incoming messages from artists
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistId, message, channel = "sms" } = body;

    if (!artistId || !message) {
      return NextResponse.json(
        { error: "Missing required fields: artistId, message" },
        { status: 400 }
      );
    }

    // Process the message and get Riley's response
    const response = await riley.handleArtistMessage(artistId, message, channel);

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Error handling artist message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
