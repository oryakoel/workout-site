// Cloudflare Worker + D1 backing the workout history feature (see
// cloudflare-worker-history/README.md). Empty until deployed, in which
// case logging/fetching silently no-op — the app works fine without it.
const HISTORY_WORKER_URL = "https://workout-history-api.ori-yakoel.workers.dev";

const CURRENT_USER_KEY = "workout-current-user";

export const PRESET_USERS = ["אור", "כרמל"];

export function getSavedUser() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CURRENT_USER_KEY);
}

export function saveUser(name) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_USER_KEY, name);
}

// Fire-and-forget: a failed/offline log shouldn't interrupt the workout
// flow, so callers don't need to await or handle errors.
export function logWorkout({ userName, workoutType, durationMinutes, exerciseCount }) {
  if (!HISTORY_WORKER_URL || !userName) return;
  fetch(`${HISTORY_WORKER_URL}/workouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, workoutType, durationMinutes, exerciseCount }),
  }).catch(() => {});
}

// Returns [] if the Worker isn't configured or the request fails —
// callers render an empty/error-tolerant state either way.
export async function fetchHistory(userName) {
  if (!HISTORY_WORKER_URL) return [];
  const url = new URL(`${HISTORY_WORKER_URL}/workouts`);
  if (userName) url.searchParams.set("user", userName);
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// Returns true on success so the caller can remove the entry from its
// local list; false on any failure (leaves the list untouched).
export async function deleteWorkoutEntry(id) {
  if (!HISTORY_WORKER_URL) return false;
  try {
    const res = await fetch(`${HISTORY_WORKER_URL}/workouts/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

function localDateKey(input) {
  const d = new Date(input);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Consecutive days (ending today or yesterday) with at least one saved
// workout. A full calendar day with nothing logged breaks the streak;
// "today" gets a grace period so the streak isn't shown as broken before
// the day is even over — it only counts from yesterday backward until
// today's own workout is logged.
export function computeStreak(entries) {
  const dates = new Set(entries.map((e) => localDateKey(e.completed_at)));
  const cursor = new Date();
  if (!dates.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (dates.has(localDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
