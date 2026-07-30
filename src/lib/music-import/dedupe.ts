/**
 * Duplicate detection for imported music.
 *
 * The same artist or track will be uploaded twice - from a re-run export, a
 * manual upload, or the same song appearing under a slightly different title.
 * Three keys are checked, strongest first, because each catches a different
 * kind of repeat:
 *
 *   1. ISRC                       globally unique, but often absent
 *   2. sourceSystem+sourceTrackId stable across re-imports from one system
 *   3. dedupeKey                  normalised artist+title, catches manual repeats
 *
 * Normalisation is deliberately aggressive. "The Dirt Drifters - Something Better
 * (Radio Edit)" and "Dirt Drifters — Something Better" are the same recording for
 * a radio library, and treating them as two songs means the rotation plays the
 * same track twice in an hour.
 */

/** Words that change nothing about which recording this is. */
const NOISE_SUFFIXES = [
  "radio edit",
  "radio version",
  "album version",
  "single version",
  "original mix",
  "explicit",
  "clean",
  "remastered",
  "remaster",
  "mono",
  "stereo",
];

export function normaliseForDedupe(value: string): string {
  let v = value.toLowerCase().trim();

  // Strip bracketed qualifiers that do not change the recording's identity
  v = v.replace(/[([{][^)\]}]*[)\]}]/g, (match) => {
    const inner = match.slice(1, -1).trim().toLowerCase();
    return NOISE_SUFFIXES.some((n) => inner.includes(n)) ? "" : match;
  });

  // "feat." variants: everything after is a credit, not part of the title
  v = v.replace(/\s+(feat\.?|ft\.?|featuring|with)\s+.*$/i, "");

  // Unify punctuation and whitespace. Dashes in particular vary wildly between
  // exports (hyphen, en dash, em dash) and would otherwise defeat matching.
  v = v
    .replace(/[‐-―]/g, "-")
    .replace(/["'`‘’“”]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  // A leading article is not identity
  v = v.replace(/^(the|a|an)\s+/, "");

  return v;
}

/** Stable key for "is this the same recording by the same artist". */
export function buildDedupeKey(artistName: string, title: string): string {
  return `${normaliseForDedupe(artistName)}|${normaliseForDedupe(title)}`;
}

export type MatchReason = "isrc" | "source_id" | "artist_title" | null;

export interface DuplicateCandidate {
  id: string;
  isrc: string | null;
  sourceSystem: string | null;
  sourceTrackId: string | null;
  dedupeKey: string | null;
}

/**
 * Decide whether an incoming track matches something already in the library.
 * Returns the match and WHY it matched, so an operator can audit the decision
 * rather than trusting a silent merge.
 */
export function findDuplicate(
  incoming: {
    isrc?: string | null;
    sourceSystem?: string | null;
    sourceTrackId?: string | null;
    dedupeKey: string;
  },
  existing: DuplicateCandidate[]
): { match: DuplicateCandidate; reason: MatchReason } | null {
  if (incoming.isrc) {
    const byIsrc = existing.find((e) => e.isrc && e.isrc === incoming.isrc);
    if (byIsrc) return { match: byIsrc, reason: "isrc" };
  }

  if (incoming.sourceSystem && incoming.sourceTrackId) {
    const bySource = existing.find(
      (e) =>
        e.sourceSystem === incoming.sourceSystem &&
        e.sourceTrackId === incoming.sourceTrackId
    );
    if (bySource) return { match: bySource, reason: "source_id" };
  }

  const byName = existing.find((e) => e.dedupeKey && e.dedupeKey === incoming.dedupeKey);
  if (byName) return { match: byName, reason: "artist_title" };

  return null;
}
