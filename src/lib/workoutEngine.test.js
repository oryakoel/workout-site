import { describe, expect, it } from "vitest";
import {
  buildQuickStartWorkout,
  buildWorkout,
  filterByType,
  poolForGoal,
  PREP_SECONDS,
  REST_BETWEEN_SIDES_SECONDS,
  REST_SECONDS,
} from "./workoutEngine.js";
import { orderForFlow, recencyWeight, weightedOrder } from "./routineBuilder.js";
import { POSITION_ORDER } from "../data/exerciseMeta.js";

// A small seedable generator so "random" tests are exact and repeatable.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ex = (id, extra = {}) => ({ id, name: id, type: "flexibility", defaultDurationSeconds: 30, bilateral: false, ...extra });
const m = (phase, intensity, position, areas, load = []) => ({ phase, intensity, position, areas, load, goals: [], equipment: [] });

const exercises = [
  ex("warm-a"),
  ex("warm-b"),
  ex("stand-a"),
  ex("stand-b"),
  ex("plank-a"),
  ex("plank-b"),
  ex("seat-a"),
  ex("seat-b"),
  ex("lie-a"),
  ex("lie-b"),
  ex("cool-a"),
  ex("cool-b"),
];
const meta = {
  "warm-a": m("warmup", 2, "standing", ["full-body"], ["impact"]),
  "warm-b": m("warmup", 2, "standing", ["hips"]),
  "stand-a": m("work", 2, "standing", ["quads"], ["knees"]),
  "stand-b": m("work", 2, "standing", ["hamstrings"]),
  "plank-a": m("work", 3, "plank", ["core"], ["wrists"]),
  "plank-b": m("work", 3, "plank", ["shoulders"], ["wrists"]),
  "seat-a": m("work", 2, "seated", ["adductors"]),
  "seat-b": m("work", 2, "seated", ["hamstrings"]),
  "lie-a": m("work", 1, "lying", ["glutes"]),
  "lie-b": m("work", 1, "lying", ["lower-back"]),
  "cool-a": m("cooldown", 1, "lying", ["adductors"]),
  "cool-b": m("cooldown", 1, "seated", ["neck"]),
};

const exerciseIds = (queue) => queue.filter((q) => q.type === "exercise" && q.side !== "left").map((q) => q.exercise.id);
const queueSeconds = (queue) => queue.reduce((sum, q) => sum + q.duration, 0);

describe("buildWorkout basics", () => {
  it("returns nothing for an empty pool", () => {
    expect(buildWorkout(5, false, [], undefined, { meta })).toEqual([]);
  });

  it("starts with a prep countdown for the first exercise", () => {
    const queue = buildWorkout(5, false, exercises, undefined, { meta, rng: seeded(1) });
    expect(queue[0]).toMatchObject({ type: "rest", duration: PREP_SECONDS, isPrep: true });
    expect(queue[0].nextExercise.id).toBe(exerciseIds(queue)[0]);
  });

  it.each([false, true])("fills the requested time without overshooting by more than one exercise (random=%s)", (random) => {
    for (const minutes of [5, 10, 20]) {
      const queue = buildWorkout(minutes, random, exercises, undefined, { meta, rng: seeded(minutes) });
      const working = queueSeconds(queue) - PREP_SECONDS;
      expect(working).toBeGreaterThanOrEqual(minutes * 60);
      expect(working).toBeLessThan(minutes * 60 + 30 + REST_SECONDS);
    }
  });

  it("closes with the final exercise, which is never drawn earlier", () => {
    const finale = ex("finale", { bilateral: true, defaultDurationSeconds: 40 });
    const queue = buildWorkout(10, false, [...exercises, finale], finale, { meta, rng: seeded(3) });
    const ids = exerciseIds(queue);
    expect(ids[ids.length - 1]).toBe("finale");
    expect(ids.filter((id) => id === "finale")).toHaveLength(1);
  });

  it("expands a two-sided exercise into right, a rest, then left", () => {
    const sided = [ex("sided", { bilateral: true, defaultDurationSeconds: 20 })];
    const queue = buildWorkout(1, false, sided, undefined, { rng: seeded(1) });
    const body = queue.slice(1, 4);
    expect(body.map((q) => [q.type, q.side ?? q.nextSide])).toEqual([
      ["exercise", "right"],
      ["rest", "left"],
      ["exercise", "left"],
    ]);
    expect(body[1].duration).toBe(REST_BETWEEN_SIDES_SECONDS);
  });
});

describe("random order", () => {
  it("uses every exercise once before any repeats", () => {
    const queue = buildWorkout(30, true, exercises, undefined, { rng: seeded(7) });
    const ids = exerciseIds(queue);
    expect(new Set(ids.slice(0, exercises.length)).size).toBe(exercises.length);
  });

  it("never repeats the same exercise back to back, even across rounds", () => {
    const pair = [ex("a"), ex("b")];
    const ids = exerciseIds(buildWorkout(10, true, pair, undefined, { rng: seeded(2) }));
    for (let i = 1; i < ids.length; i++) expect(ids[i]).not.toBe(ids[i - 1]);
  });
});

