import { describe, expect, it } from "vitest";
import {
  addDays,
  computeConsistency,
  daysLabel,
  gardenFor,
  plantLabel,
  startOfWeek,
} from "./consistency.js";

// Local-time helpers, so the tests hold in any time zone.
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0);
const iso = (date) => date.toISOString();

// 2026-10-11 is a Sunday.
const SUN = at(2026, 10, 11);
const sessionOn = (date, status = "completed") => ({ completed_at: iso(date), status });
const week = (sunday, ...offsets) => offsets.map((o) => sessionOn(addDays(sunday, o)));

describe("weeks", () => {
  it("start on Sunday", () => {
    expect(startOfWeek(at(2026, 10, 14)).getDay()).toBe(0);
    expect(startOfWeek(at(2026, 10, 14)).getDate()).toBe(11);
    expect(startOfWeek(at(2026, 10, 11)).getDate()).toBe(11);
    expect(startOfWeek(at(2026, 10, 17)).getDate()).toBe(11);
  });

  it("have natural Hebrew day counts", () => {
    expect(daysLabel(1)).toBe("יום אחד");
    expect(daysLabel(2)).toBe("יומיים");
    expect(daysLabel(3)).toBe("3 ימים");
  });
});

describe("the current week", () => {
  const now = at(2026, 10, 14); // Wednesday

  it("marks each day done, partial, none and future", () => {
    const entries = [sessionOn(at(2026, 10, 11)), sessionOn(at(2026, 10, 12), "partial")];
    const { thisWeek } = computeConsistency(entries, { goal: 4, now });
    expect(thisWeek.days.map((d) => d.status)).toEqual(["done", "partial", "none", "none", "none", "none", "none"]);
    expect(thisWeek.days.map((d) => d.isToday)).toEqual([false, false, false, true, false, false, false]);
    expect(thisWeek.days.map((d) => d.isFuture)).toEqual([false, false, false, false, true, true, true]);
  });

  it("counts only completed days toward the goal, and a day once however many sessions", () => {
    const entries = [
      sessionOn(at(2026, 10, 11, 8)),
      sessionOn(at(2026, 10, 11, 19)),
      sessionOn(at(2026, 10, 12), "partial"),
      { completed_at: iso(at(2026, 10, 13)) }, // an old row with no status
    ];
    const { thisWeek } = computeConsistency(entries, { goal: 4, now });
    expect(thisWeek.done).toBe(2);
    expect(thisWeek.remaining).toBe(2);
    expect(thisWeek.met).toBe(false);
  });

  it("knows how many days are left, today included", () => {
    expect(computeConsistency([], { goal: 4, now: at(2026, 10, 14) }).thisWeek.daysLeft).toBe(4);
    expect(computeConsistency([], { goal: 4, now: at(2026, 10, 11) }).thisWeek.daysLeft).toBe(7);
    expect(computeConsistency([], { goal: 4, now: at(2026, 10, 17) }).thisWeek.daysLeft).toBe(1);
  });

  it("a partial session never counts as a trained day, even a second one", () => {
    const { thisWeek } = computeConsistency([sessionOn(at(2026, 10, 12), "partial"), sessionOn(at(2026, 10, 12), "partial")], { goal: 4, now });
    expect(thisWeek.done).toBe(0);
  });
});

