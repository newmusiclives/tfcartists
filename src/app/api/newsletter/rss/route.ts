import { NextRequest, NextResponse } from "next/server";
import { generateNowPlayingRss } from "@/lib/newsletter/newsletter-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get("orgId") || undefined;
    const rss = await generateNowPlayingRss(orgId);

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300", // 5 min cache
      },
    });
  } catch {
    return new NextResponse("RSS feed unavailable", { status: 500 });
  }
}