describe("smart order", () => {
  const runs = Array.from({ length: 40 }, (_, i) => exerciseIds(buildWorkout(10, false, exercises, undefined, { meta, rng: seeded(i + 1) })));

  it("warms up first, works in the middle and cools down last", () => {
    for (const ids of runs) {
      const phases = ids.map((id) => meta[id].phase);
      const rank = { warmup: 0, work: 1, cooldown: 2 };
      // Within one pass through the pool the phases never go backwards.
      const firstPass = phases.slice(0, exercises.length);
      for (let i = 1; i < firstPass.length; i++) expect(rank[firstPass[i]]).toBeGreaterThanOrEqual(rank[firstPass[i - 1]]);
    }
  });

  it("moves through body positions in a sensible flow inside the main phase", () => {
    for (const ids of runs) {
      const work = ids.slice(0, exercises.length).filter((id) => meta[id].phase === "work");
      const order = work.map((id) => POSITION_ORDER.indexOf(meta[id].position));
      for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThanOrEqual(order[i - 1]);
    }
  });

  it("separates neighbours that work the same muscles when it can", () => {
    const pool = [ex("c1"), ex("c2"), ex("s1"), ex("s2")];
    const mm = {
      c1: m("work", 2, "plank", ["core"]),
      c2: m("work", 2, "plank", ["core"]),
      s1: m("work", 2, "plank", ["shoulders"]),
      s2: m("work", 2, "plank", ["shoulders"]),
    };
    for (let seed = 1; seed <= 30; seed++) {
      const ordered = orderForFlow(pool, mm, seeded(seed)).map((e) => mm[e.id].areas[0]);
      for (let i = 1; i < ordered.length; i++) expect(ordered[i]).not.toBe(ordered[i - 1]);
    }
  });

  it("favours exercises that were not done recently", () => {
    const now = Date.parse("2026-10-12T12:00:00Z");
    const recent = ["warm-a", "stand-a", "plank-a", "seat-a", "lie-a", "cool-a"];
    const lastUsed = Object.fromEntries(recent.map((id) => [id, now]));
    let fresh = 0;
    let total = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const ids = exerciseIds(buildWorkout(2, false, exercises, undefined, { meta, lastUsed, now, rng: seeded(seed) }));
      for (const id of ids) {
        total += 1;
        if (!recent.includes(id)) fresh += 1;
      }
    }
    expect(fresh / total).toBeGreaterThan(0.8);
  });

  it("keeps a recent exercise possible, not forbidden", () => {
    const now = Date.now();
    const lastUsed = Object.fromEntries(exercises.map((e) => [e.id, now]));
    expect(exerciseIds(buildWorkout(5, false, exercises, undefined, { meta, lastUsed, now, rng: seeded(4) })).length).toBeGreaterThan(0);
  });

  it("works without any metadata", () => {
    const ids = exerciseIds(buildWorkout(5, false, exercises, undefined, { rng: seeded(9) }));
    expect(ids.length).toBeGreaterThan(3);
  });
});

describe("recency weight", () => {
  const now = Date.parse("2026-10-12T12:00:00Z");
  const day = 86400000;

  it("prefers never-done over done today, and recovers over about two weeks", () => {
    expect(recencyWeight(undefined, now)).toBe(3);
    expect(recencyWeight(now, now)).toBeCloseTo(0.25);
    expect(recencyWeight(now - 3 * day, now)).toBeGreaterThan(recencyWeight(now - day, now));
    expect(recencyWeight(now - 14 * day, now)).toBeGreaterThan(2.5);
    expect(recencyWeight(now - 365 * day, now)).toBeLessThanOrEqual(3);
  });

  it("weightedOrder returns every item exactly once", () => {
    const ordered = weightedOrder(exercises, { rng: seeded(5) });
    expect(ordered.map((e) => e.id).sort()).toEqual(exercises.map((e) => e.id).sort());
  });
});

describe("protecting sensitive areas", () => {
  it("leaves out exercises that stress a protected joint", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const ids = exerciseIds(buildWorkout(10, false, exercises, undefined, { meta, avoidLoads: ["knees", "wrists", "impact"], rng: seeded(seed) }));
      for (const id of ids) expect(meta[id].load.some((l) => ["knees", "wrists", "impact"].includes(l))).toBe(false);
    }
  });

  it("builds nothing when every exercise stresses a protected joint, leaving the caller to widen the choice", () => {
    const allLoaded = [ex("x"), ex("y")];
    const mm = { x: m("work", 2, "plank", ["core"], ["wrists"]), y: m("work", 2, "plank", ["core"], ["wrists"]) };
    expect(buildWorkout(1, false, allLoaded, undefined, { meta: mm, avoidLoads: ["wrists"] })).toEqual([]);
  });
});

