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
    const raw = JSON.stringify({ type: "cardio", minutes: 20, random: true, weeklyGoal: 6 });
    expect(parsePrefs(raw, valid)).toEqual({ type: "cardio", minutes: 20, random: true, weeklyGoal: 6 });
  });

  it("replaces only the values that are no longer valid", () => {
    const raw = JSON.stringify({ type: "deleted-type", minutes: 20, random: "yes" });
    expect(parsePrefs(raw, valid)).toEqual({ type: "auto", minutes: 20, random: false, weeklyGoal: 4 });
  });

  it("defaults the weekly goal to 4 and only accepts 1 to 7", () => {
    expect(parsePrefs(JSON.stringify({ weeklyGoal: 3 }), valid).weeklyGoal).toBe(3);
    for (const bad of [0, 8, 2.5, "4", null]) {
      expect(parsePrefs(JSON.stringify({ weeklyGoal: bad }), valid).weeklyGoal).toBe(4);
    }
    expect(parsePrefs(null, valid).weeklyGoal).toBe(4);
  });
});
