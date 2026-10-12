# Workout History API (Cloudflare Worker + D1)

Stores workout history and private per-person data in a free Cloudflare D1
(SQLite) database, behind PIN protection. No secret keys: D1 access comes
from the binding.

## Install or update

1. **Database** (first install only): dash.cloudflare.com -> Storage &
   Databases -> D1 -> Create, e.g. `workout-history-db`. Leave it empty.
2. **Worker**: Workers & Pages -> `workout-history-api` (or create one) ->
   **Edit code** -> replace everything with `history-api.js` -> **Deploy**.
3. **Binding** (first install only): Settings -> Bindings -> Add -> D1
   Database, variable name exactly `DB`, pick the database. Save and deploy.

The Worker builds and upgrades its own tables on first use, keeping
existing history. There is no SQL to run.

## How protection works

- Reading history is open: it is shared between the people using the app.
- The first device to set a 4-digit PIN for a name **claims** it. After
  that, saving or deleting that name's workouts needs the token its PIN
  login hands out. Unclaimed names stay open so older app versions keep
  working until they update.
- Profiles and saved routines always need a token.
- Five wrong PINs lock the name for 15 minutes. PINs are stored only as a
  salted hash; device tokens only as a hash.
- It stops casual tampering, not a determined attacker (a 4-digit PIN is
  small, and a script can fake the Origin header). Fine for a small group
  of people who trust each other.

## Forgot a PIN

In the D1 console run, with the name filled in (history is kept):

    DELETE FROM device_tokens WHERE user_name = 'NAME';
    DELETE FROM users WHERE name = 'NAME';

The next person to open the app as that name sets a new PIN.

## Endpoints

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/auth/status?name=` | open |
| POST | `/auth/claim` `{name, pin}` | open (this is the login) |
| GET | `/auth/me` | token |
| GET | `/workouts?user=` | open |
| POST | `/workouts` | token if the name is claimed |
| DELETE | `/workouts/:id` | token if the name is claimed |
| GET, PUT | `/profile` | token |
| GET | `/routines` | token |
| PUT, DELETE | `/routines/:id` | token |
