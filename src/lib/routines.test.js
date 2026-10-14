import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EXERCISES } from "../data/exercises.js";
import { EXERCISE_META } from "../data/exerciseMeta.js";
import {
  deleteRemoteRoutine,
  loadState,
  MAX_ROUTINES,
  mergeRoutines,
  parseRoutine,
  planFromRoutine,
  removeRoutine,
  routineFromPlan,
  saveState,
  syncRoutines,
  upsertRoutine,
} from "./routines.js";

const ids = new Set(EXERCISES.map((e) => e.id));
const [a, b, c] = EXERCISES;
const rid = (n) => `routine-${String(n).padStart(4, "0")}`;
const at = (n) => `2026-10-${String(10 + n).padStart(2, "0")}T10:00:00.000Z`;
const mk = (n, extra = {}) => ({ id: rid(n), name: `סדרה ${n}`, items: [{ id: a.id, duration: 30 }], updatedAt: at(n), ...extra });
const row = (r) => ({ id: r.id, name: r.name, data: { items: r.items }, updated_at: r.updatedAt });

function fakeWindow() {
  const store = new Map();
  return { localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) } };
}

describe("parseRoutine", () => {
  it("keeps a valid routine and trims the name", () => {
    expect(parseRoutine(mk(1, { name: "  בוקר  " }), ids)).toEqual(mk(1, { name: "בוקר" }));
  });

  it("drops unknown exercises, clamps durations, and rejects junk", () => {
    const r = parseRoutine(mk(1, { items: [{ id: "nope", duration: 30 }, { id: a.id, duration: 9999 }, { id: b.id, duration: 1 }] }), ids);
    expect(r.items).toEqual([{ id: a.id, duration: 180 }, { id: b.id, duration: 10 }]);
    for (const junk of [null, 5, mk(1, { name: " " }), mk(1, { id: "x" }), mk(1, { items: [] }), mk(1, { items: [{ id: "nope", duration: 20 }] })]) {
      expect(parseRoutine(junk, ids)).toBeNull();
    }
  });
});

describe("plans", () => {
  it("round-trips through a routine", () => {
    const plan = [{ exercise: a, duration: 40 }, { exercise: b, duration: 25 }];
    const routine = routineFromPlan(rid(1), "  ערב ", plan, new Date(at(1)));
    expect(routine).toEqual({ id: rid(1), name: "ערב", items: [{ id: a.id, duration: 40 }, { id: b.id, duration: 25 }], updatedAt: at(1) });
    expect(planFromRoutine(routine, EXERCISES, EXERCISE_META)).toEqual({ items: plan, removed: 0 });
  });

  it("leaves out exercises that stress a joint the person now protects", () => {
    const stressing = EXERCISES.find((e) => EXERCISE_META[e.id].load.includes("knees"));
    const routine = { items: [{ id: stressing.id, duration: 30 }, { id: a.id, duration: 30 }] };
    const safeFirst = EXERCISE_META[a.id].load.includes("knees") ? c : a;
    routine.items[1].id = safeFirst.id;
    const { items, removed } = planFromRoutine(routine, EXERCISES, EXERCISE_META, ["knees"]);
    expect(removed).toBe(1);
    expect(items.map((i) => i.exercise.id)).toEqual([safeFirst.id]);
  });
});

describe("local state", () => {
  it("adds newest first, replaces by id, and caps the list", () => {
    let s = { routines: [], deleted: [] };
    s = upsertRoutine(s, mk(1));
    s = upsertRoutine(s, mk(2));
    expect(s.routines.map((r) => r.id)).toEqual([rid(2), rid(1)]);
    s = upsertRoutine(s, mk(1, { name: "חדש" }));
    expect(s.routines.map((r) => r.name)).toEqual(["חדש", "סדרה 2"]);
    for (let n = 3; n < MAX_ROUTINES + 5; n++) s = upsertRoutine(s, mk(n));
    expect(s.routines).toHaveLength(MAX_ROUTINES);
  });

  it("remembers deletions, and saving again cancels the memory", () => {
    let s = upsertRoutine({ routines: [], deleted: [] }, mk(1));
    s = removeRoutine(s, rid(1));
    expect(s).toEqual({ routines: [], deleted: [rid(1)] });
    expect(upsertRoutine(s, mk(1)).deleted).toEqual([]);
  });
});

