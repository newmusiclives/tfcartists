import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST endpoint for sendBeacon session-end (sendBeacon only supports POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, duration } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const session = await prisma.listeningSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        duration: duration ? Math.round(duration / 60) : null,
      },
    });

    if (session.listenerId && duration) {
      const hours = duration / 3600;
      await prisma.listener.update({
        where: { id: session.listenerId },
        data: {
          totalListeningHours: { increment: hours },
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
  }
}
