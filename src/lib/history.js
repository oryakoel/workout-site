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

// { ok, entries }. `ok` is false when the server can't be reached, so
// callers can tell "no workouts yet" from "couldn't load". Reading history
// is open to everyone.
export async function fetchHistoryResult(userName) {
  const query = userName ? `?user=${encodeURIComponent(userName)}` : "";
  const result = await apiRequest("GET", `/workouts${query}`);
  if (result.ok && Array.isArray(result.data)) return { ok: true, entries: result.data };
  return { ok: false, entries: [] };
}

export async function fetchHistory(userName) {
  return (await fetchHistoryResult(userName)).entries;
}

// { ok: true } on success; otherwise { ok: false, status } where 401 means
// "not yours to delete" and 0 means the server could not be reached.
export async function deleteWorkoutEntry(id, token) {
  const result = await apiRequest("DELETE", `/workouts/${id}`, { token });
  return { ok: result.ok, status: result.status };
}
