import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commitProfile, loadProfile, newProfile, parseProfile, saveProfile, skippedProfile, syncProfile } from "./profile.js";
import { focusAreasFor } from "../data/focusAreas.js";

function fakeWindow() {
  const store = new Map();
  return {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
    },
  };
}

const at = (iso, extra = {}) => ({ goal: "back", focus: ["core"], sensitive: ["knees"], minutes: 10, weeklyGoal: 4, updatedAt: iso, ...extra });

describe("parseProfile", () => {
  it("keeps valid answers", () => {
    expect(parseProfile(at("2026-10-12T10:00:00.000Z"))).toEqual({ ...at("2026-10-12T10:00:00.000Z"), skipped: false });
  });

  it("drops anything unknown instead of failing", () => {
    const p = parseProfile({ goal: "levitation", focus: ["core", "toes", "core"], sensitive: ["knees", "soul"], minutes: 7, weeklyGoal: 9, updatedAt: "yesterday" });
    expect(p).toMatchObject({ goal: null, focus: ["core"], sensitive: ["knees"], minutes: null, weeklyGoal: null, skipped: false });
    expect(p.updatedAt).toBe("1970-01-01T00:00:00.000Z");
  });

  it("accepts a JSON string and rejects junk", () => {
    expect(parseProfile(JSON.stringify(at("2026-10-12T10:00:00.000Z"))).goal).toBe("back");
    for (const junk of [null, undefined, "{oops", "42", [], 5]) expect(parseProfile(junk)).toBeNull();
  });

  it("a skipped profile means 'asked, no answers'", () => {
    expect(skippedProfile()).toMatchObject({ skipped: true, focus: [], sensitive: [], goal: null });
  });
});

describe("focus groups", () => {
  it("expand to the finer areas, without repeats", () => {
    expect(focusAreasFor(["core", "back"])).toEqual(["core", "obliques", "lower-back"]);
    expect(focusAreasFor(["nope"])).toEqual([]);
    expect(focusAreasFor()).toEqual([]);
  });
});

describe("storage", () => {
  beforeEach(() => vi.stubGlobal("window", fakeWindow()));
  afterEach(() => vi.unstubAllGlobals());

  it("keeps a separate profile per person, and one for guests", () => {
    saveProfile("אור", newProfile({ goal: "running" }));
    saveProfile(null, newProfile({ goal: "sleep" }));
    expect(loadProfile("אור").goal).toBe("running");
    expect(loadProfile(null).goal).toBe("sleep");
    expect(loadProfile("כרמל")).toBeNull();
  });

  it("survives corrupt storage", () => {
    window.localStorage.setItem("workout-profile:אור", "{broken");
    expect(loadProfile("אור")).toBeNull();
  });
});

describe("syncProfile", () => {
  beforeEach(() => vi.stubGlobal("window", fakeWindow()));
  afterEach(() => vi.unstubAllGlobals());

  const server = (cloud, { putOk = true } = {}) => {
    const calls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, init) => {
        calls.push({ method: init.method, body: init.body && JSON.parse(init.body) });
        if (init.method === "GET") return { ok: true, status: 200, json: async () => ({ data: cloud }) };
        return { ok: putOk, status: putOk ? 200 : 500, json: async () => ({ ok: true }) };
      }),
    );
    return calls;
  };

  it("does nothing without a name or token", async () => {
    const calls = server(null);
    saveProfile("אור", parseProfile(at("2026-10-12T10:00:00.000Z")));
    expect((await syncProfile("אור", null)).goal).toBe("back");
    expect(await syncProfile(null, "t")).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it("adopts the server's profile on a new device", async () => {
    server(at("2026-10-12T10:00:00.000Z", { goal: "splits" }));
    const result = await syncProfile("אור", "tok");
    expect(result.goal).toBe("splits");
    expect(loadProfile("אור").goal).toBe("splits");
  });

  it("uploads the local profile when the server has none", async () => {
    saveProfile("אור", parseProfile(at("2026-10-12T10:00:00.000Z")));
    const calls = server(null);
    await syncProfile("אור", "tok");
    expect(calls.map((c) => c.method)).toEqual(["GET", "PUT"]);
    expect(calls[1].body.data.goal).toBe("back");
  });

  it("the newer edit wins in both directions", async () => {
    saveProfile("אור", parseProfile(at("2026-10-12T10:00:00.000Z", { goal: "back" })));
    server(at("2026-10-13T10:00:00.000Z", { goal: "splits" }));
    expect((await syncProfile("אור", "tok")).goal).toBe("splits");

    saveProfile("אור", parseProfile(at("2026-10-15T10:00:00.000Z", { goal: "sleep" })));
    const calls = server(at("2026-10-13T10:00:00.000Z", { goal: "splits" }));
    expect((await syncProfile("אור", "tok")).goal).toBe("sleep");
    expect(calls.map((c) => c.method)).toEqual(["GET", "PUT"]);
  });

  it("keeps the local copy when the server can't be reached", async () => {
    saveProfile("אור", parseProfile(at("2026-10-12T10:00:00.000Z")));
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    expect((await syncProfile("אור", "tok")).goal).toBe("back");
  });

  it("commitProfile saves locally even when the upload fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    await commitProfile("אור", "tok", newProfile({ goal: "running" }));
    expect(loadProfile("אור").goal).toBe("running");
  });
});
