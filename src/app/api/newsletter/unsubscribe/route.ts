import { NextRequest, NextResponse } from "next/server";
import { unsubscribe, updatePreferences } from "@/lib/newsletter/newsletter-service";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const showPrefs = request.nextUrl.searchParams.get("prefs");
    if (showPrefs) {
      // Redirect to preferences page
      return NextResponse.redirect(
        new URL(`/newsletter/preferences?token=${token}`, request.url)
      );
    }

    const success = await unsubscribe(token);
    if (!success) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    }

    // Redirect to confirmation page
    return NextResponse.redirect(
      new URL("/newsletter/unsubscribed", request.url)
    );
  } catch (error) {
    return handleApiError(error, "/api/newsletter/unsubscribe");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, preferences } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    if (preferences) {
      const success = await updatePreferences(token, preferences);
      if (!success) {
        return NextResponse.json({ error: "Invalid token" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    const success = await unsubscribe(token);
    return NextResponse.json({ success });
  } catch (error) {
    return handleApiError(error, "/api/newsletter/unsubscribe");
  }
}
