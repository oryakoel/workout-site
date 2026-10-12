// Remembers when each exercise was last done on this device, so the next
// workout can favour ones you haven't done lately.
const KEY = "workout-exercise-history";

export function loadLastUsed() {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function recordUsed(ids, now = Date.now()) {
  if (typeof window === "undefined" || ids.length === 0) return;
  const next = { ...loadLastUsed() };
  for (const id of ids) next[id] = now;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // out of space: variety is a nicety, not required
  }
}
