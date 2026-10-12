import { describe, expect, it } from "vitest";
import { pickBestHebrewVoice } from "./voicePick.js";
import { CUE_PATTERNS, cuePattern } from "./cues.js";

const voice = (name, lang, localService = true) => ({ name, lang, localService });

describe("pickBestHebrewVoice", () => {
  it("returns null when the device has no Hebrew voice", () => {
    expect(pickBestHebrewVoice([voice("Samantha", "en-US"), voice("Amelie", "fr-FR")])).toBeNull();
    expect(pickBestHebrewVoice([])).toBeNull();
  });

  it("recognises he-IL, he_IL and the legacy iw-IL code", () => {
    expect(pickBestHebrewVoice([voice("A", "he-IL")])?.name).toBe("A");
    expect(pickBestHebrewVoice([voice("B", "he_IL")])?.name).toBe("B");
    expect(pickBestHebrewVoice([voice("C", "iw-IL")])?.name).toBe("C");
  });

  it("prefers an Enhanced/Premium voice over the default one", () => {
    const picked = pickBestHebrewVoice([voice("Carmit", "he-IL"), voice("Carmit (Enhanced)", "he-IL")]);
    expect(picked.name).toBe("Carmit (Enhanced)");
  });

  it("prefers an on-device voice over a network one so cues work offline", () => {
    const picked = pickBestHebrewVoice([
      voice("Google עברית", "he-IL", false),
      voice("Device Hebrew", "he-IL", true),
    ]);
    expect(picked.name).toBe("Device Hebrew");
  });

  it("keeps the first voice when nothing separates them", () => {
    const picked = pickBestHebrewVoice([voice("First", "he-IL"), voice("Second", "he-IL")]);
    expect(picked.name).toBe("First");
  });
});

describe("cue patterns", () => {
  it("defines a distinct pattern for every announcement kind", () => {
    for (const kind of ["prep", "rest", "exercise", "side", "tenSeconds", "done"]) {
      expect(CUE_PATTERNS[kind].length).toBeGreaterThan(0);
    }
    expect(new Set(Object.values(CUE_PATTERNS).map((p) => JSON.stringify(p))).size).toBe(Object.keys(CUE_PATTERNS).length);
  });

  it("uses positive frequencies and durations, with offsets in order", () => {
    for (const pattern of Object.values(CUE_PATTERNS)) {
      let lastOffset = -1;
      for (const [freq, offset, dur] of pattern) {
        expect(freq).toBeGreaterThan(0);
        expect(dur).toBeGreaterThan(0);
        expect(offset).toBeGreaterThan(lastOffset);
        lastOffset = offset;
      }
    }
  });

  it("returns an empty pattern for an unknown kind", () => {
    expect(cuePattern("nope")).toEqual([]);
  });
});
