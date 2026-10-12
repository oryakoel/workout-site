import { describe, expect, it } from "vitest";
import { EXERCISES } from "./exercises.js";
import { EXERCISE_META, GOAL_LABELS, LOAD_LABELS, PHASE_ORDER, POSITION_ORDER } from "./exerciseMeta.js";

describe("exercise metadata", () => {
  it("covers every exercise, and nothing that doesn't exist", () => {
    const ids = EXERCISES.map((e) => e.id).sort();
    expect(Object.keys(EXERCISE_META).sort()).toEqual(ids);
  });

  it("uses only known values", () => {
    for (const [id, m] of Object.entries(EXERCISE_META)) {
      expect(PHASE_ORDER, id).toContain(m.phase);
      expect(POSITION_ORDER, id).toContain(m.position);
      expect([1, 2, 3], id).toContain(m.intensity);
      for (const load of m.load) expect(Object.keys(LOAD_LABELS), `${id} load ${load}`).toContain(load);
      for (const goal of m.goals) expect(Object.keys(GOAL_LABELS), `${id} goal ${goal}`).toContain(goal);
      expect(new Set(m.areas).size, id).toBe(m.areas.length);
    }
  });

  it("keeps warm-ups lively and cooldowns gentle", () => {
    for (const [id, m] of Object.entries(EXERCISE_META)) {
      if (m.phase === "cooldown") expect(m.intensity, `${id} cooldown`).toBe(1);
      if (m.phase === "warmup") expect(m.intensity, `${id} warmup`).toBeGreaterThanOrEqual(2);
    }
  });

  it("has a roomy gentle pool, so a 5-minute recovery doesn't repeat the same few moves", () => {
    const gentle = Object.values(EXERCISE_META).filter((m) => m.intensity === 1);
    expect(gentle.length).toBeGreaterThanOrEqual(15);
  });

  it("every goal has enough exercises behind it to build a session", () => {
    for (const goal of Object.keys(GOAL_LABELS)) {
      const count = Object.values(EXERCISE_META).filter((m) => m.goals.includes(goal)).length;
      expect(count, goal).toBeGreaterThanOrEqual(8);
    }
  });
});