describe("plant stage, replaying finished weeks", () => {
  const nextWeek = at(2026, 10, 18);

  it("grows a stage for each week the goal was met", () => {
    const entries = [...week(addDays(SUN, -14), 0, 1, 2), ...week(addDays(SUN, -7), 1, 3, 5)];
    const c = computeConsistency(entries, { goal: 3, now: SUN });
    expect(c.stage).toBe(2);
    expect(c.goalWeeks).toBe(2);
    expect(c.weeksInARow).toBe(2);
  });

  it("leaves the stage alone for a week of some activity that misses the goal", () => {
    const entries = [...week(addDays(SUN, -14), 0, 1, 2), ...week(addDays(SUN, -7), 3)];
    const c = computeConsistency(entries, { goal: 3, now: SUN });
    expect(c.stage).toBe(1);
    expect(c.weeksInARow).toBe(0);
  });

  it("a completely missed week costs exactly one stage", () => {
    const entries = [...week(addDays(SUN, -21), 0, 1, 2), ...week(addDays(SUN, -14), 0, 1, 2)]; // two goal weeks, then one empty week
    const c = computeConsistency(entries, { goal: 3, now: SUN });
    expect(c.stage).toBe(1);
  });

  it("never drops below zero, however long the absence", () => {
    const c = computeConsistency(week(addDays(SUN, -70), 0, 1, 2, 3), { goal: 3, now: SUN });
    expect(c.stage).toBe(0);
    expect(c.goalWeeks).toBe(1);
  });

  it("does not count weeks before the first session against anyone", () => {
    const c = computeConsistency(week(SUN, 0), { goal: 4, now: at(2026, 10, 14) });
    expect(c.stage).toBe(0);
    expect(c.condition).toBe("growing");
  });

  it("the week in progress only ever adds: progress rises with each trained day", () => {
    const now = at(2026, 10, 14);
    expect(computeConsistency(week(SUN, 0), { goal: 4, now }).progress).toBe(0.25);
    expect(computeConsistency(week(SUN, 0, 1), { goal: 4, now }).level).toBeCloseTo(0.5);
    const met = computeConsistency(week(SUN, 0, 1, 2, 3), { goal: 4, now });
    expect(met.progress).toBe(1);
    expect(met.goalWeeks).toBe(1);
    expect(met.thisWeek.met).toBe(true);
  });

  it("when the goal-meeting week ends, the same growth is kept", () => {
    const entries = week(SUN, 0, 1, 2, 3);
    const during = computeConsistency(entries, { goal: 4, now: at(2026, 10, 15) });
    const after = computeConsistency(entries, { goal: 4, now: nextWeek });
    expect(during.level).toBe(1);
    expect(after.stage).toBe(1);
    expect(after.weeksInARow).toBe(1);
  });

  it("an unfinished week does not break the run of goal weeks", () => {
    const entries = [...week(addDays(SUN, -14), 0, 1, 2), ...week(addDays(SUN, -7), 0, 1, 2)];
    const c = computeConsistency(entries, { goal: 3, now: SUN });
    expect(c.weeksInARow).toBe(2);
    expect(c.bestWeeksInARow).toBe(2);
  });

  it("remembers the best run after a gap", () => {
    const entries = [
      ...week(addDays(SUN, -28), 0, 1, 2),
      ...week(addDays(SUN, -21), 0, 1, 2),
      ...week(addDays(SUN, -14), 0, 1, 2),
      ...week(addDays(SUN, -7), 0),
    ];
    const c = computeConsistency(entries, { goal: 3, now: SUN });
    expect(c.weeksInARow).toBe(0);
    expect(c.bestWeeksInARow).toBe(3);
  });

  it("judges every week against the current goal", () => {
    const entries = week(addDays(SUN, -7), 0, 1, 2);
    expect(computeConsistency(entries, { goal: 3, now: SUN }).stage).toBe(1);
    expect(computeConsistency(entries, { goal: 5, now: SUN }).stage).toBe(0);
  });
});

describe("plant condition", () => {
  const now = at(2026, 10, 14);

  it("is a seed until there is a completed session", () => {
    expect(computeConsistency([], { now }).condition).toBe("seed");
    expect(computeConsistency([sessionOn(at(2026, 10, 13), "partial")], { now }).condition).toBe("seed");
  });

  it("droops after more than a week without a session, and one session revives it", () => {
    const old = [sessionOn(at(2026, 10, 4))]; // 10 days ago
    expect(computeConsistency(old, { now }).condition).toBe("wilting");
    expect(computeConsistency([...old, sessionOn(at(2026, 10, 14))], { now }).condition).not.toBe("wilting");
  });

  it("does not droop at exactly a week", () => {
    expect(computeConsistency([sessionOn(at(2026, 10, 7))], { now }).condition).not.toBe("wilting");
  });

  it("thrives in a week the goal is met", () => {
    expect(computeConsistency(week(SUN, 0, 1, 2), { goal: 3, now }).condition).toBe("thriving");
  });
});

describe("recent weeks", () => {
  it("lists eight weeks ending with the current one", () => {
    const { recentWeeks } = computeConsistency(week(SUN, 0, 1), { goal: 2, now: at(2026, 10, 14) });
    expect(recentWeeks).toHaveLength(8);
    expect(recentWeeks[7]).toMatchObject({ done: 2, met: true, isCurrent: true });
    expect(recentWeeks[0].isCurrent).toBe(false);
  });
});

describe("the garden", () => {
  it("accumulates without a ceiling and never shrinks as weeks pass", () => {
    expect(gardenFor(0)).toEqual({ flowers: 0, butterflies: 0, trees: 0, sun: false });
    expect(gardenFor(3).flowers).toBe(0);
    expect(gardenFor(4).flowers).toBe(1);
    expect(gardenFor(17)).toMatchObject({ flowers: 4, butterflies: 1, trees: 0 });
    expect(gardenFor(26).trees).toBe(1);
    expect(gardenFor(52)).toMatchObject({ flowers: 13, butterflies: 4, trees: 2, sun: true });
    expect(gardenFor(520).flowers).toBe(130);
  });

  it("is kept even when the plant itself wilts", () => {
    const entries = [];
    for (let w = 12; w >= 6; w--) entries.push(...week(addDays(SUN, -7 * w), 0, 1, 2));
    const c = computeConsistency(entries, { goal: 3, now: SUN });
    expect(c.goalWeeks).toBe(7);
    expect(c.garden.flowers).toBe(1);
    expect(c.condition).toBe("wilting");
    expect(c.stage).toBeLessThan(c.goalWeeks);
  });
});

describe("plantLabel", () => {
  it("describes the plant in words", () => {
    const now = at(2026, 10, 14);
    expect(plantLabel(computeConsistency([], { now }))).toBe("זרע בעציץ, מחכה לאימון הראשון");
    expect(plantLabel(computeConsistency([sessionOn(at(2026, 10, 4))], { now }))).toBe("צמח נבול");
    expect(plantLabel(computeConsistency(week(SUN, 0, 1), { goal: 4, now }))).toMatch(/^צמח בשלב \d+$/);
  });
});
