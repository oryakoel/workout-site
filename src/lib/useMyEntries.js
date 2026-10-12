import { useEffect, useState } from "react";
import { fetchHistoryResult } from "./history.js";
import { readQueue } from "./sessionQueue.js";

// A person's own sessions, for the week view and the plant. Works offline:
// the last successful load is remembered on the device, and sessions that
// haven't synced yet are included so progress shows up immediately.
const CACHE_PREFIX = "workout-entries-cache:";

function readCache(userName) {
  if (typeof window === "undefined" || !userName) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CACHE_PREFIX + userName) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCache(userName, entries) {
  try {
    window.localStorage.setItem(
      CACHE_PREFIX + userName,
      JSON.stringify(entries.map((e) => ({ completed_at: e.completed_at, status: e.status ?? null }))),
    );
  } catch {
    // out of space: the cache is only a convenience
  }
}

function pendingFor(userName) {
  return readQueue()
    .filter((q) => q.userName === userName)
    .map((q) => ({ completed_at: q.completedAt, status: q.status }));
}

// `refreshKey` is any value that changes when the data may have changed
// (screen, pending count). Returns { entries, loaded, offline, loadedAt }.
export function useMyEntries(userName, refreshKey) {
  const [state, setState] = useState(() => ({
    entries: [...readCache(userName), ...pendingFor(userName)],
    loaded: false,
    offline: false,
    loadedAt: new Date(),
  }));

  useEffect(() => {
    if (!userName) return;
    let active = true;
    fetchHistoryResult(userName).then((result) => {
      if (!active) return;
      if (result.ok) writeCache(userName, result.entries);
      const base = result.ok ? result.entries : readCache(userName);
      setState({
        entries: [...base, ...pendingFor(userName)],
        loaded: true,
        offline: !result.ok,
        loadedAt: new Date(),
      });
    });
    return () => {
      active = false;
    };
  }, [userName, refreshKey]);

  return userName ? state : { entries: [], loaded: true, offline: false, loadedAt: state.loadedAt };
}
