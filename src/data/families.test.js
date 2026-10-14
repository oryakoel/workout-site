import { describe, expect, it } from "vitest";
import { EXERCISES } from "./exercises.js";
import { EXERCISE_META, FAMILIES } from "./exerciseMeta.js";
import { buildWorkout, filterByType } from "../lib/workoutEngine.js";
import { planFromQueue } from "../lib/planEdit.js";
import { spreadFamilies } from "../lib/routineBuilder.js";

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

describe("exercise families", () => {
  it("only name real exercises, and each exercise is in at most one family", () => {
    const real = new Set(EXERCISES.map((e) => e.id));
    const seen = new Set();
    for (const ids of Object.values(FAMILIES)) {
      expect(ids.length).toBeGreaterThan(1);
      for (const id of ids) {
        expect(real.has(id)).toBe(true);
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
    }
  });

  it("are recorded in the metadata", () => {
    expect(EXERCISE_META["pigeon-pose"].family).toBe("pigeon");
    expect(EXERCISE_META["pigeon-backbend"].family).toBe("pigeon");
    expect(EXERCISE_META["neck-stretch"].family).toBeNull();
  });

  it("send a second variation to the back of the order", () => {
    const by = (id) => EXERCISES.find((e) => e.id === id);
    const order = [by("pigeon-pose"), by("pigeon-backbend"), by("neck-stretch")];
    expect(spreadFamilies(order, EXERCISE_META).map((e) => e.id)).toEqual(["pigeon-pose", "neck-stretch", "pigeon-backbend"]);
  });

  it("never put close variations back to back where the pool has room to avoid it", () => {
    // Small, single-family pools (full body is mostly squats and crunches)
    // can't always avoid it, so only the roomy kinds of session are checked.
    const cases = [
      ["auto", [10, 20, 30]],
      ["flexibility", [10, 20]],
      ["recovery", [10, 20, 30]],
    ];
    for (const [type, lengths] of cases) {
      for (const minutes of lengths) {
        for (let seed = 1; seed <= 40; seed++) {
          const pool = filterByType(EXERCISES, type, EXERCISE_META);
          const warmups = EXERCISES.filter((e) => EXERCISE_META[e.id].phase === "warmup");
          const queue = buildWorkout(minutes, false, pool, undefined, { meta: EXERCISE_META, now: 0, rng: seeded(seed), warmups });
          const items = planFromQueue(queue);
          for (let i = 1; i < items.length; i++) {
            const f = EXERCISE_META[items[i].exercise.id].family;
            expect(f !== null && f === EXERCISE_META[items[i - 1].exercise.id].family, `${type} ${minutes} seed ${seed} at ${i}`).toBe(false);
          }
        }
      }
    }
  });

  it("never repeat a family in an auto session while other choices remain", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const queue = buildWorkout(20, false, EXERCISES, undefined, { meta: EXERCISE_META, now: 0, rng: seeded(seed) });
      const families = planFromQueue(queue).map((i) => EXERCISE_META[i.exercise.id].family).filter(Boolean);
      expect(new Set(families).size).toBe(families.length);
    }
  });
});
