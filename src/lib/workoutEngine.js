import { orderForFlow, sameFamily, weightedOrder, withoutLoads } from "./routineBuilder.js";

export const REST_SECONDS = 15;
// A "get ready" countdown before the very first exercise, on top of the
// chosen workout length — not deducted from it.
export const PREP_SECONDS = 10;
// Gap between the right-side and left-side rep of a bilateral exercise.
export const REST_BETWEEN_SIDES_SECONDS = 10;

export const SIDE_LABEL = {
  right: "צד ימין",
  left: "צד שמאל",
};

export const DURATIONS_MINUTES = [5, 10, 20, 30, 45, 60];

export const QUICK_START_MINUTES = 5;
export const QUICK_START_TYPE = "recovery";
export const QUICK_START_FALLBACK_TYPE = "flexibility";

// Every workout built for the "flexibility" type ends with this exercise,
// regardless of the chosen duration.
export const FLEXIBILITY_FINALE_ID = "splits-practice";

// "auto" (תבחר לי) draws from the whole bank. "recovery" draws from every
// gentle exercise (not just the few typed as recovery), so a calm session
// has real variety. Any other id filters to that type; if a type has no
// exercises, we fall back to the full bank rather than build an empty workout.
export function filterByType(exercises, typeId, meta = {}) {
  if (!typeId || typeId === "auto") return exercises;
  if (typeId === "recovery") {
    const gentle = exercises.filter((e) => meta[e.id]?.intensity === 1);
    if (gentle.length > 0) return gentle;
  }
  const pool = exercises.filter((e) => e.type === typeId);
  return pool.length > 0 ? pool : exercises;
}

// Every exercise tagged as good for a goal (sitting all day, before running…).
export function poolForGoal(goal, exercises, meta = {}) {
  return exercises.filter((e) => meta[e.id]?.goals?.includes(goal));
}

// Draws exercises without repeating one until every other exercise in
// the pool has come up (a "shuffled bag"), so a longer workout stays
// varied instead of looping the same few moves. With randomOrder=false
// it just cycles the pool in its given order, deterministically.
function createPicker(pool, randomOrder, rng = Math.random) {
  let bag = [];
  let lastId = null;

  function refill() {
    bag = [...pool];
    if (randomOrder) {
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      if (bag.length > 1 && bag[0].id === lastId) {
        [bag[0], bag[1]] = [bag[1], bag[0]];
      }
    }
  }

  return function next() {
    if (bag.length === 0) refill();
    const exercise = bag.shift();
    lastId = exercise.id;
    return exercise;
  };
}

function pushExercise(queue, exercise) {
  if (exercise.bilateral) {
    queue.push({ type: "exercise", exercise, duration: exercise.defaultDurationSeconds, side: "right" });
    if (REST_BETWEEN_SIDES_SECONDS > 0) {
      queue.push({
        type: "rest",
        duration: REST_BETWEEN_SIDES_SECONDS,
        nextExercise: exercise,
        nextSide: "left",
      });
    }
    queue.push({ type: "exercise", exercise, duration: exercise.defaultDurationSeconds, side: "left" });
  } else {
    queue.push({ type: "exercise", exercise, duration: exercise.defaultDurationSeconds, side: null });
  }
}

function exerciseSeconds(exercise) {
  return exercise.bilateral
    ? exercise.defaultDurationSeconds * 2 + REST_BETWEEN_SIDES_SECONDS
    : exercise.defaultDurationSeconds;
}

// Chooses which exercises fill `minutes` of workout time and in what order.
//  - randomOrder: a shuffled bag, so nothing repeats until the whole pool
//    has come up. Pure luck of the draw.
//  - otherwise ("smart"): favours exercises not done lately, then arranges
//    them warm-up, main work, cooldown with few position changes.
// Either way, time is counted as it was before: each exercise plus the rest
// before the next, stopping once the target is reached.
function planExercises(pool, targetSeconds, randomOrder, { meta, lastUsed, now, rng, focusAreas }) {
  const sequence = [];
  let elapsed = 0;

  if (randomOrder) {
    const next = createPicker(pool, true, rng);
    while (true) {
      const exercise = next();
      sequence.push(exercise);
      elapsed += exerciseSeconds(exercise);
      if (elapsed >= targetSeconds) return sequence;
      elapsed += REST_SECONDS;
    }
  }

  while (elapsed < targetSeconds) {
    const chosen = [];
    for (const exercise of weightedOrder(pool, { lastUsed, now, rng, meta, focusAreas })) {
      chosen.push(exercise);
      elapsed += exerciseSeconds(exercise);
      if (elapsed >= targetSeconds) break;
      elapsed += REST_SECONDS;
    }
    const round = orderForFlow(chosen, meta, rng);
    // Don't open a new round with the exercise (or a close variation) the
    // last one ended on.
    if (sequence.length > 0 && round.length > 1 && sameFamily(round[0], sequence[sequence.length - 1], meta)) {
      [round[0], round[1]] = [round[1], round[0]];
    }
    sequence.push(...round);
  }
  return sequence;
}

