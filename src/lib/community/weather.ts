/**
 * Weather Integration for Community Radio Stations
 *
 * Uses Open-Meteo (free, no API key required) to fetch current weather
 * and generate DJ-readable weather announcement scripts.
 */

import { logger } from "@/lib/logger";

export interface WeatherData {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  is_day: boolean;
  time: string;
}

interface OpenMeteoResponse {
  current_weather: WeatherData;
  latitude: number;
  longitude: number;
  timezone: string;
}

/**
 * Map WMO weather codes to human-readable descriptions.
 * See: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
 */
function describeWeatherCode(code: number): string {
  const descriptions: Record<number, string> = {
    0: "clear skies",
    1: "mostly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "foggy",
    48: "foggy with rime",
    51: "light drizzle",
    53: "moderate drizzle",
    55: "heavy drizzle",
    56: "light freezing drizzle",
    57: "heavy freezing drizzle",
    61: "light rain",
    63: "moderate rain",
    65: "heavy rain",
    66: "light freezing rain",
    67: "heavy freezing rain",
    71: "light snowfall",
    73: "moderate snowfall",
    75: "heavy snowfall",
    77: "snow grains",
    80: "light rain showers",
    81: "moderate rain showers",
    82: "heavy rain showers",
    85: "light snow showers",
    86: "heavy snow showers",
    95: "thunderstorms",
    96: "thunderstorms with light hail",
    99: "thunderstorms with heavy hail",
  };
  return descriptions[code] || "variable conditions";
}

/**
 * Convert Celsius to Fahrenheit
 */
function celsiusToFahrenheit(celsius: number): number {
  return Math.round(celsius * 9 / 5 + 32);
}

/**
 * Get a time-of-day greeting based on the hour
 */
function getGreeting(isDay: boolean): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (isDay) return "Good evening";
  return "Good evening";
}

/**
 * Fetch current weather data from Open-Meteo
 */
export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("current_weather", "true");
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("windspeed_unit", "mph");

  logger.debug("[Weather] Fetching weather", { latitude, longitude, url: url.toString() });

  const res = await fetch(url.toString(), {
    next: { revalidate: 600 }, // Cache for 10 minutes
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("[Weather] Open-Meteo API error", { status: res.status, body: text });
    throw new Error(`Open-Meteo API returned ${res.status}: ${text}`);
  }

  const data: OpenMeteoResponse = await res.json();
  return data.current_weather;
}

/**
 * Generate a DJ-readable weather announcement script
 */
export function generateWeatherScript(
  weatherData: WeatherData,
  stationName: string
): string {
  const greeting = getGreeting(weatherData.is_day);
  const tempF = celsiusToFahrenheit(weatherData.temperature);
  const description = describeWeatherCode(weatherData.weathercode);
  const windMph = Math.round(weatherData.windspeed);

  let script = `${greeting} from ${stationName}! It's currently ${tempF} degrees and ${description} in your area.`;

  // Add wind info if notable
  if (windMph > 10) {
    script += ` Winds are blowing at ${windMph} miles per hour.`;
  } else if (windMph > 0) {
    script += ` Light winds at ${windMph} miles per hour.`;
  }

  // Add contextual flavor
  if (tempF >= 90) {
    script += " Stay cool and hydrated out there, folks!";
  } else if (tempF <= 32) {
    script += " Bundle up out there, it's cold!";
  } else if (tempF >= 70 && tempF <= 80 && weatherData.weathercode <= 1) {
    script += " Beautiful weather to enjoy some great music!";
  }

  return script;
}
