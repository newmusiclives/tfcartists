import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";
import {
  generateWeeklyDigest,
  generateArtistSpotlight,
  sendNewsletter,
} from "@/lib/newsletter/newsletter-service";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/newsletter/send
 * Manually trigger a newsletter send (admin only).
 * Body: { type: "weekly_digest" | "artist_spotlight" }
 */
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorized();

    const body = await request.json();
    const { type, organizationId } = body;

    if (!type || !["weekly_digest", "artist_spotlight"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'weekly_digest' or 'artist_spotlight'" },
        { status: 400 }
      );
    }

    const orgId = session.user.organizationId || organizationId || undefined;

    if (type === "weekly_digest") {
      const digest = await generateWeeklyDigest(orgId);
      const result = await sendNewsletter({
        type: "weekly_digest",
        subject: digest.subject,
        htmlContent: digest.html,
        textContent: digest.text,
        organizationId: orgId,
        preferenceKey: "weeklyDigest",
      });
      return NextResponse.json({ ...result, subject: digest.subject });
    }

    if (type === "artist_spotlight") {
      const spotlight = await generateArtistSpotlight(orgId);
      if (!spotlight) {
        return NextResponse.json(
          { error: "No activated artists found for spotlight" },
          { status: 404 }
        );
      }
      const result = await sendNewsletter({
        type: "artist_spotlight",
        subject: spotlight.subject,
        htmlContent: spotlight.html,
        textContent: spotlight.text,
        organizationId: orgId,
        preferenceKey: "artistSpotlight",
      });
      return NextResponse.json({ ...result, subject: spotlight.subject });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    return handleApiError(error, "/api/newsletter/send");
  }
}
