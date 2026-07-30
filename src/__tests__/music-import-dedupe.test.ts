import { describe, it, expect } from "vitest";
import {
  normaliseForDedupe,
  buildDedupeKey,
  findDuplicate,
} from "@/lib/music-import/dedupe";

/**
 * Both failure directions cost something real:
 *   - a missed duplicate means the same recording plays twice in a rotation
 *   - a false match means a genuinely different song is silently overwritten
 * So the tests assert both.
 */

describe("normaliseForDedupe", () => {
  it("ignores case, punctuation and spacing", () => {
    expect(normaliseForDedupe("The Dirt Drifters")).toBe(
      normaliseForDedupe("the   dirt-drifters")
    );
  });

  it("treats the various dash characters as equivalent", () => {
    const hyphen = normaliseForDedupe("Rock - Roll");
    expect(normaliseForDedupe("Rock – Roll")).toBe(hyphen); // en dash
    expect(normaliseForDedupe("Rock — Roll")).toBe(hyphen); // em dash
  });

  it("drops qualifiers that do not change the recording", () => {
    const base = normaliseForDedupe("Something Better");
    expect(normaliseForDedupe("Something Better (Radio Edit)")).toBe(base);
    expect(normaliseForDedupe("Something Better [Remastered]")).toBe(base);
    expect(normaliseForDedupe("Something Better (Album Version)")).toBe(base);
  });

  it("keeps qualifiers that DO change the recording", () => {
    // A live take or a remix is a different recording and must stay distinct
    expect(normaliseForDedupe("Something Better (Live at Red Rocks)")).not.toBe(
      normaliseForDedupe("Something Better")
    );
    expect(normaliseForDedupe("Something Better (Acoustic)")).not.toBe(
      normaliseForDedupe("Something Better")
    );
  });

  it("strips featured-artist credits", () => {
    const base = normaliseForDedupe("A-11");
    expect(normaliseForDedupe("A-11 feat. Ronnie Dunn")).toBe(base);
    expect(normaliseForDedupe("A-11 ft Ronnie Dunn")).toBe(base);
    expect(normaliseForDedupe("A-11 featuring Ronnie Dunn")).toBe(base);
  });

  it("ignores a leading article and unifies ampersands", () => {
    expect(normaliseForDedupe("The Band")).toBe(normaliseForDedupe("Band"));
    expect(normaliseForDedupe("Hall & Oates")).toBe(normaliseForDedupe("Hall and Oates"));
  });

  it("does not collapse genuinely different titles", () => {
    expect(normaliseForDedupe("Love You Like That")).not.toBe(
      normaliseForDedupe("Love You Like This")
    );
  });
});

describe("buildDedupeKey", () => {
  it("separates artist from title so a swap is not a match", () => {
    expect(buildDedupeKey("Hank", "Roses")).not.toBe(buildDedupeKey("Roses", "Hank"));
  });

  it("matches the same song written differently", () => {
    expect(buildDedupeKey("The Dirt Drifters", "Something Better (Radio Edit)")).toBe(
      buildDedupeKey("Dirt Drifters", "Something Better")
    );
  });
});

describe("findDuplicate", () => {
  const existing = [
    {
      id: "song-1",
      isrc: "USABC1234567",
      sourceSystem: "truefans-label-music-factory",
      sourceTrackId: "track-aaa",
      dedupeKey: buildDedupeKey("Lower 40", "Dust and Gold"),
    },
    {
      id: "song-2",
      isrc: null,
      sourceSystem: null,
      sourceTrackId: null,
      dedupeKey: buildDedupeKey("Callahan Divide", "Backroad Hymn"),
    },
  ];

  it("matches on ISRC first, even when the title differs", () => {
    const hit = findDuplicate(
      {
        isrc: "USABC1234567",
        sourceSystem: "other",
        sourceTrackId: "zzz",
        dedupeKey: buildDedupeKey("Completely Different", "Name"),
      },
      existing
    );
    expect(hit?.match.id).toBe("song-1");
    expect(hit?.reason).toBe("isrc");
  });

  it("matches a re-import on source id when there is no ISRC", () => {
    const hit = findDuplicate(
      {
        isrc: null,
        sourceSystem: "truefans-label-music-factory",
        sourceTrackId: "track-aaa",
        dedupeKey: buildDedupeKey("Lower 40", "Dust and Gold (Remastered)"),
      },
      existing
    );
    expect(hit?.match.id).toBe("song-1");
    expect(hit?.reason).toBe("source_id");
  });

  it("falls back to normalised artist+title for a manual re-upload", () => {
    const hit = findDuplicate(
      {
        isrc: null,
        sourceSystem: null,
        sourceTrackId: null,
        dedupeKey: buildDedupeKey("The Callahan Divide", "Backroad Hymn (Radio Edit)"),
      },
      existing
    );
    expect(hit?.match.id).toBe("song-2");
    expect(hit?.reason).toBe("artist_title");
  });

  it("returns null for a genuinely new track", () => {
    const hit = findDuplicate(
      {
        isrc: "USXYZ9999999",
        sourceSystem: "truefans-label-music-factory",
        sourceTrackId: "track-new",
        dedupeKey: buildDedupeKey("North 40", "Prairie Light"),
      },
      existing
    );
    expect(hit).toBeNull();
  });

  it("does not match a different song by the same artist", () => {
    const hit = findDuplicate(
      {
        isrc: null,
        sourceSystem: null,
        sourceTrackId: null,
        dedupeKey: buildDedupeKey("Lower 40", "A Totally Different Song"),
      },
      existing
    );
    expect(hit).toBeNull();
  });
});
