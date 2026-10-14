// Remembers the last workout choices so starting again is a single tap.
const PREFS_KEY = "workout-prefs";

export const DEFAULT_PREFS = { type: "auto", goal: null, minutes: 10, random: false, weeklyGoal: 4 };

// Anything missing, malformed or no longer valid falls back to the default,
// so old or hand-edited storage can never break the home screen.
export function parsePrefs(raw, { types, minutes, goals = [] }) {
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }
  if (!data || typeof data !== "object") return { ...DEFAULT_PREFS };
  return {
    type: types.includes(data.type) ? data.type : DEFAULT_PREFS.type,
    goal: goals.includes(data.goal) ? data.goal : null,
    minutes: minutes.includes(data.minutes) ? data.minutes : DEFAULT_PREFS.minutes,
    random: typeof data.random === "boolean" ? data.random : DEFAULT_PREFS.random,
    weeklyGoal: Number.isInteger(data.weeklyGoal) && data.weeklyGoal >= 1 && data.weeklyGoal <= 7 ? data.weeklyGoal : DEFAULT_PREFS.weeklyGoal,
  };
}

export function loadPrefs(valid) {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    return parsePrefs(window.localStorage.getItem(PREFS_KEY), valid);
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // storage full or blocked — remembering choices is a nicety, not required
  }
}
