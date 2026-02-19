/**
 * Shared template utilities for feature content and voice track generation.
 * Extracted from features-daily cron for reuse.
 */

const LISTENER_NAMES = ["Jake", "Maggie", "Earl", "Sadie", "Beau", "Jolene", "Waylon", "Rosie"];
const INSTRUMENTS = ["guitar", "fiddle", "banjo", "mandolin", "pedal steel", "harmonica", "dobro", "upright bass"];
const THEMES = ["feel-good classics", "heartbreak anthems", "road trip songs", "front-porch favorites", "honky-tonk hits", "Sunday morning soul"];
const WEATHER_PHRASES = ["sunny and clear", "a little overcast", "cool and breezy", "warm with blue skies", "crisp and bright"];

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function todayFormatted(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function todayDayName(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

export function djFirstName(fullName: string): string {
  return fullName.split(" ")[0] || fullName;
}

export interface SongData {
  id: string;
  artistName: string;
  title: string;
  genre: string | null;
  album: string | null;
}

export function fillTemplate(template: string, dj: string, song?: SongData): string {
  let script = template;
  const artistName = song?.artistName || "a rising artist";
  const songTitle = song?.title || "a great track";
  const genre = song?.genre || "Americana";
  const albumTitle = song?.album || "the album";

  script = script.replace(/\{artist_name\}/g, artistName);
  script = script.replace(/\{artist\}/g, artistName);
  script = script.replace(/\{song_title\}/g, songTitle);
  script = script.replace(/\{genre\}/g, genre);
  script = script.replace(/\{genre1\}/g, genre);
  script = script.replace(/\{genre2\}/g, "Country");
  script = script.replace(/\{dj_name\}/g, dj);
  script = script.replace(/\{date\}/g, todayFormatted());
  script = script.replace(/\{album_title\}/g, albumTitle);
  script = script.replace(/\{songwriter\}/g, artistName);
  script = script.replace(/\{producer\}/g, artistName);
  script = script.replace(/\{original_artist\}/g, artistName);
  script = script.replace(/\{cover_artist\}/g, "a fellow artist");
  script = script.replace(/\{listener_name\}/g, pick(LISTENER_NAMES));
  script = script.replace(/\{instrument\}/g, pick(INSTRUMENTS));
  script = script.replace(/\{year\}/g, String(new Date().getFullYear()));
  script = script.replace(/\{topic\}/g, "music and life");
  script = script.replace(/\{theme\}/g, pick(THEMES));
  script = script.replace(/\{weather\}/g, pick(WEATHER_PHRASES));
  script = script.replace(/\{from_name\}/g, "a fan");
  script = script.replace(/\{to_name\}/g, "someone special");
  script = script.replace(/\{message\}/g, "thinking of you");
  script = script.replace(/\{day_name\}/g, todayDayName());

  return script;
}
