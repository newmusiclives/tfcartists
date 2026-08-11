import { NextResponse } from "next/server";
import { flag } from "@/lib/flags";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/coming-soon
 *
 * Whether the coming-soon gate is up. Middleware runs on the Edge and cannot
 * reach Prisma, so it asks this route for the database-backed flag value and
 * caches the answer for 30s.
 *
 * Public, and allowlisted through the gate — it has to be, or it would gate the
 * lookup that decides whether to gate. It discloses nothing the hold page
 * itself does not already make obvious.
 *
 * Note that when FLAG_COMING_SOON is set in the environment, middleware never
 * calls this: the env value wins outright.
 */
export async function GET() {
  const enabled = await flag("coming_soon");
  return NextResponse.json(
    { enabled },
    { headers: { "Cache-Control": "no-store" } }
  );
}
