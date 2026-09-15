-- Run this once against the D1 database (via the D1 "Console" tab in the
-- Cloudflare dashboard) before deploying history-api.js. See README.md.

CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  exercise_count INTEGER NOT NULL,
  completed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workouts_completed_at ON workouts (completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_user_name ON workouts (user_name);
