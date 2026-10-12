// Decides what a workout was worth recording, from time actually spent
// rather than from merely reaching the end of the queue.

// Under a minute of real activity isn't a workout: nothing is saved.
export const MIN_LOGGED_SECONDS = 60;
// Reaching the end counts as "completed" only if at least this share of the
// planned time was really spent (skipping through everything doesn't).
export const COMPLETED_RATIO = 0.6;
// An exercise step counts as done once most of its time was spent on it.
const EXERCISE_DONE_RATIO = 0.8;

// stepProgressMs[i] = most milliseconds ever spent (foreground, unpaused)
// on queue step i. Taking the best per step means going back and forth
// can never be counted twice.
export function summarizeProgress(queue, stepProgressMs) {
  let plannedSeconds = 0;
  let completedSeconds = 0;
  let exerciseSteps = 0;
  let exercisesDone = 0;
  queue.forEach((step, i) => {
    const spent = Math.min(step.duration, (stepProgressMs[i] || 0) / 1000);
    plannedSeconds += step.duration;
    completedSeconds += spent;
    if (step.type === "exercise") {
      exerciseSteps += 1;
      if (spent >= step.duration * EXERCISE_DONE_RATIO) exercisesDone += 1;
    }
  });
  return {
    plannedSeconds: Math.round(plannedSeconds),
    completedSeconds: Math.round(completedSeconds),
    exerciseSteps,
    exercisesDone,
  };
}

// "none" (don't record), "partial" (record, but it won't count as a full
// session) or "completed".
export function classifySession({ reachedEnd, plannedSeconds, completedSeconds }) {
  if (completedSeconds < MIN_LOGGED_SECONDS) return "none";
  if (reachedEnd && completedSeconds >= plannedSeconds * COMPLETED_RATIO) return "completed";
  return "partial";
}
