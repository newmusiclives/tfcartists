import { NextRequest, NextResponse } from "next/server";
import { fetchWeather, generateWeatherScript } from "@/lib/community/weather";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/weather
 * Fetch current weather and generate a DJ-readable script for a community station.
 *
 * Query params:
 *   lat          - latitude (required)
 *   lng          - longitude (required)
 *   stationName  - station name for the script (default: "your community radio station")
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const stationName = url.searchParams.get("stationName") || "your community radio station";

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 }
    );
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: "lat and lng must be valid numbers" },
      { status: 400 }
    );
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json(
      { error: "lat must be between -90 and 90, lng between -180 and 180" },
      { status: 400 }
    );
  }

  try {
    const weatherData = await fetchWeather(latitude, longitude);
    const script = generateWeatherScript(weatherData, stationName);

    return NextResponse.json({
      weather: weatherData,
      script,
      stationName,
      coordinates: { latitude, longitude },
    });
  } catch (error) {
    logger.error("[Weather API] Failed to fetch weather", { error, latitude, longitude });
    return NextResponse.json(
      { error: "Failed to fetch weather data", details: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}
