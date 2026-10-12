// Cloudflare Worker: JSON API over a D1 (SQLite) database for workout
// history, with per-name PIN protection. Paste this whole file into the
// Worker's code editor (see README). The database is migrated by the
// Worker itself on first use, so there is no SQL to run by hand.
//
// Trust model, in short:
//  - Reading history is open (it's shared between the people using the app).
//  - A name becomes "claimed" the first time someone sets a 4-digit PIN for
//    it. After that, writing or deleting that name's data needs the device
//    token the PIN login hands out. Names nobody has claimed stay open, so
//    older app versions keep working until they update.
//  - Profiles and saved routines are private: always require the token.

const ALLOWED_ORIGIN = "https://oryakoel.github.io";

const MAX_NAME_LENGTH = 50;
const MAX_TYPE_LENGTH = 50;
const MAX_ROUTINE_NAME_LENGTH = 60;
const HISTORY_LIMIT = 3650;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_JSON_BYTES = 8 * 1024;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_TOKENS_PER_USER = 10;
const MAX_ROUTINES_PER_USER = 30;
// A workout finished offline is uploaded later with its real finish time;
// accept that only within a sane window so history can't be rewritten.
const BACKDATE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const FUTURE_SLACK_MS = 5 * 60 * 1000;
const STATUSES = ["completed", "partial"];

const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

// ---------- small pure helpers (exported for tests) ----------

export function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function clampInt(value, min, max) {
  if (!Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function resolveCompletedAt(value, nowMs) {
  const parsed = typeof value === "string" ? Date.parse(value) : NaN;
  const valid = Number.isFinite(parsed) && parsed >= nowMs - BACKDATE_WINDOW_MS && parsed <= nowMs + FUTURE_SLACK_MS;
  return new Date(valid ? parsed : nowMs).toISOString();
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(text) {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))));
}

function randomHex(byteCount) {
  return toHex(crypto.getRandomValues(new Uint8Array(byteCount)));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

// ---------- database setup ----------

const WORKOUT_EXTRA_COLUMNS = [
  ["client_id", "TEXT"],
  ["planned_seconds", "INTEGER"],
  ["completed_seconds", "INTEGER"],
  ["exercises_done", "INTEGER"],
  ["status", "TEXT"],
];

async function migrate(db) {
  await db.batch([
    db.prepare(
      "CREATE TABLE IF NOT EXISTS workouts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_name TEXT NOT NULL, workout_type TEXT NOT NULL, duration_minutes INTEGER NOT NULL, exercise_count INTEGER NOT NULL, completed_at TEXT NOT NULL)",
    ),
  ]);

  const { results } = await db.prepare("PRAGMA table_info(workouts)").all();
  const existing = new Set(results.map((column) => column.name));
  const statements = WORKOUT_EXTRA_COLUMNS.filter(([name]) => !existing.has(name)).map(([name, type]) =>
    db.prepare(`ALTER TABLE workouts ADD COLUMN ${name} ${type}`),
  );

  statements.push(
    db.prepare("CREATE INDEX IF NOT EXISTS idx_workouts_completed_at ON workouts (completed_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_workouts_user_name ON workouts (user_name)"),
    db.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_client_id ON workouts (client_id) WHERE client_id IS NOT NULL",
    ),
    db.prepare(
      "CREATE TABLE IF NOT EXISTS users (name TEXT PRIMARY KEY, pin_salt TEXT NOT NULL, pin_hash TEXT NOT NULL, failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until TEXT, created_at TEXT NOT NULL)",
    ),
    db.prepare(
      "CREATE TABLE IF NOT EXISTS device_tokens (token_hash TEXT PRIMARY KEY, user_name TEXT NOT NULL, created_at TEXT NOT NULL)",
    ),
    db.prepare(
      "CREATE TABLE IF NOT EXISTS profiles (user_name TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)",
    ),
    db.prepare(
      "CREATE TABLE IF NOT EXISTS routines (id TEXT PRIMARY KEY, user_name TEXT NOT NULL, name TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)",
    ),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_routines_user_name ON routines (user_name)"),
  );
  await db.batch(statements);
}

