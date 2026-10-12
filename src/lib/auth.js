import { apiRequest } from "./api.js";

// Device tokens, one per signed-in name (a phone can switch between people).
// A token is what the Worker accepts for saving or deleting that name's
// data; the PIN itself is only ever typed, never stored.
const TOKENS_KEY = "workout-auth-tokens";

function readTokens() {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TOKENS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTokens(tokens) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    // storage blocked: the user will simply be asked for the PIN again
  }
}

export function getToken(name) {
  return (name && readTokens()[name]) || null;
}

export function setToken(name, token) {
  writeTokens({ ...readTokens(), [name]: token });
}

export function clearToken(name) {
  const { [name]: removed, ...rest } = readTokens();
  void removed;
  writeTokens(rest);
}

// { ok: true, claimed } or { ok: false } when the server can't be reached.
export async function getAuthStatus(name) {
  const result = await apiRequest("GET", `/auth/status?name=${encodeURIComponent(name)}`);
  return result.ok ? { ok: true, claimed: Boolean(result.data?.claimed) } : { ok: false };
}

// Sets the PIN for an unclaimed name, or signs in to a claimed one.
// Failures say why: "wrong_pin" (with attemptsLeft), "locked" (with
// retryAfterSeconds), "invalid", or "network".
export async function claimName(name, pin) {
  const result = await apiRequest("POST", "/auth/claim", { body: { name, pin } });
  if (result.ok && result.data?.token) {
    return { ok: true, token: result.data.token, created: Boolean(result.data.created) };
  }
  if (result.status === 0 || result.status >= 500) return { ok: false, reason: "network" };
  if (result.status === 401) return { ok: false, reason: "wrong_pin", attemptsLeft: result.data?.attemptsLeft ?? 0 };
  if (result.status === 429) return { ok: false, reason: "locked", retryAfterSeconds: result.data?.retryAfterSeconds ?? 900 };
  return { ok: false, reason: "invalid" };
}
