// Cloudflare Worker + D1 backing the workout history feature (see
// cloudflare-worker-history/README.md). Empty until deployed, in which
// case logging/fetching silently no-op — the app works fine without it.
const HISTORY_WORKER_URL = "";

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
