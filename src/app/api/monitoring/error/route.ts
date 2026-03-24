import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash } from "crypto";

/**
 * POST /api/monitoring/error
 * Accepts client-side error reports and stores them in the Config table.
 * Rate limited to 100 errors per hour per source.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, stack, componentStack, url, userAgent, timestamp } = body;

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // Rate limiting: count recent errors from this source
    const sourceHash = createHash("md5")
      .update(userAgent || "unknown")
      .digest("hex")
      .slice(0, 8);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentErrors = await prisma.config.findMany({
      where: {
        key: { startsWith: `error:${sourceHash}:` },
      },
    });

    // Filter to errors within the last hour by parsing stored timestamp
    const recentCount = recentErrors.filter((e) => {
      try {
        const data = JSON.parse(e.value);
        return data.timestamp > oneHourAgo;
      } catch {
        return false;
      }
    }).length;

    if (recentCount >= 100) {
      return NextResponse.json(
        { error: "Rate limit exceeded — max 100 errors per hour" },
        { status: 429 }
      );
    }

    // Create a unique key for this error
    const errorHash = createHash("md5")
      .update(`${message}:${stack || ""}`.slice(0, 500))
      .digest("hex")
      .slice(0, 8);

    const ts = timestamp || new Date().toISOString();
    const key = `error:${sourceHash}:${Date.now()}:${errorHash}`;

    await prisma.config.upsert({
      where: { key },
      update: {
        value: JSON.stringify({
          message: String(message).slice(0, 1000),
          stack: stack ? String(stack).slice(0, 2000) : null,
          componentStack: componentStack ? String(componentStack).slice(0, 1000) : null,
          url: url ? String(url).slice(0, 500) : null,
          userAgent: userAgent ? String(userAgent).slice(0, 300) : null,
          timestamp: ts,
          sourceHash,
        }),
      },
      create: {
        key,
        value: JSON.stringify({
          message: String(message).slice(0, 1000),
          stack: stack ? String(stack).slice(0, 2000) : null,
          componentStack: componentStack ? String(componentStack).slice(0, 1000) : null,
          url: url ? String(url).slice(0, 500) : null,
          userAgent: userAgent ? String(userAgent).slice(0, 300) : null,
          timestamp: ts,
          sourceHash,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[monitoring/error] Failed to log error:", err);
    return NextResponse.json(
      { error: "Failed to log error" },
      { status: 500 }
    );
  }
}
