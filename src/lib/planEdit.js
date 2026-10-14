import { PREP_SECONDS, REST_BETWEEN_SIDES_SECONDS, REST_SECONDS } from "./workoutEngine.js";
import { withoutLoads } from "./routineBuilder.js";

// The editable form of a workout: a list of { exercise, duration } where
// `duration` is seconds (per side for two-sided exercises). Everything the
// preview screen does (reorder, remove, swap, retime) works on this list,
// and it is turned back into the step queue the player runs.

export const MIN_EXERCISE_SECONDS = 10;
export const MAX_EXERCISE_SECONDS = 180;
export const DURATION_STEP_SECONDS = 5;

// A built queue holds each exercise once per side; the plan holds it once.
export function planFromQueue(queue) {
  return queue
    .filter((step) => step.type === "exercise" && step.side !== "left")
    .map((step) => ({ exercise: step.exercise, duration: step.duration }));
}

function pushItem(queue, { exercise, duration }) {
  if (exercise.bilateral) {
    queue.push({ type: "exercise", exercise, duration, side: "right" });
    queue.push({ type: "rest", duration: REST_BETWEEN_SIDES_SECONDS, nextExercise: exercise, nextSide: "left" });
    queue.push({ type: "exercise", exercise, duration, side: "left" });
  } else {
    queue.push({ type: "exercise", exercise, duration, side: null });
  }
}

export function queueFromPlan(items) {
  const queue = [];
  items.forEach((item, i) => {
    const { exercise } = item;
    queue.push({
      type: "rest",
      duration: i === 0 ? PREP_SECONDS : REST_SECONDS,
      nextExercise: exercise,
      nextSide: exercise.bilateral ? "right" : null,
      ...(i === 0 ? { isPrep: true } : {}),
    });
    pushItem(queue, item);
  });
  return queue;
}

// Active time of the whole session, including rests (not the get-ready lead-in).
export function planSeconds(items) {
  return items.reduce((sum, { exercise, duration }, i) => {
    const own = exercise.bilateral ? duration * 2 + REST_BETWEEN_SIDES_SECONDS : duration;
    return sum + own + (i > 0 ? REST_SECONDS : 0);
  }, 0);
}

export function moveItem(items, from, to) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

// A session always keeps at least one exercise.
export function removeItem(items, index) {
  return items.length <= 1 ? items : items.filter((_, i) => i !== index);
}

export function adjustDuration(items, index, deltaSeconds) {
  return items.map((item, i) => {
    if (i !== index) return item;
    const duration = Math.min(MAX_EXERCISE_SECONDS, Math.max(MIN_EXERCISE_SECONDS, item.duration + deltaSeconds));
    return { ...item, duration };
  });
}

// Replaces one exercise with a similar one: same kind of work and body
// position when possible, never one that stresses a joint the person asked
// to protect, never one already in the session. `preferred` (the pool the
// session was drawn from) wins ties so a goal session stays on-goal.
export function swapItem(items, index, { exercises, meta = {}, avoidLoads = [], preferred = [], rng = Math.random }) {
  const current = items[index];
  if (!current) return items;
  const inPlan = new Set(items.map((i) => i.exercise.id));
  const preferredIds = new Set(preferred.map((e) => e.id));
  const mine = meta[current.exercise.id];
  // Families already in the session, other than the one being replaced.
  const usedFamilies = new Set(items.filter((_, i) => i !== index).map((i) => meta[i.exercise.id]?.family).filter(Boolean));

  const candidates = withoutLoads(exercises, meta, avoidLoads).filter((e) => !inPlan.has(e.id));
  if (candidates.length === 0) return items;

  const score = (e) => {
    const m = meta[e.id];
    let s = 0;
    if (preferredIds.has(e.id)) s += 4;
    if (m && mine && m.phase === mine.phase) s += 2;
    if (m && mine && m.position === mine.position) s += 1;
    if (e.bilateral === current.exercise.bilateral) s += 0.5;
    if (m?.family && usedFamilies.has(m.family)) s -= 6;
    return s;
  };
  const best = Math.max(...candidates.map(score));
  const top = candidates.filter((e) => score(e) === best);
  const chosen = top[Math.floor(rng() * top.length)];

  return items.map((item, i) =>
    i === index ? { exercise: chosen, duration: chosen.defaultDurationSeconds } : item,
  );
}

// Where a dragged item would land: its place in the list is the number of
// other items whose centre is above the dragged item's centre. `centres` are
// the items' resting centres (top to bottom), `from` the dragged index.
export function dropIndex(centres, from, draggedCentre) {
  let above = 0;
  centres.forEach((c, i) => {
    if (i !== from && c < draggedCentre) above++;
  });
  return above;
}
