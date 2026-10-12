import { apiRequest } from "./api.js";
import { clearToken, getToken } from "./auth.js";

// Finished sessions wait here until the server has confirmed them, so a
// workout done offline (or during a hiccup) is delivered later instead of
// being lost. Each carries a clientId, which the Worker uses to ignore a
// duplicate if the same session is ever sent twice.
const QUEUE_KEY = "workout-pending-sessions";
const CHANGE_EVENT = "workout-queue-changed";

export function readQueue() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUEUE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // storage full or blocked: nothing more we can do for this session
  }
}

export function pendingCount() {
  return readQueue().length;
}

export function onQueueChange(listener) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

export function enqueueSession(payload) {
  writeQueue([...readQueue(), payload]);
}

// Sends items in order and decides each one's fate. Pure apart from the two
// injected functions, so it is easy to test.
//  - delivered: dropped from the queue
//  - no token / token rejected: kept, and the person must sign in again
//  - server unreachable or overloaded: kept, and we stop (retry later)
//  - any other rejection: the payload can never succeed, so it is dropped
export async function processQueue(items, { send, getToken: tokenFor }) {
  const remaining = [];
  const invalidTokenFor = new Set();
  let authRequiredFor = null;
  let sent = 0;
  let stopped = false;

  for (const item of items) {
    if (stopped) {
      remaining.push(item);
      continue;
    }
    const token = tokenFor(item.userName);
    if (!token) {
      remaining.push(item);
      authRequiredFor ??= item.userName;
      continue;
    }
    const result = await send(item, token);
    if (result.ok) {
      sent += 1;
    } else if (result.status === 401) {
      remaining.push(item);
      invalidTokenFor.add(item.userName);
      authRequiredFor ??= item.userName;
    } else if (result.status === 0 || result.status === 429 || result.status >= 500) {
      remaining.push(item);
      stopped = true;
    }
  }
  return { remaining, sent, authRequiredFor, invalidTokenFor: [...invalidTokenFor] };
}

let inFlight = null;

async function doFlush() {
  const items = readQueue();
  if (items.length === 0) return { sent: 0, pending: 0, authRequiredFor: null };

  const result = await processQueue(items, {
    send: (item, token) => apiRequest("POST", "/workouts", { body: item, token }),
    getToken,
  });
  result.invalidTokenFor.forEach(clearToken);

  // Sessions finished while we were sending are not in `items`; keep them.
  const handled = new Set(items.map((i) => i.clientId));
  const stillPending = new Set(result.remaining.map((i) => i.clientId));
  writeQueue(readQueue().filter((i) => !handled.has(i.clientId) || stillPending.has(i.clientId)));

  return { sent: result.sent, pending: pendingCount(), authRequiredFor: result.authRequiredFor };
}

// Safe to call from anywhere, any number of times: overlapping calls share
// one run.
export function flushQueue() {
  if (!inFlight) {
    inFlight = doFlush().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

// Unique per finished session; the Worker uses it to ignore duplicates.
export function newClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}
