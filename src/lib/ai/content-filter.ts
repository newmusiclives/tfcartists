import { logger } from "@/lib/logger";

const MAX_VOICE_TRACK_WORDS = 50;
const MAX_FEATURE_WORDS = 100;
const MAX_AD_WORDS = 60;

// Words that should never appear in radio content
const BLOCKED_WORDS = [
  // Profanity list (keep short — AI providers have their own filters)
  "fuck", "shit", "ass", "damn", "hell", "bitch", "bastard", "crap",
  // Slurs and offensive terms
  "nigger", "faggot", "retard",
];

const BLOCKED_PATTERNS = [
  /\b(buy|purchase|order)\s+(now|today)\b/i, // Aggressive sales language in DJ talk
  /\b(call|text|dial)\s+\d{3}/i, // Phone numbers (should be in ads only)
];

/**
 * Filter AI-generated content for safety and quality.
 * Returns cleaned content or null if content should be rejected.
 */
export function filterContent(
  content: string,
  type: "voice_track" | "feature" | "ad" | "imaging"
): { text: string; warnings: string[] } | null {
  const warnings: string[] = [];
  let text = content.trim();

  // Remove stage directions [laughs], (pauses), *sighs*
  text = text.replace(/[\[\(][^\]\)]*[\]\)]/g, "").trim();
  text = text.replace(/\*[^*]*\*/g, "").trim();

  // Check for blocked words
  const lowerText = text.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lowerText.includes(word)) {
      logger.warn("Content blocked: profanity detected", { type, word });
      return null;
    }
  }

  // Check blocked patterns (only for non-ad content)
  if (type !== "ad") {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(text)) {
        warnings.push(`Pattern removed: ${pattern.source}`);
        text = text.replace(pattern, "").trim();
      }
    }
  }

  // Enforce word limits
  const words = text.split(/\s+/);
  const maxWords = type === "voice_track" ? MAX_VOICE_TRACK_WORDS
    : type === "feature" ? MAX_FEATURE_WORDS
    : type === "ad" ? MAX_AD_WORDS : MAX_VOICE_TRACK_WORDS;

  if (words.length > maxWords) {
    warnings.push(`Truncated from ${words.length} to ${maxWords} words`);
    text = words.slice(0, maxWords).join(" ");
    // Add natural ending if truncated mid-sentence
    if (!text.match(/[.!?]$/)) text += ".";
  }

  // Remove duplicate content (repeated sentences)
  const sentences = text.split(/(?<=[.!?])\s+/);
  const unique = [...new Set(sentences)];
  if (unique.length < sentences.length) {
    warnings.push(`Removed ${sentences.length - unique.length} duplicate sentences`);
    text = unique.join(" ");
  }

  return { text, warnings };
}

/**
 * Check if content is too similar to existing content (duplicate detection).
 * Uses simple Jaccard similarity on word sets.
 */
export function isDuplicate(newContent: string, existingContents: string[], threshold = 0.8): boolean {
  const newWords = new Set(newContent.toLowerCase().split(/\s+/));

  for (const existing of existingContents) {
    const existingWords = new Set(existing.toLowerCase().split(/\s+/));
    const intersection = new Set([...newWords].filter(w => existingWords.has(w)));
    const union = new Set([...newWords, ...existingWords]);
    const similarity = intersection.size / union.size;

    if (similarity >= threshold) return true;
  }

  return false;
}
