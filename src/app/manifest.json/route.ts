import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Dynamic manifest.json route
 * Reads station name, colors, and branding from the database.
 * Falls back to environment variables, then static defaults.
 */
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
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Listen Now", short_name: "Listen", url: "/player", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Schedule", short_name: "Schedule", url: "/schedule" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600", // Cache 1 hour
    },
  });
}
