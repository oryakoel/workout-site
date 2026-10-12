import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueSession, flushQueue, newClientId, pendingCount, processQueue, readQueue } from "./sessionQueue.js";
import { getToken, setToken } from "./auth.js";

function fakeWindow() {
  const store = new Map();
  return {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

const item = (id, user = "אור") => ({ clientId: id, userName: user, workoutType: "auto", status: "completed" });
const tokens = { אור: "t-or", כרמל: "t-carmel" };
const tokenFor = (name) => tokens[name] ?? null;

describe("processQueue", () => {
  it("delivers everything and empties the queue", async () => {
    const send = vi.fn(async () => ({ ok: true, status: 201 }));
    const result = await processQueue([item("a"), item("b")], { send, getToken: tokenFor });
    expect(result.sent).toBe(2);
    expect(result.remaining).toEqual([]);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ clientId: "a" }), "t-or");
  });

  it("keeps everything from the first network failure on, in order, and stops sending", async () => {
    const send = vi.fn(async (i) => (i.clientId === "b" ? { ok: false, status: 0 } : { ok: true, status: 201 }));
    const result = await processQueue([item("a"), item("b"), item("c")], { send, getToken: tokenFor });
    expect(result.sent).toBe(1);
    expect(result.remaining.map((i) => i.clientId)).toEqual(["b", "c"]);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("treats a server error or rate limit as temporary", async () => {
    for (const status of [500, 503, 429]) {
      const send = vi.fn(async () => ({ ok: false, status }));
      const result = await processQueue([item("a")], { send, getToken: tokenFor });
      expect(result.remaining).toHaveLength(1);
    }
  });

  it("keeps a session whose name has no token and reports who must sign in", async () => {
    const send = vi.fn(async () => ({ ok: true, status: 201 }));
    const result = await processQueue([item("a", "שני"), item("b")], { send, getToken: tokenFor });
    expect(result.remaining.map((i) => i.clientId)).toEqual(["a"]);
    expect(result.authRequiredFor).toBe("שני");
    expect(result.sent).toBe(1);
  });

  it("keeps a session whose token the server rejected, and flags the token as invalid", async () => {
    const send = vi.fn(async () => ({ ok: false, status: 401 }));
    const result = await processQueue([item("a")], { send, getToken: tokenFor });
    expect(result.remaining).toHaveLength(1);
    expect(result.invalidTokenFor).toEqual(["אור"]);
    expect(result.authRequiredFor).toBe("אור");
  });

  it("drops a session the server will never accept, without blocking the rest", async () => {
    const send = vi.fn(async (i) => (i.clientId === "a" ? { ok: false, status: 400 } : { ok: true, status: 201 }));
    const result = await processQueue([item("a"), item("b")], { send, getToken: tokenFor });
    expect(result.remaining).toEqual([]);
    expect(result.sent).toBe(1);
  });
});

describe("persistent queue", () => {
  beforeEach(() => {
    vi.stubGlobal("window", fakeWindow());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("survives being read back and counts pending sessions", () => {
    expect(pendingCount()).toBe(0);
    enqueueSession(item("a"));
    enqueueSession(item("b"));
    expect(pendingCount()).toBe(2);
    expect(readQueue().map((i) => i.clientId)).toEqual(["a", "b"]);
  });

  it("tolerates corrupt storage", () => {
    window.localStorage.setItem("workout-pending-sessions", "{broken");
    expect(readQueue()).toEqual([]);
  });

  it("flushQueue sends, clears delivered sessions and keeps ones queued mid-flight", async () => {
    setToken("אור", "t-or");
    enqueueSession(item("a"));
    const fetchMock = vi.fn(async () => {
      enqueueSession(item("late")); // finished while the request was in the air
      return { ok: true, status: 201, json: async () => ({ ok: true }) };
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await flushQueue();
    expect(result.sent).toBe(1);
    expect(readQueue().map((i) => i.clientId)).toEqual(["late"]);
  });

  it("flushQueue forgets a rejected token and keeps the session", async () => {
    setToken("אור", "stale");
    enqueueSession(item("a"));
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: "unauthorized" }) })));
    const result = await flushQueue();
    expect(result.authRequiredFor).toBe("אור");
    expect(getToken("אור")).toBeNull();
    expect(pendingCount()).toBe(1);
  });

  it("overlapping flushQueue calls share one run", async () => {
    setToken("אור", "t-or");
    enqueueSession(item("a"));
    const fetchMock = vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) }));
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all([flushQueue(), flushQueue(), flushQueue()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("newClientId", () => {
  it("makes unique ids the Worker accepts", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newClientId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9-]{8,64}$/);
  });

  it("falls back when crypto.randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {});
    expect(newClientId()).toMatch(/^[0-9a-f]{32}$/);
    vi.unstubAllGlobals();
  });
});
