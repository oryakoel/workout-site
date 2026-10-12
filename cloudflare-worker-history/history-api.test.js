import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker, { clampInt, resetSchemaCacheForTests, resolveCompletedAt } from "./history-api.js";

// A minimal stand-in for Cloudflare's D1 binding, backed by a real SQLite
// engine, so the Worker's actual SQL (including the migration) is exercised.
function makeD1(sqlite) {
  // Like D1, statements are only compiled when they run, so a batch can
  // add a column and then index it.
  function prepare(sql) {
    const api = {
      sql,
      params: [],
      bind(...params) {
        api.params = params;
        return api;
      },
      async first() {
        return sqlite.prepare(sql).get(...api.params) ?? null;
      },
      async all() {
        return { results: sqlite.prepare(sql).all(...api.params) };
      },
      async run() {
        const result = sqlite.prepare(sql).run(...api.params);
        return { meta: { changes: Number(result.changes) } };
      },
    };
    return api;
  }
  return {
    prepare,
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        sqlite.exec("COMMIT");
        return out;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

const ORIGIN = "https://oryakoel.github.io";
const LEGACY_SCHEMA = `
  CREATE TABLE workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    workout_type TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    exercise_count INTEGER NOT NULL,
    completed_at TEXT NOT NULL
  );
  INSERT INTO workouts (user_name, workout_type, duration_minutes, exercise_count, completed_at)
  VALUES ('אור', 'flexibility', 10, 5, '2026-09-15T18:00:00.000Z'),
         ('כרמל', 'auto', 20, 9, '2026-09-16T17:00:00.000Z');
`;

let env;
let sqlite;

function setup(legacy = false) {
  sqlite = new DatabaseSync(":memory:");
  if (legacy) sqlite.exec(LEGACY_SCHEMA);
  env = { DB: makeD1(sqlite) };
  resetSchemaCacheForTests();
}

async function call(method, path, { body, token, origin = ORIGIN } = {}) {
  const headers = {};
  if (origin) headers.Origin = origin;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await worker.fetch(
    new Request(`https://worker.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }),
    env,
  );
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

async function claim(name, pin) {
  return call("POST", "/auth/claim", { body: { name, pin } });
}

const workoutBody = (extra = {}) => ({
  userName: "אור",
  workoutType: "flexibility",
  durationMinutes: 10,
  exerciseCount: 5,
  ...extra,
});

beforeEach(() => setup());
afterEach(() => vi.useRealTimers());

describe("origin check", () => {
  it("rejects calls from any other origin, or none", async () => {
    expect((await call("GET", "/workouts", { origin: "https://evil.example" })).status).toBe(403);
    expect((await call("GET", "/workouts", { origin: "" })).status).toBe(403);
  });

  it("answers CORS preflight for the site", async () => {
    expect((await call("OPTIONS", "/workouts")).status).toBe(200);
  });
});

describe("database migration", () => {
  it("builds everything from an empty database", async () => {
    expect((await call("GET", "/workouts")).data).toEqual([]);
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((t) => t.name);
    expect(tables).toEqual(expect.arrayContaining(["workouts", "users", "device_tokens", "profiles", "routines"]));
  });

  it("upgrades the original table in place and keeps every existing row", async () => {
    setup(true);
    const { data } = await call("GET", "/workouts");
    expect(data).toHaveLength(2);
    expect(data.map((w) => w.user_name).sort()).toEqual(["אור", "כרמל"]);
    expect(data[0].status).toBeNull();
    expect(data[0].completed_seconds).toBeNull();
  });

  it("is safe to run again", async () => {
    setup(true);
    await call("GET", "/workouts");
    resetSchemaCacheForTests();
    expect((await call("GET", "/workouts")).data).toHaveLength(2);
  });
});

describe("PIN claim and login", () => {
  it("reports whether a name has been claimed", async () => {
    expect((await call("GET", "/auth/status?name=אור")).data).toEqual({ claimed: false });
    await claim("אור", "1234");
    expect((await call("GET", "/auth/status?name=אור")).data).toEqual({ claimed: true });
  });

  it("claiming a new name sets the PIN and returns a token that identifies the user", async () => {
    const res = await claim("אור", "1234");
    expect(res.status).toBe(201);
    expect(res.data.token).toMatch(/^[0-9a-f]{64}$/);
    expect((await call("GET", "/auth/me", { token: res.data.token })).data).toEqual({ name: "אור" });
  });

  it("never stores the PIN or the token in the clear", async () => {
    const { data } = await claim("אור", "1234");
    const dump = JSON.stringify([sqlite.prepare("SELECT * FROM users").all(), sqlite.prepare("SELECT * FROM device_tokens").all()]);
    expect(dump).not.toContain("1234");
    expect(dump).not.toContain(data.token);
  });

  it("logs in on another device with the right PIN", async () => {
    await claim("אור", "1234");
    const res = await claim("אור", "1234");
    expect(res.status).toBe(200);
    expect(res.data.created).toBe(false);
  });

  it("rejects a wrong PIN and counts down attempts", async () => {
    await claim("אור", "1234");
    const res = await claim("אור", "0000");
    expect(res.status).toBe(401);
    expect(res.data).toEqual({ error: "wrong_pin", attemptsLeft: 4 });
  });

  it("locks the name after five wrong PINs, even for the right PIN, then recovers", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-12T10:00:00Z"));
    await claim("אור", "1234");
    for (let i = 0; i < 4; i++) expect((await claim("אור", "0000")).status).toBe(401);
    const fifth = await claim("אור", "0000");
    expect(fifth.status).toBe(429);
    expect(fifth.data.retryAfterSeconds).toBe(900);
    expect((await claim("אור", "1234")).status).toBe(429);

    vi.setSystemTime(new Date("2026-10-12T10:16:00Z"));
    expect((await claim("אור", "1234")).status).toBe(200);
  });

  it("a correct login resets the failed-attempt counter", async () => {
    await claim("אור", "1234");
    await claim("אור", "0000");
    await claim("אור", "1234");
    expect((await claim("אור", "0000")).data.attemptsLeft).toBe(4);
  });

  it("validates the name and PIN format", async () => {
    expect((await claim("אור", "12")).data.error).toBe("invalid_pin");
    expect((await claim("אור", "12ab")).data.error).toBe("invalid_pin");
    expect((await claim("", "1234")).data.error).toBe("invalid_name");
    expect((await claim("__guest__", "1234")).data.error).toBe("invalid_name");
  });

  it("keeps only the newest tokens per user", async () => {
    for (let i = 0; i < 13; i++) await claim("אור", "1234");
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM device_tokens").get().n).toBe(10);
  });
});

describe("workout writes", () => {
  it("still accepts writes for a name nobody has claimed (older app versions)", async () => {
    const res = await call("POST", "/workouts", { body: workoutBody() });
    expect(res.status).toBe(201);
  });

  it("requires the owner's token once a name is claimed", async () => {
    const owner = (await claim("אור", "1234")).data.token;
    const other = (await claim("כרמל", "5678")).data.token;
    expect((await call("POST", "/workouts", { body: workoutBody() })).status).toBe(401);
    expect((await call("POST", "/workouts", { body: workoutBody(), token: other })).status).toBe(401);
    expect((await call("POST", "/workouts", { body: workoutBody(), token: "f".repeat(64) })).status).toBe(401);
    expect((await call("POST", "/workouts", { body: workoutBody(), token: owner })).status).toBe(201);
  });

  it("stores the richer session fields and clamps absurd values", async () => {
    await call("POST", "/workouts", {
      body: workoutBody({
        clientId: "abc-12345678",
        plannedSeconds: 600,
        completedSeconds: 480,
        exercisesDone: 4,
        status: "partial",
        durationMinutes: 99999,
      }),
    });
    const [row] = (await call("GET", "/workouts")).data;
    expect(row).toMatchObject({ planned_seconds: 600, completed_seconds: 480, exercises_done: 4, status: "partial", duration_minutes: 600 });
  });

  it("ignores an unknown status", async () => {
    await call("POST", "/workouts", { body: workoutBody({ status: "hacked" }) });
    expect((await call("GET", "/workouts")).data[0].status).toBeNull();
  });

  it("is idempotent for the same clientId, so offline retries cannot duplicate", async () => {
    const body = workoutBody({ clientId: "retry-12345678" });
    expect((await call("POST", "/workouts", { body })).status).toBe(201);
    const again = await call("POST", "/workouts", { body });
    expect(again.status).toBe(200);
    expect(again.data.duplicate).toBe(true);
    expect((await call("GET", "/workouts")).data).toHaveLength(1);
  });

  it("rejects a malformed or oversized body", async () => {
    const bad = await worker.fetch(
      new Request("https://worker.test/workouts", { method: "POST", headers: { Origin: ORIGIN }, body: "{nope" }),
      env,
    );
    expect(bad.status).toBe(400);
    const huge = await call("POST", "/workouts", { body: workoutBody({ filler: "x".repeat(20000) }) });
    expect(huge.status).toBe(413);
  });

  it("requires a user name and workout type", async () => {
    expect((await call("POST", "/workouts", { body: { durationMinutes: 5 } })).status).toBe(400);
  });
});

describe("completed_at handling", () => {
  const now = Date.parse("2026-10-12T12:00:00Z");

  it("keeps an offline workout's real finish time", () => {
    expect(resolveCompletedAt("2026-10-10T08:00:00.000Z", now)).toBe("2026-10-10T08:00:00.000Z");
  });

  it("falls back to server time for missing, junk, far-past or future values", () => {
    const serverNow = new Date(now).toISOString();
    expect(resolveCompletedAt(undefined, now)).toBe(serverNow);
    expect(resolveCompletedAt("not a date", now)).toBe(serverNow);
    expect(resolveCompletedAt("2020-01-01T00:00:00Z", now)).toBe(serverNow);
    expect(resolveCompletedAt("2027-01-01T00:00:00Z", now)).toBe(serverNow);
  });

  it("clampInt rounds, clamps and rejects non-numbers", () => {
    expect(clampInt(5.6, 0, 10)).toBe(6);
    expect(clampInt(-3, 0, 10)).toBe(0);
    expect(clampInt(99, 0, 10)).toBe(10);
    expect(clampInt("7", 0, 10)).toBeNull();
    expect(clampInt(undefined, 0, 10)).toBeNull();
  });
});

describe("deleting workouts", () => {
  it("lets anyone delete rows of an unclaimed name", async () => {
    await call("POST", "/workouts", { body: workoutBody() });
    const { id } = (await call("GET", "/workouts")).data[0];
    expect((await call("DELETE", `/workouts/${id}`)).data.deleted).toBe(1);
  });

  it("only lets the owner delete rows of a claimed name", async () => {
    const owner = (await claim("אור", "1234")).data.token;
    const other = (await claim("כרמל", "5678")).data.token;
    await call("POST", "/workouts", { body: workoutBody(), token: owner });
    const { id } = (await call("GET", "/workouts")).data[0];
    expect((await call("DELETE", `/workouts/${id}`)).status).toBe(401);
    expect((await call("DELETE", `/workouts/${id}`, { token: other })).status).toBe(401);
    expect((await call("DELETE", `/workouts/${id}`, { token: owner })).data.deleted).toBe(1);
    expect((await call("GET", "/workouts")).data).toHaveLength(0);
  });

  it("claiming a name takes over the existing history under it", async () => {
    setup(true);
    const owner = (await claim("אור", "1234")).data.token;
    const { id } = (await call("GET", "/workouts?user=אור")).data[0];
    expect((await call("DELETE", `/workouts/${id}`)).status).toBe(401);
    expect((await call("DELETE", `/workouts/${id}`, { token: owner })).status).toBe(200);
  });

  it("reading history stays open to everyone", async () => {
    await claim("אור", "1234");
    expect((await call("GET", "/workouts")).status).toBe(200);
  });
});

describe("private profile", () => {
  it("needs a token for both reading and writing", async () => {
    expect((await call("GET", "/profile")).status).toBe(401);
    expect((await call("PUT", "/profile", { body: { data: { goal: "x" } } })).status).toBe(401);
  });

  it("round-trips per user and keeps users separate", async () => {
    const a = (await claim("אור", "1234")).data.token;
    const b = (await claim("כרמל", "5678")).data.token;
    expect((await call("GET", "/profile", { token: a })).data).toEqual({ data: null });
    await call("PUT", "/profile", { token: a, body: { data: { goal: "back", weeklyGoal: 4 } } });
    expect((await call("GET", "/profile", { token: a })).data).toEqual({ data: { goal: "back", weeklyGoal: 4 } });
    expect((await call("GET", "/profile", { token: b })).data).toEqual({ data: null });
  });

  it("rejects missing or oversized data", async () => {
    const t = (await claim("אור", "1234")).data.token;
    expect((await call("PUT", "/profile", { token: t, body: {} })).status).toBe(400);
    expect((await call("PUT", "/profile", { token: t, body: { data: { blob: "x".repeat(9000) } } })).status).toBe(413);
  });
});

describe("saved routines", () => {
  const id = "routine-0001";

  it("needs a token", async () => {
    expect((await call("GET", "/routines")).status).toBe(401);
    expect((await call("PUT", `/routines/${id}`, { body: { name: "x", data: {} } })).status).toBe(401);
  });

  it("creates, lists, updates and deletes", async () => {
    const t = (await claim("אור", "1234")).data.token;
    await call("PUT", `/routines/${id}`, { token: t, body: { name: "בוקר", data: { steps: [1, 2] } } });
    await call("PUT", `/routines/${id}`, { token: t, body: { name: "בוקר ארוך", data: { steps: [1, 2, 3] } } });
    const list = (await call("GET", "/routines", { token: t })).data.routines;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id, name: "בוקר ארוך", data: { steps: [1, 2, 3] } });
    await call("DELETE", `/routines/${id}`, { token: t });
    expect((await call("GET", "/routines", { token: t })).data.routines).toHaveLength(0);
  });

  it("will not let one user touch another's routine", async () => {
    const a = (await claim("אור", "1234")).data.token;
    const b = (await claim("כרמל", "5678")).data.token;
    await call("PUT", `/routines/${id}`, { token: a, body: { name: "שלי", data: {} } });
    expect((await call("PUT", `/routines/${id}`, { token: b, body: { name: "גנוב", data: {} } })).status).toBe(403);
    await call("DELETE", `/routines/${id}`, { token: b });
    expect((await call("GET", "/routines", { token: a })).data.routines).toHaveLength(1);
  });

  it("caps routines per user and validates ids and bodies", async () => {
    const t = (await claim("אור", "1234")).data.token;
    for (let i = 0; i < 30; i++) {
      const res = await call("PUT", `/routines/routine-${String(i).padStart(4, "0")}`, { token: t, body: { name: `r${i}`, data: {} } });
      expect(res.status).toBe(200);
    }
    expect((await call("PUT", "/routines/routine-9999", { token: t, body: { name: "extra", data: {} } })).status).toBe(409);
    expect((await call("PUT", "/routines/x", { token: t, body: { name: "bad id", data: {} } })).status).toBe(404);
    expect((await call("PUT", "/routines/routine-0001", { token: t, body: { data: {} } })).status).toBe(400);
  });
});

describe("unknown routes", () => {
  it("return a JSON 404", async () => {
    expect((await call("GET", "/nope")).status).toBe(404);
  });
});
