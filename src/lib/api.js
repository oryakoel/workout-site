// The history Worker (see cloudflare-worker-history/). One thin wrapper so
// every caller gets the same shape back and never has to catch: a network
// failure comes back as status 0.
export const API_URL = "https://workout-history-api.ori-yakoel.workers.dev";

// A request that hasn't answered by then counts as "can't reach the server",
// so a flaky connection shows the offline options instead of hanging.
const REQUEST_TIMEOUT_MS = 8000;

export async function apiRequest(method, path, { body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      cache: "no-store",
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}
