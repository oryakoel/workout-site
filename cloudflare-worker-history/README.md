# Workout History API (Cloudflare Worker + D1)

Stores and serves workout history (who trained, workout type, duration,
exercise count, when) in a free Cloudflare D1 (SQLite) database, via a
small Worker. No secret key needed — D1 access comes from the binding
itself, not an API key.

## 1. Create the D1 database

1. Go to https://dash.cloudflare.com → **Storage & Databases** → **D1
   SQL Database** → **Create**.
2. Name it, e.g., `workout-history-db` → **Create**.
3. Open it, go to the **Console** tab, paste in the contents of
   `schema.sql` from this folder, and run it. This creates the
   `workouts` table.

## 2. Create the Worker

1. **Compute (Workers & Pages)** → **Create application** → **Start
   with Hello World!** → name it, e.g., `workout-history-api` →
   Deploy.
2. **Edit code** → delete everything → paste in the contents of
   `history-api.js` from this folder → **Deploy**.

## 3. Bind the D1 database to the Worker

1. Back on the Worker's page → **Settings** → **Bindings** → **Add**.
2. Type: **D1 Database**.
3. Variable name: `DB` (must be exactly this — the code reads
   `env.DB`).
4. Database: select `workout-history-db` (the one created in step 1).
5. **Save and deploy**.

## 4. Get the URL

Copy the Worker's URL from the top of its page — looks like
`https://workout-history-api.<your-subdomain>.workers.dev` — and send
it back so it can be wired into the site.
