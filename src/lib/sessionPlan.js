import { filterByType, poolForGoal } from "./workoutEngine.js";
import { withoutLoads } from "./routineBuilder.js";

// Decides what a workout draws from, given what the person picked on Home
// (a goal, or a type) and the joints they asked to protect.
export const MIN_SAFE_POOL = 5;
export const FINALE_ID = "splits-practice";

const stresses = (exercise, meta, avoid) => (meta[exercise.id]?.load ?? []).some((l) => avoid.includes(l));

// Returns { pool, finalExercise, needsWarmup, widened }. If protecting the
// person's joints would leave fewer than MIN_SAFE_POOL exercises of the chosen
// kind, the choice is widened to the whole library (`widened: true`), which
// the builder still filters strictly: their limits are never ignored.
export function planPool({ goal, type, exercises, meta = {}, avoidLoads = [] }) {
  const finale = exercises.find((e) => e.id === FINALE_ID);
  let pool;
  let finalExercise;
  let needsWarmup;

  if (goal) {
    pool = poolForGoal(goal, exercises, meta);
    finalExercise = goal === "splits" ? finale : undefined;
    needsWarmup = goal !== "sleep" && goal !== "back";
  } else {
    pool = filterByType(exercises, type, meta);
    finalExercise = type === "flexibility" ? finale : undefined;
    needsWarmup = type !== "flexibility" && type !== "recovery";
  }

  if (finalExercise && stresses(finalExercise, meta, avoidLoads)) finalExercise = undefined;

  const safe = withoutLoads(
    pool.filter((e) => e.id !== finalExercise?.id),
    meta,
    avoidLoads,
  );
  const widened = avoidLoads.length > 0 && safe.length < MIN_SAFE_POOL;
  return { pool: widened ? exercises : pool, finalExercise, needsWarmup, widened };
}
