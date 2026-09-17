// Cloudflare Worker: small JSON API backed by a D1 (SQLite) database for
// logging and reading workout history. Deploy separately on Cloudflare
// (see README in this folder) and bind the D1 database as "DB" — no
// secret key needed here, D1 access is handled by the binding itself.

const ALLOWED_ORIGIN = "https://oryakoel.github.io";
const MAX_NAME_LENGTH = 50;
const MAX_TYPE_LENGTH = 50;
const HISTORY_LIMIT = 200;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders();

    // Same protection as the TTS proxy: a real browser call from the site
    // always sends this Origin header and can't fake it.
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403, headers });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/workouts") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response("Invalid JSON", { status: 400, headers });
      }

      const userName = typeof body.userName === "string" ? body.userName.trim().slice(0, MAX_NAME_LENGTH) : "";
      const workoutType = typeof body.workoutType === "string" ? body.workoutType.trim().slice(0, MAX_TYPE_LENGTH) : "";
      const durationMinutes = Number.isFinite(body.durationMinutes) ? Math.max(0, Math.round(body.durationMinutes)) : 0;
      const exerciseCount = Number.isFinite(body.exerciseCount) ? Math.max(0, Math.round(body.exerciseCount)) : 0;

      if (!userName || !workoutType) {
        return new Response("Missing userName or workoutType", { status: 400, headers });
      }

      const completedAt = new Date().toISOString();
      await env.DB.prepare(
        "INSERT INTO workouts (user_name, workout_type, duration_minutes, exercise_count, completed_at) VALUES (?, ?, ?, ?, ?)"
      )
        .bind(userName, workoutType, durationMinutes, exerciseCount, completedAt)
        .run();

      return json({ ok: true }, 201, headers);
    }

    if (request.method === "GET" && url.pathname === "/workouts") {
      const userFilter = url.searchParams.get("user");
      let query =
        "SELECT id, user_name, workout_type, duration_minutes, exercise_count, completed_at FROM workouts";
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

    if (request.method === "DELETE" && url.pathname.startsWith("/workouts/")) {
      const id = Number(url.pathname.slice("/workouts/".length));
      if (!Number.isInteger(id) || id <= 0) {
        return new Response("Invalid id", { status: 400, headers });
      }
      await env.DB.prepare("DELETE FROM workouts WHERE id = ?").bind(id).run();
      return json({ ok: true }, 200, headers);
    }

    return new Response("Not found", { status: 404, headers });
  },
};
