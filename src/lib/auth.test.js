import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToken, claimName, getAuthStatus, getToken, setToken } from "./auth.js";
import { apiRequest } from "./api.js";
import { computeStreak } from "./history.js";

function fakeWindow() {
  const store = new Map();
  return {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
    },
  };
}

const reply = (status, data) => vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => data }));

beforeEach(() => vi.stubGlobal("window", fakeWindow()));
afterEach(() => vi.unstubAllGlobals());

describe("token storage", () => {
  it("keeps a separate token per name", () => {
    setToken("אור", "a");
    setToken("כרמל", "b");
    expect(getToken("אור")).toBe("a");
    expect(getToken("כרמל")).toBe("b");
    expect(getToken("שני")).toBeNull();
  });

  it("clearToken removes only that name's token", () => {
    setToken("אור", "a");
    setToken("כרמל", "b");
    clearToken("אור");
    expect(getToken("אור")).toBeNull();
    expect(getToken("כרמל")).toBe("b");
  });

  it("survives corrupt storage", () => {
    window.localStorage.setItem("workout-auth-tokens", "[[[");
    expect(getToken("אור")).toBeNull();
    setToken("אור", "a");
    expect(getToken("אור")).toBe("a");
  });
});

describe("apiRequest", () => {
  it("sends JSON and the bearer token, and returns parsed data", async () => {
    const fetchMock = reply(200, { hello: "world" });
    vi.stubGlobal("fetch", fetchMock);
    const result = await apiRequest("POST", "/x", { body: { a: 1 }, token: "tok" });
    expect(result).toEqual({ ok: true, status: 200, data: { hello: "world" } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/x$/);
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe('{"a":1}');
  });

  it("reports a network failure as status 0 instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    expect(await apiRequest("GET", "/x")).toEqual({ ok: false, status: 0, data: null });
  });

  it("gives up on a request that never answers and reports it as unreachable", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (url, init) =>
          new Promise((resolve, reject) => {
            init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
          }),
      ),
    );
    const pending = apiRequest("GET", "/slow");
    await vi.advanceTimersByTimeAsync(8000);
    expect(await pending).toEqual({ ok: false, status: 0, data: null });
    vi.useRealTimers();
  });

  it("copes with a non-JSON body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 502, json: async () => Promise.reject(new Error("html")) })));
    expect(await apiRequest("GET", "/x")).toEqual({ ok: false, status: 502, data: null });
  });
});

describe("auth calls", () => {
  it("getAuthStatus reports claimed, or failure when unreachable", async () => {
    vi.stubGlobal("fetch", reply(200, { claimed: true }));
    expect(await getAuthStatus("אור")).toEqual({ ok: true, claimed: true });
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("x"))));
    expect(await getAuthStatus("אור")).toEqual({ ok: false });
  });

  it("claimName maps every server answer to a reason", async () => {
    vi.stubGlobal("fetch", reply(201, { token: "t", created: true }));
    expect(await claimName("אור", "1234")).toEqual({ ok: true, token: "t", created: true });
    vi.stubGlobal("fetch", reply(401, { error: "wrong_pin", attemptsLeft: 3 }));
    expect(await claimName("אור", "0000")).toEqual({ ok: false, reason: "wrong_pin", attemptsLeft: 3 });
    vi.stubGlobal("fetch", reply(429, { error: "locked", retryAfterSeconds: 900 }));
    expect(await claimName("אור", "0000")).toEqual({ ok: false, reason: "locked", retryAfterSeconds: 900 });
    vi.stubGlobal("fetch", reply(400, { error: "invalid_pin" }));
    expect(await claimName("אור", "1")).toEqual({ ok: false, reason: "invalid" });
    vi.stubGlobal("fetch", reply(503, null));
    expect(await claimName("אור", "1234")).toEqual({ ok: false, reason: "network" });
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("x"))));
    expect(await claimName("אור", "1234")).toEqual({ ok: false, reason: "network" });
  });
});

describe("computeStreak ignores partial sessions", () => {
  const day = (offset, status) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    d.setHours(12, 0, 0, 0);
    return { completed_at: d.toISOString(), status };
  };

  it("counts completed and legacy (no status) sessions", () => {
    expect(computeStreak([day(0, "completed"), day(1, null), day(2, undefined)])).toBe(3);
  });

  it("a partial session does not make a day count", () => {
    expect(computeStreak([day(0, "completed"), day(1, "partial"), day(2, "completed")])).toBe(1);
  });
});
