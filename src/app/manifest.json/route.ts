import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Dynamic manifest.json route
 * Reads station name, colors, and branding from the database.
 * Falls back to environment variables, then static defaults.
 *
 * Until now this route was unreachable: a static public/manifest.json shadowed
 * it, so production served the static copy and the two drifted apart. The
 * static file is gone; this is the only manifest.
 */

// Re-read the station branding hourly rather than baking it in at build time.
// Without this the route is statically evaluated once during the build, which
// would make a "dynamic" manifest that never changes after deploy.
export const revalidate = 3600;

export async function GET() {
  // Try to fetch the first active station for branding
  let name = process.env.NEXT_PUBLIC_STATION_NAME || "North Country Radio";
  let shortName = process.env.NEXT_PUBLIC_STATION_CALL_SIGN || "NCR Radio";
  let description = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "AI-Powered Independent Radio";
  let themeColor = process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#78350f";

  try {
    const station = await prisma.station.findFirst({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { name: true, callSign: true, tagline: true, primaryColor: true, genre: true },
    });

    if (station) {
      name = station.name;
      shortName = station.callSign ? `${station.callSign} Radio` : station.name;
      description = station.tagline || `${station.genre} — TrueFans RADIO Network`;
      themeColor = station.primaryColor || themeColor;
    }
  } catch {
    // DB unavailable — use defaults
  }

  const manifest = {
    name,
    short_name: shortName,
    description,
    start_url: "/player",
    scope: "/",
    display: "standalone",
    background_color: themeColor,
    theme_color: themeColor,
    orientation: "portrait",
    categories: ["music", "entertainment"],
    prefer_related_applications: false,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Listen Now", short_name: "Listen", url: "/player", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Schedule", short_name: "Schedule", url: "/schedule" },
      { name: "Submit Music", short_name: "Submit", url: "/onboard" },
    ],
    // GET, not POST. The static manifest declared a multipart POST target, but
    // /onboard is a page with no POST handler, so every share would have hit a
    // 405. As a GET target the shared title/text/url arrive as query params and
    // the worst case is that the onboarding page ignores them.
    share_target: {
      action: "/onboard",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600", // Cache 1 hour
    },
  });
}
