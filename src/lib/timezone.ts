/**
 * Station timezone utilities.
 *
 * The station operates on Mountain Time (America/Denver).
 * Servers (Netlify, Railway) run in UTC, so we must convert
 * before doing any hour-of-day or day-of-week logic.
 */

export const STATION_TIMEZONE = "America/Denver";

/** Returns the current date/time as seen in the station's timezone. */
export function stationNow(): Date {
  const utc = new Date();
  // Build an Intl formatter that gives us the parts in Mountain Time
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: STATION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    fmt.formatToParts(utc).map((p) => [p.type, p.value])
  );

  // Construct a Date that has Mountain Time values in its local fields.
  // We use Date.UTC so the resulting .getHours()/.getDay() etc. return
  // Mountain Time values (even though the Date object thinks it's UTC).
  return new Date(
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    )
  );
}

/** Current hour (0-23) in the station's timezone. */
export function stationHour(): number {
  return stationNow().getUTCHours();
}

/** Current day of week (0=Sun, 6=Sat) in the station's timezone. */
export function stationDayOfWeek(): number {
  return stationNow().getUTCDay();
}

/** Day type string for the station's current day. */
export function stationDayType(): "weekday" | "saturday" | "sunday" {
  const dow = stationDayOfWeek();
  return dow === 0 ? "sunday" : dow === 6 ? "saturday" : "weekday";
}

/** Returns a Date set to midnight (Mountain Time) of today, encoded as UTC. */
export function stationToday(): Date {
  const now = stationNow();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
