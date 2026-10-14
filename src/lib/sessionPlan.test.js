import { describe, expect, it } from "vitest";
import { EXERCISES } from "../data/exercises.js";
import { EXERCISE_META } from "../data/exerciseMeta.js";
import { planPool } from "./sessionPlan.js";

const plan = (extra) => planPool({ type: "auto", exercises: EXERCISES, meta: EXERCISE_META, ...extra });

describe("planPool", () => {
  it("uses the chosen type when nothing needs protecting", () => {
    const p = plan({ type: "cardio" });
    expect(p.widened).toBe(false);
    expect(p.pool.every((e) => e.type === "cardio")).toBe(true);
    expect(p.needsWarmup).toBe(true);
  });

  it("closes flexibility with splits, and skips the dynamic warm-up for calm sessions", () => {
    const flex = plan({ type: "flexibility" });
    expect(flex.finalExercise?.id).toBe("splits-practice");
    expect(flex.needsWarmup).toBe(false);
    expect(plan({ type: "recovery" }).needsWarmup).toBe(false);
  });

  it("builds a goal session from the exercises tagged for it", () => {
    const p = plan({ goal: "sitting" });
    expect(p.pool.length).toBeGreaterThan(20);
    expect(p.pool.every((e) => EXERCISE_META[e.id].goals.includes("sitting"))).toBe(true);
  });

  it("warms up before most goals, but not before sleep or back relief", () => {
    expect(plan({ goal: "running" }).needsWarmup).toBe(true);
    expect(plan({ goal: "sleep" }).needsWarmup).toBe(false);
    expect(plan({ goal: "back" }).needsWarmup).toBe(false);
  });

  it("finishes a splits session with splits practice, unless it stresses a protected joint", () => {
    expect(plan({ goal: "splits" }).finalExercise?.id).toBe("splits-practice");
    expect(plan({ goal: "splits", avoidLoads: ["knees"] }).finalExercise).toBeUndefined();
  });

  it("widens to the whole library when protection leaves too little of the chosen type", () => {
    const strength = plan({ type: "handstand-strength", avoidLoads: ["wrists", "shoulders"] });
    expect(strength.widened).toBe(true);
    expect(strength.pool).toHaveLength(EXERCISES.length);
  });

  it("does not widen when plenty of the chosen kind is left", () => {
    expect(plan({ type: "flexibility", avoidLoads: ["wrists"] }).widened).toBe(false);
    expect(plan({ type: "auto", avoidLoads: ["knees"] }).widened).toBe(false);
  });
});
