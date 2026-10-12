import { apiRequest } from "./api.js";

const CURRENT_USER_KEY = "workout-current-user";

export const PRESET_USERS = ["אור", "כרמל"];

// Saved in place of a name when someone chooses to train without saving,
// so the app doesn't ask "who's training?" on every launch.
export const GUEST = "__guest__";

// Who this device last chose to be: { chosen: false } on first launch,
// otherwise the saved name (null for a guest).
export function readIdentity() {
  const saved = getSavedUser();
  if (!saved) return { chosen: false, user: null };
  return { chosen: true, user: saved === GUEST ? null : saved };
}

export function getSavedUser() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CURRENT_USER_KEY);
}

export function saveUser(name) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_USER_KEY, name);
}

// Returns [] if the request fails — callers render an empty,
// error-tolerant state either way. Reading history is open to everyone.
export async function fetchHistory(userName) {
  const query = userName ? `?user=${encodeURIComponent(userName)}` : "";
  const result = await apiRequest("GET", `/workouts${query}`);
  return result.ok && Array.isArray(result.data) ? result.data : [];
}

// { ok: true } on success; otherwise { ok: false, status } where 401 means
// "not yours to delete" and 0 means the server could not be reached.
export async function deleteWorkoutEntry(id, token) {
  const result = await apiRequest("DELETE", `/workouts/${id}`, { token });
  return { ok: result.ok, status: result.status };
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
  // A partial session (quit early, or mostly skipped) isn't a day trained.
  const dates = new Set(entries.filter((e) => e.status !== "partial").map((e) => localDateKey(e.completed_at)));
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