describe("mergeRoutines", () => {
  const merge = (local, remote) => mergeRoutines({ routines: [], deleted: [], ...local }, remote.map(row), ids);

  it("pulls what only the server has and pushes what only this device has", () => {
    const out = merge({ routines: [mk(1)] }, [mk(2)]);
    expect(out.routines.map((r) => r.id).sort()).toEqual([rid(1), rid(2)]);
    expect(out.push.map((r) => r.id)).toEqual([rid(1)]);
  });

  it("the newer edit wins, in either direction", () => {
    const newerLocal = merge({ routines: [mk(5, { name: "מקומי" })] }, [mk(5, { name: "שרת", updatedAt: at(1) })]);
    expect(newerLocal.routines[0].name).toBe("מקומי");
    expect(newerLocal.push).toHaveLength(1);
    const newerRemote = merge({ routines: [mk(5, { name: "מקומי", updatedAt: at(1) })] }, [mk(5, { name: "שרת" })]);
    expect(newerRemote.routines[0].name).toBe("שרת");
    expect(newerRemote.push).toHaveLength(0);
  });

  it("does not bring back a routine deleted here, and asks the server to drop it", () => {
    const out = merge({ deleted: [rid(2)] }, [mk(2), mk(3)]);
    expect(out.routines.map((r) => r.id)).toEqual([rid(3)]);
    expect(out.removeRemote).toEqual([rid(2)]);
  });
});

describe("syncRoutines", () => {
  let calls;
  beforeEach(() => {
    vi.stubGlobal("window", fakeWindow());
    calls = [];
  });
  afterEach(() => vi.unstubAllGlobals());

  const serve = (rows, { failDelete = false } = {}) =>
    vi.stubGlobal("fetch", async (url, init) => {
      const path = new URL(url).pathname;
      calls.push(`${init.method} ${path}`);
      if (init.method === "GET") return { ok: true, status: 200, json: async () => ({ routines: rows.map(row) }) };
      if (init.method === "DELETE" && failDelete) return { ok: false, status: 503, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    });

  it("guests and signed-out people never touch the network", async () => {
    serve([]);
    saveState(null, { routines: [mk(1)], deleted: [] });
    const state = await syncRoutines(null, null, ids);
    expect(state.routines).toHaveLength(1);
    expect(calls).toEqual([]);
  });

  it("uploads local routines, downloads remote ones, and stores the result", async () => {
    serve([mk(2)]);
    saveState("דנה", { routines: [mk(1)], deleted: [] });
    const state = await syncRoutines("דנה", "tok", ids);
    expect(calls).toEqual(["GET /routines", `PUT /routines/${rid(1)}`]);
    expect(state.routines.map((r) => r.id).sort()).toEqual([rid(1), rid(2)]);
    expect(loadState("דנה", ids).routines).toHaveLength(2);
  });

  it("keeps a deletion for next time when the server can't be reached for it", async () => {
    serve([mk(2)], { failDelete: true });
    saveState("דנה", { routines: [], deleted: [rid(2)] });
    const state = await syncRoutines("דנה", "tok", ids);
    expect(state.deleted).toEqual([rid(2)]);
    serve([mk(2)]);
    const again = await syncRoutines("דנה", "tok", ids);
    expect(again.deleted).toEqual([]);
    expect(again.routines).toEqual([]);
  });

  it("falls back to the local copy when offline", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("offline");
    });
    saveState("דנה", { routines: [mk(1)], deleted: [] });
    expect((await syncRoutines("דנה", "tok", ids)).routines).toHaveLength(1);
    expect(await deleteRemoteRoutine(null, rid(1))).toEqual({ ok: true });
  });
});
