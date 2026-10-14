import { describe, expect, it } from "vitest";
import { EXERCISES, WORKOUT_TYPES } from "../data/exercises.js";
import { EXERCISE_META, GOAL_LABELS, LOAD_LABELS } from "../data/exerciseMeta.js";
import { buildQuickStartWorkout, buildWorkout, filterByType, poolForGoal } from "./workoutEngine.js";
import { withoutLoads } from "./routineBuilder.js";

// What the quiz promises: if you say a joint is sensitive, no workout built
// for you contains an exercise that stresses it. Checked on the real library.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const stressed = (id, avoid) => EXERCISE_META[id].load.some((l) => avoid.includes(l));
const ids = (queue) => queue.filter((q) => q.type === "exercise").map((q) => q.exercise.id);
const warmups = EXERCISES.filter((e) => EXERCISE_META[e.id].phase === "warmup");

const combos = [
  ...Object.keys(LOAD_LABELS).map((l) => [l]),
  ["knees", "wrists"],
  ["knees", "impact", "lower-back"],
  ["neck", "shoulders", "wrists"],
  Object.keys(LOAD_LABELS),
];

describe("sensitive areas are never loaded", () => {
  it("in any kind of workout, for any combination", () => {
    const kinds = [
      ...["auto", ...WORKOUT_TYPES.map((t) => t.id)].map((type) => filterByType(EXERCISES, type, EXERCISE_META)),
      ...Object.keys(GOAL_LABELS).map((goal) => poolForGoal(goal, EXERCISES, EXERCISE_META)),
    ];
    for (const avoid of combos) {
      for (const pool of kinds) {
        for (let seed = 1; seed <= 6; seed++) {
          for (const minutes of [5, 20]) {
            const queue = buildWorkout(minutes, false, pool, undefined, { meta: EXERCISE_META, avoidLoads: avoid, warmups, rng: seeded(seed) });
            for (const id of ids(queue)) expect(stressed(id, avoid), `${id} with ${avoid}`).toBe(false);
          }
        }
      }
    }
  });

  it("in the quick start, and in random order", () => {
    for (const avoid of combos) {
      for (let seed = 1; seed <= 6; seed++) {
        for (const id of ids(buildQuickStartWorkout(EXERCISES, { meta: EXERCISE_META, avoidLoads: avoid, rng: seeded(seed) }))) {
          expect(stressed(id, avoid), `quick ${id} with ${avoid}`).toBe(false);
        }
        const random = buildWorkout(10, true, EXERCISES, undefined, { meta: EXERCISE_META, avoidLoads: avoid, rng: seeded(seed) });
        for (const id of ids(random)) expect(stressed(id, avoid), `random ${id} with ${avoid}`).toBe(false);
      }
    }
  });

  it("still leaves a real choice when everything is protected, so there is always something to do", () => {
    const safe = withoutLoads(EXERCISES, EXERCISE_META, Object.keys(LOAD_LABELS));
    expect(safe.length).toBeGreaterThanOrEqual(5);
  });

  it("leaves enough in every single-joint case to build a varied session from the whole library", () => {
    for (const load of Object.keys(LOAD_LABELS)) {
      expect(withoutLoads(EXERCISES, EXERCISE_META, [load]).length, load).toBeGreaterThanOrEqual(30);
    }
  });
});