// One migration per Worker instance. If two instances race, the loser's
// batch fails harmlessly (it rolls back); a retry then finds nothing to do.
let schemaPromise = null;

function ensureSchema(db) {
  if (!schemaPromise) {
    schemaPromise = migrate(db).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

export function resetSchemaCacheForTests() {
  schemaPromise = null;
}

// ---------- auth ----------

async function authUser(request, env) {
  const match = /^Bearer ([0-9a-f]{64})$/.exec(request.headers.get("Authorization") || "");
  if (!match) return null;
  const row = await env.DB.prepare("SELECT user_name FROM device_tokens WHERE token_hash = ?")
    .bind(await sha256Hex(match[1]))
    .first();
  return row ? row.user_name : null;
}

// Null means "allowed". For a claimed name only that name's token passes.
async function denyUnlessOwner(request, env, userName, headers) {
  const claimed = await env.DB.prepare("SELECT 1 AS found FROM users WHERE name = ?").bind(userName).first();
  if (!claimed) return null;
  return (await authUser(request, env)) === userName ? null : json({ error: "unauthorized" }, 401, headers);
}

async function issueToken(env, userName) {
  const token = randomHex(32);
  await env.DB.prepare("INSERT INTO device_tokens (token_hash, user_name, created_at) VALUES (?, ?, ?)")
    .bind(await sha256Hex(token), userName, new Date().toISOString())
    .run();
  await env.DB.prepare(
    "DELETE FROM device_tokens WHERE user_name = ? AND token_hash NOT IN (SELECT token_hash FROM device_tokens WHERE user_name = ? ORDER BY created_at DESC, rowid DESC LIMIT ?)",
  )
    .bind(userName, userName, MAX_TOKENS_PER_USER)
    .run();
  return token;
}

async function claim(env, body, headers) {
  const name = cleanText(body.name, MAX_NAME_LENGTH);
  const pin = typeof body.pin === "string" ? body.pin : "";
  if (!name || name.startsWith("__")) return json({ error: "invalid_name" }, 400, headers);
  if (!/^\d{4}$/.test(pin)) return json({ error: "invalid_pin" }, 400, headers);

  const now = Date.now();
  let user = await env.DB.prepare("SELECT * FROM users WHERE name = ?").bind(name).first();

  if (!user) {
    const salt = randomHex(16);
    const insert = await env.DB.prepare(
      "INSERT OR IGNORE INTO users (name, pin_salt, pin_hash, failed_attempts, created_at) VALUES (?, ?, ?, 0, ?)",
    )
      .bind(name, salt, await sha256Hex(`${salt}:${name}:${pin}`), new Date(now).toISOString())
      .run();
    if (insert.meta.changes === 1) {
      return json({ token: await issueToken(env, name), created: true }, 201, headers);
    }
    // Another device claimed this name a moment earlier: treat this as an
    // ordinary login against that device's PIN.
    user = await env.DB.prepare("SELECT * FROM users WHERE name = ?").bind(name).first();
  }

  const lockedUntil = user.locked_until ? Date.parse(user.locked_until) : 0;
  if (lockedUntil > now) {
    return json({ error: "locked", retryAfterSeconds: Math.ceil((lockedUntil - now) / 1000) }, 429, headers);
  }

  const expected = await sha256Hex(`${user.pin_salt}:${name}:${pin}`);
  if (safeEqual(expected, user.pin_hash)) {
    await env.DB.prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE name = ?").bind(name).run();
    return json({ token: await issueToken(env, name), created: false }, 200, headers);
  }

  const failed = user.failed_attempts + 1;
  if (failed >= MAX_FAILED_ATTEMPTS) {
    await env.DB.prepare("UPDATE users SET failed_attempts = 0, locked_until = ? WHERE name = ?")
      .bind(new Date(now + LOCKOUT_MS).toISOString(), name)
      .run();
    return json({ error: "locked", retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000) }, 429, headers);
  }
  await env.DB.prepare("UPDATE users SET failed_attempts = ? WHERE name = ?").bind(failed, name).run();
  return json({ error: "wrong_pin", attemptsLeft: MAX_FAILED_ATTEMPTS - failed }, 401, headers);
}

// ---------- request handling ----------

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return { tooLarge: true };
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" ? { value } : { invalid: true };
  } catch {
    return { invalid: true };
  }
}