// Builds a flat queue of { type: "exercise" | "rest", ... } steps that
// fills roughly `minutes` of workout time from the given exercise pool
// (already filtered by type). Bilateral exercises expand into a
// right-side rep, a short side-switch rest, then a left-side rep.
//
// `finalExercise`, when given, is excluded from the draw and always
// appended as the workout's last exercise instead (used to close every
// flexibility workout with splits practice).
//
// options: { meta, lastUsed, now, rng, avoidLoads, warmups, focusAreas } — see routineBuilder.js.
// An empty result means avoidLoads left nothing to choose from.
export function buildWorkout(minutes, randomOrder, exercises, finalExercise, options = {}) {
  const { meta = {}, lastUsed = {}, now = Date.now(), rng = Math.random, avoidLoads = [], warmups = [], focusAreas = [] } = options;
  const base = finalExercise ? exercises.filter((e) => e.id !== finalExercise.id) : exercises;
  const pool = withoutLoads(base, meta, avoidLoads);
  if (pool.length === 0) return [];

  // A session of 10+ minutes opens with a warm-up (two from 20 minutes),
  // taken from `warmups` — the library's dynamic moves — so a type with none
  // of its own (strength, full body) still starts warm. Their time counts.
  const safeWarmups = warmups.filter(
    (e) => e.id !== finalExercise?.id && !(meta[e.id]?.load ?? []).some((l) => avoidLoads.includes(l)),
  );
  const chosenWarmups =
    !randomOrder && minutes >= 10 && safeWarmups.length > 0
      ? weightedOrder(safeWarmups, { lastUsed, now, rng, meta }).slice(0, minutes >= 20 ? 2 : 1)
      : [];
  const reserved = chosenWarmups.reduce((sum, w) => sum + exerciseSeconds(w) + REST_SECONDS, 0);
  // The main part leaves out the warm-ups themselves and, when there is
  // enough left to choose from, their close variations (no jumping jacks
  // followed straight by high knees).
  const notWarmups = pool.filter((e) => !chosenWarmups.some((w) => w.id === e.id));
  const apart = notWarmups.filter((e) => !chosenWarmups.some((w) => sameFamily(e, w, meta)));
  const remaining = apart.length >= 5 ? apart : notWarmups;

  const sequence = [
    ...orderForFlow(chosenWarmups, meta, rng),
    ...planExercises(remaining.length > 0 ? remaining : pool, minutes * 60 - reserved, randomOrder, { meta, lastUsed, now, rng, focusAreas }),
  ];
  const queue = [];

  const first = sequence[0];
  queue.push({
    type: "rest",
    duration: PREP_SECONDS,
    nextExercise: first,
    nextSide: first.bilateral ? "right" : null,
    isPrep: true,
  });

  sequence.forEach((exercise, i) => {
    if (i > 0) {
      queue.push({
        type: "rest",
        duration: REST_SECONDS,
        nextExercise: exercise,
        nextSide: exercise.bilateral ? "right" : null,
      });
    }
    pushExercise(queue, exercise);
  });

  if (finalExercise) {
    queue.push({
      type: "rest",
      duration: REST_SECONDS,
      nextExercise: finalExercise,
      nextSide: finalExercise.bilateral ? "right" : null,
    });
    pushExercise(queue, finalExercise);
  }

  return queue;
}

// The "אין לי כוח" button: a fixed, gentle workout with zero choices, drawn
// from every gentle exercise.
export function buildQuickStartWorkout(exercises, options = {}) {
  const gentle = filterByType(exercises, QUICK_START_TYPE, options.meta);
  const pool = gentle.length > 0 && gentle.length < exercises.length ? gentle : exercises.filter((e) => e.type === QUICK_START_FALLBACK_TYPE);
  return buildWorkout(QUICK_START_MINUTES, false, pool.length > 0 ? pool : exercises, undefined, options);
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
