import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { filterContent, isDuplicate } from "../content-filter";

// ── filterContent ──────────────────────────────────────────────────────────

describe("filterContent", () => {
  describe("profanity blocking", () => {
    it("returns null when content contains profanity", () => {
      const result = filterContent("What the fuck is going on", "voice_track");
      expect(result).toBeNull();
    });

    it("blocks content with slurs", () => {
      expect(filterContent("some text with retard in it", "voice_track")).toBeNull();
    });

    it("blocks case-insensitive profanity", () => {
      expect(filterContent("Oh SHIT that's great", "voice_track")).toBeNull();
    });

    it("allows clean content", () => {
      const result = filterContent("Great music coming up next!", "voice_track");
      expect(result).not.toBeNull();
      expect(result!.text).toBe("Great music coming up next!");
    });
  });

  describe("stage direction removal", () => {
    it("removes bracketed stage directions", () => {
      const result = filterContent("[laughs] Hey there folks!", "voice_track");
      expect(result).not.toBeNull();
      expect(result!.text).toBe("Hey there folks!");
    });

    it("removes parenthetical stage directions", () => {
      const result = filterContent("(pauses dramatically) Welcome back!", "voice_track");
      expect(result).not.toBeNull();
      expect(result!.text).toBe("Welcome back!");
    });

    it("removes asterisk-wrapped stage directions", () => {
      const result = filterContent("*sighs* It's a beautiful day.", "voice_track");
      expect(result).not.toBeNull();
      expect(result!.text).toBe("It's a beautiful day.");
    });

    it("removes multiple stage directions in one text", () => {
      const result = filterContent("[laughs] Great tune! (pauses) *smiles* More coming up.", "voice_track");
      expect(result).not.toBeNull();
      // Multiple removals may leave extra spaces; verify directions are gone
      expect(result!.text).not.toMatch(/\[.*\]/);
      expect(result!.text).not.toMatch(/\(.*\)/);
      expect(result!.text).not.toMatch(/\*.*\*/);
      expect(result!.text).toContain("Great tune!");
      expect(result!.text).toContain("More coming up.");
    });
  });

  describe("word limit enforcement", () => {
    it("enforces 50-word limit for voice_track", () => {
      const longText = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
      const result = filterContent(longText, "voice_track");

      expect(result).not.toBeNull();
      const wordCount = result!.text.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(51); // 50 words + possible period
      expect(result!.warnings).toContainEqual(expect.stringContaining("Truncated"));
    });

    it("enforces 100-word limit for feature", () => {
      const longText = Array.from({ length: 150 }, (_, i) => `word${i}`).join(" ");
      const result = filterContent(longText, "feature");

      expect(result).not.toBeNull();
      const words = result!.text.split(/\s+/);
      expect(words.length).toBeLessThanOrEqual(101);
    });

    it("enforces 60-word limit for ad", () => {
      const longText = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
      const result = filterContent(longText, "ad");

      expect(result).not.toBeNull();
      const words = result!.text.split(/\s+/);
      expect(words.length).toBeLessThanOrEqual(61);
    });

    it("adds period when truncation cuts mid-sentence", () => {
      const longText = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
      const result = filterContent(longText, "voice_track");

      expect(result).not.toBeNull();
      expect(result!.text).toMatch(/\.$/);
    });

    it("does not truncate content within the limit", () => {
      const shortText = "This is a short DJ break.";
      const result = filterContent(shortText, "voice_track");

      expect(result).not.toBeNull();
      expect(result!.text).toBe(shortText);
      expect(result!.warnings).toHaveLength(0);
    });
  });

  describe("duplicate sentence removal", () => {
    it("removes repeated sentences", () => {
      const result = filterContent(
        "Great music today. Great music today. Stay tuned.",
        "voice_track"
      );

      expect(result).not.toBeNull();
      expect(result!.text).toBe("Great music today. Stay tuned.");
      expect(result!.warnings).toContainEqual(expect.stringContaining("duplicate"));
    });

    it("preserves unique sentences", () => {
      const result = filterContent(
        "First sentence. Second sentence. Third sentence.",
        "voice_track"
      );

      expect(result).not.toBeNull();
      expect(result!.text).toBe("First sentence. Second sentence. Third sentence.");
      expect(result!.warnings).toHaveLength(0);
    });
  });

  describe("blocked patterns", () => {
    it("removes aggressive sales language from DJ content", () => {
      const result = filterContent("Buy now while supplies last!", "voice_track");
      expect(result).not.toBeNull();
      expect(result!.text).not.toMatch(/buy now/i);
      expect(result!.warnings.length).toBeGreaterThan(0);
    });

    it("removes phone numbers from non-ad content", () => {
      const result = filterContent("Call 555-1234 for more info", "voice_track");
      expect(result).not.toBeNull();
      expect(result!.text).not.toMatch(/call 555/i);
    });

    it("allows sales language in ad content", () => {
      const result = filterContent("Buy now at our store!", "ad");
      expect(result).not.toBeNull();
      expect(result!.text).toContain("Buy now");
    });

    it("allows phone numbers in ad content", () => {
      const result = filterContent("Call 555-1234 for a quote.", "ad");
      expect(result).not.toBeNull();
      expect(result!.text).toContain("Call 555");
    });
  });

  describe("edge cases", () => {
    it("handles empty string input", () => {
      const result = filterContent("", "voice_track");
      expect(result).not.toBeNull();
      expect(result!.text).toBe("");
    });

    it("handles whitespace-only input", () => {
      const result = filterContent("   ", "voice_track");
      expect(result).not.toBeNull();
      expect(result!.text).toBe("");
    });
  });
});

// ── isDuplicate ────────────────────────────────────────────────────────────

describe("isDuplicate", () => {
  it("detects identical content as duplicate", () => {
    const existing = ["Hello this is your DJ speaking"];
    expect(isDuplicate("Hello this is your DJ speaking", existing)).toBe(true);
  });

  it("detects near-duplicate content above threshold", () => {
    const existing = ["Welcome back to the show everyone it is a great day"];
    // Same words, slightly reordered/changed — high Jaccard similarity
    const similar = "Welcome back to the show everyone it is a wonderful day";
    expect(isDuplicate(similar, existing, 0.7)).toBe(true);
  });

  it("allows sufficiently different content", () => {
    const existing = ["Heavy metal thunder all night long"];
    const different = "Smooth jazz for your evening commute";
    expect(isDuplicate(different, existing)).toBe(false);
  });

  it("returns false for empty existing content list", () => {
    expect(isDuplicate("Any content here", [])).toBe(false);
  });

  it("handles single-word content", () => {
    expect(isDuplicate("hello", ["hello"])).toBe(true);
    expect(isDuplicate("hello", ["goodbye"])).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isDuplicate("HELLO WORLD", ["hello world"])).toBe(true);
  });

  it("respects custom threshold", () => {
    const existing = ["the quick brown fox jumps over the lazy dog"];
    const partial = "the quick brown fox";
    // With a low threshold, partial match is a duplicate
    expect(isDuplicate(partial, existing, 0.3)).toBe(true);
    // With a high threshold, partial match is not a duplicate
    expect(isDuplicate(partial, existing, 0.95)).toBe(false);
  });

  it("checks against all existing contents", () => {
    const existing = [
      "completely different topic about weather",
      "another unrelated sentence about food",
      "Welcome to the morning show friends", // this one is similar
    ];
    const similar = "Welcome to the morning show friends and listeners";
    expect(isDuplicate(similar, existing, 0.7)).toBe(true);
  });
});