describe("focus areas", () => {
  it("nudge the draw toward the regions the person asked for, without excluding the rest", () => {
    const focus = ["core"]; // plank-a is the only core exercise in the test pool
    let withFocus = 0;
    let without = 0;
    const runs = 120;
    for (let seed = 1; seed <= runs; seed++) {
      const a = exerciseIds(buildWorkout(1, false, exercises, undefined, { meta, focusAreas: focus, rng: seeded(seed) }));
      const b = exerciseIds(buildWorkout(1, false, exercises, undefined, { meta, rng: seeded(seed) }));
      if (a.includes("plank-a")) withFocus += 1;
      if (b.includes("plank-a")) without += 1;
    }
    expect(withFocus).toBeGreaterThan(without);
    expect(withFocus).toBeLessThan(runs);
  });
});

describe("goal pools", () => {
  it("collects the exercises tagged for a goal", () => {
    const tagged = { a: { goals: ["sitting"] }, b: { goals: ["running", "sitting"] }, c: { goals: [] } };
    const pool = [ex("a"), ex("b"), ex("c"), ex("d")];
    expect(poolForGoal("sitting", pool, tagged).map((e) => e.id)).toEqual(["a", "b"]);
    expect(poolForGoal("sleep", pool, tagged)).toEqual([]);
  });
});

describe("picking by type", () => {
  it("auto uses everything", () => {
    expect(filterByType(exercises, "auto", meta)).toHaveLength(exercises.length);
  });

  it("recovery draws on every gentle exercise, not just ones typed as recovery", () => {
    const pool = filterByType(exercises, "recovery", meta);
    expect(pool.map((e) => e.id).sort()).toEqual(["cool-a", "cool-b", "lie-a", "lie-b"]);
  });

  it("recovery falls back to the recovery type when nothing is tagged gentle", () => {
    const typed = [ex("r1", { type: "recovery" }), ex("f1")];
    expect(filterByType(typed, "recovery", {}).map((e) => e.id)).toEqual(["r1"]);
  });

  it("an empty type falls back to the whole bank", () => {
    expect(filterByType(exercises, "cardio", meta)).toHaveLength(exercises.length);
  });
});

describe("quick start", () => {
  it("builds roughly five minutes of only gentle exercises, with real variety", () => {
    const queue = buildQuickStartWorkout(exercises, { meta, rng: seeded(11) });
    const ids = exerciseIds(queue);
    for (const id of ids) expect(meta[id].intensity).toBe(1);
    expect(new Set(ids).size).toBeGreaterThanOrEqual(3);
    expect(queueSeconds(queue) - PREP_SECONDS).toBeGreaterThanOrEqual(300);
  });
});

describe("warm-up", () => {
  const warmups = exercises.filter((e) => meta[e.id].phase === "warmup");
  const strengthOnly = exercises.filter((e) => ["plank-a", "plank-b", "lie-a", "lie-b"].includes(e.id));
  const build = (minutes, random, pool = strengthOnly, extra = {}) =>
    buildWorkout(minutes, random, pool, undefined, { meta, warmups, rng: seeded(minutes + 3), ...extra });

  it("opens a 10-minute session with a warm-up even when the type has none of its own", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const ids = exerciseIds(buildWorkout(10, false, strengthOnly, undefined, { meta, warmups, rng: seeded(seed) }));
      expect(meta[ids[0]].phase).toBe("warmup");
    }
  });

  it("uses one warm-up for 10 to 19 minutes and two from 20", () => {
    const count = (q) => exerciseIds(q).filter((id) => meta[id].phase === "warmup").length;
    expect(count(build(10, false))).toBe(1);
    expect(count(build(20, false))).toBe(2);
  });

  it("skips the warm-up in a short session and in random mode", () => {
    expect(exerciseIds(build(5, false)).some((id) => meta[id].phase === "warmup")).toBe(false);
    expect(exerciseIds(build(10, true)).some((id) => meta[id].phase === "warmup")).toBe(false);
  });

  it("still fills the requested time, warm-up included", () => {
    for (const minutes of [10, 20, 30]) {
      const working = queueSeconds(build(minutes, false)) - PREP_SECONDS;
      expect(working).toBeGreaterThanOrEqual(minutes * 60);
      expect(working).toBeLessThan(minutes * 60 + 30 + REST_SECONDS);
    }
  });

  it("leaves out warm-ups that stress a protected joint, and adds none if none are left", () => {
    const ids = exerciseIds(build(10, false, strengthOnly, { avoidLoads: ["impact"] }));
    expect(ids).not.toContain("warm-a");
    const none = exerciseIds(build(10, false, strengthOnly, { avoidLoads: ["impact"], warmups: [exercises[0]] }));
    expect(none.some((id) => meta[id].phase === "warmup")).toBe(false);
  });

  it("does not use the final exercise as a warm-up", () => {
    const finale = warmups[0];
    const ids = exerciseIds(buildWorkout(10, false, strengthOnly, finale, { meta, warmups, rng: seeded(2) }));
    expect(ids.filter((id) => id === finale.id)).toHaveLength(1);
    expect(ids[ids.length - 1]).toBe(finale.id);
  });
});
