export const REST_SECONDS = 15;
// A "get ready" countdown before the very first exercise, on top of the
// chosen workout length — not deducted from it.
export const PREP_SECONDS = 10;
// Gap between the right-side and left-side rep of a bilateral exercise.
// Kept short (and easy to tune) rather than a full rest — the point is
// to switch sides quickly, not recover.
export const REST_BETWEEN_SIDES_SECONDS = 5;

export const SIDE_LABEL = {
  right: "צד ימין",
  left: "צד שמאל",
};

export const DURATIONS_MINUTES = [5, 10, 20, 30, 45, 60];

export const QUICK_START_MINUTES = 5;
export const QUICK_START_TYPE = "recovery";
export const QUICK_START_FALLBACK_TYPE = "flexibility";

// "auto" (תבחר לי) draws from the whole bank. Any other id filters to
// that type; if a type has no exercises yet (a placeholder type waiting
// for real content), we fall back to the full bank rather than building
// an empty workout.
export function filterByType(exercises, typeId) {
  if (!typeId || typeId === "auto") return exercises;
  const pool = exercises.filter((e) => e.type === typeId);
  return pool.length > 0 ? pool : exercises;
}

// Draws exercises without repeating one until every other exercise in
// the pool has come up (a "shuffled bag"), so a longer workout stays
// varied instead of looping the same few moves. With randomOrder=false
// it just cycles the pool in its given order, deterministically.
function createPicker(pool, randomOrder) {
  let bag = [];
  let lastId = null;

  function refill() {
    bag = [...pool];
    if (randomOrder) {
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
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

// Builds a flat queue of { type: "exercise" | "rest", ... } steps that
// fills roughly `minutes` of workout time from the given exercise pool
// (already filtered by type). Bilateral exercises expand into a
// right-side rep, a short side-switch rest, then a left-side rep.
export function buildWorkout(minutes, randomOrder, exercises) {
  if (exercises.length === 0) return [];
  const totalSeconds = minutes * 60;
  const next = createPicker(exercises, randomOrder);
  const queue = [];

  let elapsed = 0;
  let current = next();

  queue.push({
    type: "rest",
    duration: PREP_SECONDS,
    nextExercise: current,
    nextSide: current.bilateral ? "right" : null,
    isPrep: true,
  });

  while (true) {
    pushExercise(queue, current);
    elapsed += exerciseSeconds(current);
    if (elapsed >= totalSeconds) break;

    const upcoming = next();
    queue.push({
      type: "rest",
      duration: REST_SECONDS,
      nextExercise: upcoming,
      nextSide: upcoming.bilateral ? "right" : null,
    });
    elapsed += REST_SECONDS;
    current = upcoming;
  }

  return queue;
}

// The "אין לי כוח" button: a fixed, gentle workout with zero choices.
// Prefers the recovery pool, falling back to flexibility if recovery
// has nothing yet.
export function buildQuickStartWorkout(exercises) {
  const recoveryPool = exercises.filter((e) => e.type === QUICK_START_TYPE);
  const pool = recoveryPool.length > 0 ? recoveryPool : exercises.filter((e) => e.type === QUICK_START_FALLBACK_TYPE);
  return buildWorkout(QUICK_START_MINUTES, true, pool.length > 0 ? pool : exercises);
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
