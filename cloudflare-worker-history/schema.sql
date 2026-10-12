-- Reference only: history-api.js creates and upgrades all of this by itself
-- the first time it runs, so there is nothing to paste into the D1 console.
-- Kept here to show the shape of the database.

CREATE TABLE workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  exercise_count INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  client_id TEXT,            -- idempotency key so offline retries can't duplicate
  planned_seconds INTEGER,
  completed_seconds INTEGER,
  exercises_done INTEGER,
  status TEXT                -- 'completed' | 'partial' (NULL on older rows)
);

CREATE TABLE users (         -- a row exists once someone has set a PIN for the name
  name TEXT PRIMARY KEY,
  pin_salt TEXT NOT NULL,
  pin_hash TEXT NOT NULL,    -- sha256(salt:name:pin); the PIN itself is never stored
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE device_tokens ( -- one per signed-in device; only the hash is stored
  token_hash TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE profiles (user_name TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE routines (id TEXT PRIMARY KEY, user_name TEXT NOT NULL, name TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL);