function badBody(parsed, headers) {
  if (parsed.tooLarge) return json({ error: "too_large" }, 413, headers);
  if (parsed.invalid) return json({ error: "invalid_json" }, 400, headers);
  return null;
}

async function handle(request, env, headers) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method;

  // ----- auth -----
  if (method === "GET" && path === "/auth/status") {
    const name = cleanText(url.searchParams.get("name"), MAX_NAME_LENGTH);
    const row = name ? await env.DB.prepare("SELECT 1 AS found FROM users WHERE name = ?").bind(name).first() : null;
    return json({ claimed: Boolean(row) }, 200, headers);
  }

  if (method === "POST" && path === "/auth/claim") {
    const parsed = await readJson(request);
    return badBody(parsed, headers) || claim(env, parsed.value, headers);
  }

  if (method === "GET" && path === "/auth/me") {
    const name = await authUser(request, env);
    return name ? json({ name }, 200, headers) : json({ error: "unauthorized" }, 401, headers);
  }

  // ----- workouts -----
  if (method === "GET" && path === "/workouts") {
    const userFilter = url.searchParams.get("user");
    let query =
      "SELECT id, user_name, workout_type, duration_minutes, exercise_count, completed_at, planned_seconds, completed_seconds, exercises_done, status FROM workouts";
    const params = [];
    if (userFilter) {
      query += " WHERE user_name = ?";
      params.push(userFilter.slice(0, MAX_NAME_LENGTH));
    }
    query += " ORDER BY completed_at DESC LIMIT ?";
    params.push(HISTORY_LIMIT);
    const { results } = await env.DB.prepare(query)
      .bind(...params)
      .all();
    return json(results, 200, headers);
  }

  if (method === "POST" && path === "/workouts") {
    const parsed = await readJson(request);
    const bad = badBody(parsed, headers);
    if (bad) return bad;
    const body = parsed.value;

    const userName = cleanText(body.userName, MAX_NAME_LENGTH);
    const workoutType = cleanText(body.workoutType, MAX_TYPE_LENGTH);
    if (!userName || !workoutType) return json({ error: "missing_fields" }, 400, headers);

    const denied = await denyUnlessOwner(request, env, userName, headers);
    if (denied) return denied;

    const clientId = typeof body.clientId === "string" && ID_PATTERN.test(body.clientId) ? body.clientId : null;
    const result = await env.DB.prepare(
      "INSERT OR IGNORE INTO workouts (user_name, workout_type, duration_minutes, exercise_count, completed_at, client_id, planned_seconds, completed_seconds, exercises_done, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        userName,
        workoutType,
        clampInt(body.durationMinutes, 0, 600) ?? 0,
        clampInt(body.exerciseCount, 0, 500) ?? 0,
        resolveCompletedAt(body.completedAt, Date.now()),
        clientId,
        clampInt(body.plannedSeconds, 0, 36000),
        clampInt(body.completedSeconds, 0, 36000),
        clampInt(body.exercisesDone, 0, 500),
        STATUSES.includes(body.status) ? body.status : null,
      )
      .run();
    const duplicate = result.meta.changes === 0;
    return json({ ok: true, duplicate }, duplicate ? 200 : 201, headers);
  }

  const workoutMatch = /^\/workouts\/(\d+)$/.exec(path);
  if (method === "DELETE" && workoutMatch) {
    const id = Number(workoutMatch[1]);
    if (!Number.isInteger(id) || id <= 0) return json({ error: "invalid_id" }, 400, headers);
    const row = await env.DB.prepare("SELECT user_name FROM workouts WHERE id = ?").bind(id).first();
    if (!row) return json({ ok: true, deleted: 0 }, 200, headers);
    const denied = await denyUnlessOwner(request, env, row.user_name, headers);
    if (denied) return denied;
    await env.DB.prepare("DELETE FROM workouts WHERE id = ?").bind(id).run();
    return json({ ok: true, deleted: 1 }, 200, headers);
  }

  // ----- private data: needs a valid token -----
  if (path === "/profile" || path.startsWith("/routines")) {
    const owner = await authUser(request, env);
    if (!owner) return json({ error: "unauthorized" }, 401, headers);

    if (path === "/profile" && method === "GET") {
      const row = await env.DB.prepare("SELECT data FROM profiles WHERE user_name = ?").bind(owner).first();
      return json({ data: row ? JSON.parse(row.data) : null }, 200, headers);
    }

    if (path === "/profile" && method === "PUT") {
      const parsed = await readJson(request);
      const bad = badBody(parsed, headers);
      if (bad) return bad;
      const data = parsed.value.data;
      if (!data || typeof data !== "object") return json({ error: "invalid_data" }, 400, headers);
      const text = JSON.stringify(data);
      if (text.length > MAX_JSON_BYTES) return json({ error: "too_large" }, 413, headers);
      await env.DB.prepare(
        "INSERT INTO profiles (user_name, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_name) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
      )
        .bind(owner, text, new Date().toISOString())
        .run();
      return json({ ok: true }, 200, headers);
    }

    if (path === "/routines" && method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT id, name, data, updated_at FROM routines WHERE user_name = ? ORDER BY updated_at DESC",
      )
        .bind(owner)
        .all();
      return json({ routines: results.map((r) => ({ ...r, data: JSON.parse(r.data) })) }, 200, headers);
    }

    const routineMatch = /^\/routines\/([A-Za-z0-9-]+)$/.exec(path);
    if (routineMatch && ID_PATTERN.test(routineMatch[1])) {
      const id = routineMatch[1];
      const existing = await env.DB.prepare("SELECT user_name FROM routines WHERE id = ?").bind(id).first();
      if (existing && existing.user_name !== owner) return json({ error: "forbidden" }, 403, headers);

      if (method === "PUT") {
        const parsed = await readJson(request);
        const bad = badBody(parsed, headers);
        if (bad) return bad;
        const name = cleanText(parsed.value.name, MAX_ROUTINE_NAME_LENGTH);
        const data = parsed.value.data;
        if (!name || !data || typeof data !== "object") return json({ error: "invalid_data" }, 400, headers);
        const text = JSON.stringify(data);
        if (text.length > MAX_JSON_BYTES) return json({ error: "too_large" }, 413, headers);
        if (!existing) {
          const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM routines WHERE user_name = ?").bind(owner).first();
          if (count.n >= MAX_ROUTINES_PER_USER) return json({ error: "too_many_routines" }, 409, headers);
        }
        await env.DB.prepare(
          "INSERT INTO routines (id, user_name, name, data, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, data = excluded.data, updated_at = excluded.updated_at",
        )
          .bind(id, owner, name, text, new Date().toISOString())
          .run();
        return json({ ok: true }, 200, headers);
      }

      if (method === "DELETE") {
        await env.DB.prepare("DELETE FROM routines WHERE id = ? AND user_name = ?").bind(id, owner).run();
        return json({ ok: true }, 200, headers);
      }
    }
  }

  return json({ error: "not_found" }, 404, headers);
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders();

    // A real browser call from the site always sends this Origin header and
    // can't fake it; anything else is rejected outright. This doesn't stop
    // a script that deliberately fakes the header — the PINs do that part.
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) return new Response("Forbidden", { status: 403, headers });
    if (request.method === "OPTIONS") return new Response(null, { headers });

    try {
      await ensureSchema(env.DB);
      return await handle(request, env, headers);
    } catch (error) {
      console.error("history-api error:", error);
      return json({ error: "server_error" }, 500, headers);
    }
  },
};
