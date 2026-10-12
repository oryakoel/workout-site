import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, parsePrefs } from "./prefs.js";

const valid = { types: ["auto", "flexibility", "cardio"], minutes: [5, 10, 20] };

describe("parsePrefs", () => {
  it("returns the defaults when nothing is stored", () => {
    expect(parsePrefs(null, valid)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs("", valid)).toEqual(DEFAULT_PREFS);
  });

  it("returns the defaults for corrupt storage", () => {
    expect(parsePrefs("{not json", valid)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs("42", valid)).toEqual(DEFAULT_PREFS);
  });

  it("keeps valid saved choices", () => {
    const raw = JSON.stringify({ type: "cardio", minutes: 20, random: true });
    expect(parsePrefs(raw, valid)).toEqual({ type: "cardio", minutes: 20, random: true });
  });

  it("replaces only the values that are no longer valid", () => {
    const raw = JSON.stringify({ type: "deleted-type", minutes: 20, random: "yes" });
    expect(parsePrefs(raw, valid)).toEqual({ type: "auto", minutes: 20, random: false });
  });
});
