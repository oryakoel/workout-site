import { apiRequest } from "./api.js";
import { MAX_EXERCISE_SECONDS, MIN_EXERCISE_SECONDS } from "./planEdit.js";

// Saved routines: a name and an ordered list of { id, duration } the person
// put together in the preview. Kept per person on the device (always works,
// guests included) and mirrored to their private routines on the server when
// signed in. Deletions made offline are remembered until the server hears.
export const MAX_ROUTINES = 30;
export const MAX_NAME_LENGTH = 60;
const EPOCH = "1970-01-01T00:00:00.000Z";
const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

const isoOrEpoch = (v) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : EPOCH);

// Anything that doesn't check out (unknown exercise, bad numbers) is dropped
// rather than trusted, so old or edited data can never break the app.
export function parseRoutine(raw, knownIds) {
  if (!raw || typeof raw !== "object") return null;
  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  if (!name || typeof raw.id !== "string" || !ID_PATTERN.test(raw.id)) return null;
  const list = Array.isArray(raw.items) ? raw.items : [];
  const items = list
    .filter((i) => i && knownIds.has(i.id) && Number.isFinite(i.duration))
    .map((i) => ({
      id: i.id,
      duration: Math.min(MAX_EXERCISE_SECONDS, Math.max(MIN_EXERCISE_SECONDS, Math.round(i.duration))),
    }));
  if (items.length === 0) return null;
  return { id: raw.id, name, items, updatedAt: isoOrEpoch(raw.updatedAt) };
}

export const routineFromPlan = (id, name, planItems, now = new Date()) => ({
  id,
  name: name.trim().slice(0, MAX_NAME_LENGTH),
  items: planItems.map(({ exercise, duration }) => ({ id: exercise.id, duration })),
  updatedAt: now.toISOString(),
});

// Back into plan items. `avoidLoads` removes exercises that stress a joint
// the person has since asked to protect; `removed` counts how many went.
export function planFromRoutine(routine, exercises, meta = {}, avoidLoads = []) {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  let removed = 0;
  const items = [];
  for (const { id, duration } of routine.items) {
    const exercise = byId.get(id);
    if (!exercise) continue;
    if ((meta[id]?.load ?? []).some((l) => avoidLoads.includes(l))) {
      removed++;
      continue;
    }
    items.push({ exercise, duration });
  }
  return { items, removed };
}

// ----- the local copy -----
const keyFor = (name) => `workout-routines:${name || "__guest__"}`;

export function loadState(name, knownIds) {
  const empty = { routines: [], deleted: [] };
  if (typeof window === "undefined") return empty;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(keyFor(name)) || "null");
    if (!parsed) return empty;
    return {
      routines: (Array.isArray(parsed.routines) ? parsed.routines : []).map((r) => parseRoutine(r, knownIds)).filter(Boolean),
      deleted: (Array.isArray(parsed.deleted) ? parsed.deleted : []).filter((id) => typeof id === "string" && ID_PATTERN.test(id)),
    };
  } catch {
    return empty;
  }
}

export function saveState(name, state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(name), JSON.stringify(state));
  } catch {
    // storage blocked: routines just won't be remembered on this device
  }
}

// Adds or replaces (by id); newest first; the oldest fall off past the limit.
export function upsertRoutine(state, routine) {
  const rest = state.routines.filter((r) => r.id !== routine.id);
  return {
    routines: [routine, ...rest].slice(0, MAX_ROUTINES),
    deleted: state.deleted.filter((id) => id !== routine.id),
  };
}

export function removeRoutine(state, id) {
  return { routines: state.routines.filter((r) => r.id !== id), deleted: [...new Set([...state.deleted, id])] };
}

// Pure: decides what each side needs. Server rows look like
// { id, name, data: { items }, updated_at }.
export function mergeRoutines(local, remoteRows, knownIds) {
  const remote = (remoteRows ?? [])
    .map((row) => parseRoutine({ id: row.id, name: row.name, items: row.data?.items, updatedAt: row.updated_at }, knownIds))
    .filter(Boolean);
  const remoteById = new Map(remote.map((r) => [r.id, r]));
  const deleted = new Set(local.deleted);
  const merged = [];
  const push = [];

  for (const mine of local.routines) {
    const theirs = remoteById.get(mine.id);
    if (!theirs) push.push(mine);
    else if (Date.parse(mine.updatedAt) > Date.parse(theirs.updatedAt)) push.push(mine);
    merged.push(theirs && Date.parse(theirs.updatedAt) >= Date.parse(mine.updatedAt) ? theirs : mine);
  }
  for (const theirs of remote) {
    if (deleted.has(theirs.id) || local.routines.some((r) => r.id === theirs.id)) continue;
    merged.push(theirs);
  }

  merged.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return {
    routines: merged.slice(0, MAX_ROUTINES),
    push,
    removeRemote: remote.filter((r) => deleted.has(r.id)).map((r) => r.id),
  };
}

const body = (r) => ({ name: r.name, data: { items: r.items } });

// Brings this device and the server into agreement. Never throws; offline
// just keeps the local copy and tries again next time.
export async function syncRoutines(name, token, knownIds) {
  const local = loadState(name, knownIds);
  if (!name || !token) return local;
  const response = await apiRequest("GET", "/routines", { token });
  if (!response.ok) return local;

  const plan = mergeRoutines(local, response.data?.routines, knownIds);
  const failedDeletes = new Set();
  for (const id of plan.removeRemote) {
    const r = await apiRequest("DELETE", `/routines/${id}`, { token });
    if (!r.ok) failedDeletes.add(id);
  }
  for (const routine of plan.push) await apiRequest("PUT", `/routines/${routine.id}`, { token, body: body(routine) });

  // A deletion is finished once the server has dropped the routine (or never
  // had it); only the ones that failed are remembered for next time.
  const next = {
    routines: plan.routines.filter((r) => !failedDeletes.has(r.id)),
    deleted: [...failedDeletes],
  };
  saveState(name, next);
  return next;
}

// Pushes one change right away if possible; the next sync fixes any miss.
export async function pushRoutine(token, routine) {
  if (token) await apiRequest("PUT", `/routines/${routine.id}`, { token, body: body(routine) });
}

export async function deleteRemoteRoutine(token, id) {
  if (!token) return { ok: true };
  return apiRequest("DELETE", `/routines/${id}`, { token });
}
