import { describe, expect, it } from "vitest";
import { EXERCISES } from "../data/exercises.js";
import { EXERCISE_META } from "../data/exerciseMeta.js";
import { buildWorkout, PREP_SECONDS, REST_SECONDS } from "./workoutEngine.js";
import {
  adjustDuration,
  DURATION_STEP_SECONDS,
  MAX_EXERCISE_SECONDS,
  MIN_EXERCISE_SECONDS,
  moveItem,
  planFromQueue,
  planSeconds,
  queueFromPlan,
  removeItem,
  swapItem,
} from "./planEdit.js";

const built = () => buildWorkout(10, false, EXERCISES, undefined, { meta: EXERCISE_META, now: 0, rng: () => 0.5 });
const sum = (queue) => queue.reduce((s, step) => s + step.duration, 0);

describe("plan <-> queue", () => {
  it("round-trips a built workout without changing a single step", () => {
    const queue = built();
    const rebuilt = queueFromPlan(planFromQueue(queue));
    expect(rebuilt.map((s) => [s.type, s.duration, s.side ?? null, s.exercise?.id ?? s.nextExercise?.id, s.isPrep ?? false])).toEqual(
      queue.map((s) => [s.type, s.duration, s.side ?? null, s.exercise?.id ?? s.nextExercise?.id, s.isPrep ?? false]),
    );
  });

  it("counts the plan's time like the queue, minus the get-ready lead-in", () => {
    const queue = built();
    expect(planSeconds(planFromQueue(queue))).toBe(sum(queue) - PREP_SECONDS);
  });

  it("starts with the get-ready step and separates exercises with rests", () => {
    const items = planFromQueue(built());
    const queue = queueFromPlan(items);
    expect(queue[0]).toMatchObject({ type: "rest", isPrep: true, duration: PREP_SECONDS });
    expect(queue[0].nextExercise.id).toBe(items[0].exercise.id);
    expect(queue.filter((s) => s.type === "rest" && !s.isPrep && s.nextSide !== "left").every((s) => s.duration === REST_SECONDS)).toBe(true);
  });
});

describe("editing", () => {
  const items = planFromQueue(built());

  it("moves an exercise and ignores impossible moves", () => {
    const moved = moveItem(items, 0, 2);
    expect(moved[2].exercise.id).toBe(items[0].exercise.id);
    expect(moved).toHaveLength(items.length);
    expect(moveItem(items, 0, items.length)).toBe(items);
    expect(moveItem(items, 1, 1)).toBe(items);
  });

  it("removes an exercise but never the last one", () => {
    expect(removeItem(items, 0)).toHaveLength(items.length - 1);
    const single = [items[0]];
    expect(removeItem(single, 0)).toBe(single);
  });

  it("changes the duration within its limits", () => {
    expect(adjustDuration(items, 0, DURATION_STEP_SECONDS)[0].duration).toBe(items[0].duration + DURATION_STEP_SECONDS);
    expect(adjustDuration(items, 0, -1000)[0].duration).toBe(MIN_EXERCISE_SECONDS);
    expect(adjustDuration(items, 0, 1000)[0].duration).toBe(MAX_EXERCISE_SECONDS);
  });

  it("applies edited durations to both sides of a two-sided exercise", () => {
    const i = items.findIndex((x) => x.exercise.bilateral);
    const queue = queueFromPlan(adjustDuration(items, i, 10));
    const sides = queue.filter((s) => s.type === "exercise" && s.exercise.id === items[i].exercise.id);
    expect(sides.map((s) => s.duration)).toEqual([items[i].duration + 10, items[i].duration + 10]);
  });
});

describe("swapItem", () => {
  const items = planFromQueue(built());
  const opts = { exercises: EXERCISES, meta: EXERCISE_META };

  it("replaces with an exercise not already in the session", () => {
    for (let i = 0; i < items.length; i++) {
      const next = swapItem(items, i, { ...opts, rng: () => 0.3 });
      expect(next[i].exercise.id).not.toBe(items[i].exercise.id);
      expect(new Set(next.map((x) => x.exercise.id)).size).toBe(next.length);
      expect(next[i].duration).toBe(next[i].exercise.defaultDurationSeconds);
    }
  });

  it("prefers the same phase and position", () => {
    const warm = items.findIndex((x) => EXERCISE_META[x.exercise.id].phase === "warmup");
    if (warm === -1) return;
    const next = swapItem(items, warm, { ...opts, rng: () => 0 });
    expect(EXERCISE_META[next[warm].exercise.id].phase).toBe("warmup");
  });

  it("never brings in an exercise that stresses a protected joint", () => {
    for (const avoid of [["knees"], ["wrists", "shoulders"], ["lower-back", "hips"], ["impact"]]) {
      for (let i = 0; i < items.length; i++) {
        for (const r of [0, 0.5, 0.99]) {
          const next = swapItem(items, i, { ...opts, avoidLoads: avoid, rng: () => r });
          if (next[i] === items[i]) continue;
          expect(EXERCISE_META[next[i].exercise.id].load.some((l) => avoid.includes(l))).toBe(false);
        }
      }
    }
  });

  it("leaves things alone when no alternative exists", () => {
    const only = [items[0]];
    expect(swapItem(only, 0, { exercises: [items[0].exercise], meta: EXERCISE_META })).toBe(only);
  });
});
