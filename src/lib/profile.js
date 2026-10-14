import { apiRequest } from "./api.js";
import { GOAL_LABELS, LOAD_LABELS } from "../data/exerciseMeta.js";
import { FOCUS_GROUPS } from "../data/focusAreas.js";

// What the quiz learns about a person: their main goal, the body regions to
// focus on, the joints to go easy on, and their usual session length and
// weekly goal. Kept per person on the device, and synced to their private
// profile on the server (which needs their sign-in token to read or write).
const MINUTES = [5, 10, 20, 30, 45, 60];
const EPOCH = "1970-01-01T00:00:00.000Z";

const unique = (values, allowed) => [...new Set((Array.isArray(values) ? values : []).filter((v) => allowed.includes(v)))];

// Accepts a JSON string or an object (from the server). Anything unknown is
// dropped, so old or hand-edited data can never break the app. null = none.
export function parseProfile(input) {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return {
    goal: Object.keys(GOAL_LABELS).includes(data.goal) ? data.goal : null,
    focus: unique(data.focus, Object.keys(FOCUS_GROUPS)),
    sensitive: unique(data.sensitive, Object.keys(LOAD_LABELS)),
    minutes: MINUTES.includes(data.minutes) ? data.minutes : null,
    weeklyGoal: Number.isInteger(data.weeklyGoal) && data.weeklyGoal >= 1 && data.weeklyGoal <= 7 ? data.weeklyGoal : null,
    skipped: data.skipped === true,
    updatedAt: typeof data.updatedAt === "string" && !Number.isNaN(Date.parse(data.updatedAt)) ? data.updatedAt : EPOCH,
  };
}

export function newProfile(fields = {}) {
  return parseProfile({ ...fields, updatedAt: new Date().toISOString() });
}

export const skippedProfile = () => newProfile({ skipped: true });

const keyFor = (name) => `workout-profile:${name || "__guest__"}`;

export function loadProfile(name) {
  if (typeof window === "undefined") return null;
  try {
    return parseProfile(window.localStorage.getItem(keyFor(name)));
  } catch {
    return null;
  }
}

export function saveProfile(name, profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(name), JSON.stringify(profile));
  } catch {
    // storage blocked: the quiz will simply be offered again
  }
}

const isNewer = (a, b) => Date.parse(a.updatedAt) > Date.parse(b.updatedAt);

// Makes this device and the server agree, newest edit winning, and returns
// the result. Never throws: offline just keeps the local copy.
export async function syncProfile(name, token) {
  const local = loadProfile(name);
  if (!name || !token) return local;
  const response = await apiRequest("GET", "/profile", { token });
  if (!response.ok) return local;
  const cloud = parseProfile(response.data?.data);

  if (!cloud) {
    if (local) await apiRequest("PUT", "/profile", { token, body: { data: local } });
    return local;
  }
  if (!local || isNewer(cloud, local)) {
    saveProfile(name, cloud);
    return cloud;
  }
  if (isNewer(local, cloud)) await apiRequest("PUT", "/profile", { token, body: { data: local } });
  return local;
}

// Saves locally first (always works), then tells the server if we can.
export async function commitProfile(name, token, profile) {
  saveProfile(name, profile);
  if (name && token) await apiRequest("PUT", "/profile", { token, body: { data: profile } });
}
