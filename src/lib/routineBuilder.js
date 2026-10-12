import { PHASE_ORDER, POSITION_ORDER } from "../data/exerciseMeta.js";

// The "smart" half of building a workout: which exercises to pick (favouring
// ones not done lately) and what order to put them in (warm up first, calm
// down last, few position changes, not the same muscles twice in a row).
// Pure and seedable, so it can be tested exactly.

const DAY_MS = 86400000;

// Never-done exercises are strongly preferred; ones done today are rarely
// repeated; the preference fades over about two weeks.
export function recencyWeight(lastUsedMs, now) {
  if (!lastUsedMs) return 3;
  const days = Math.max(0, (now - lastUsedMs) / DAY_MS);
  return 0.25 + 2.75 * (1 - Math.exp(-days / 7));
}

// A weighted random order: heavier items tend to come first, but any order
// is possible (Efraimidis-Spirakis sampling).
export function weightedOrder(pool, { lastUsed = {}, now = Date.now(), rng = Math.random } = {}) {
  return pool
    .map((exercise) => {
      const weight = recencyWeight(lastUsed[exercise.id], now);
      return { exercise, key: Math.pow(Math.max(rng(), 1e-9), 1 / weight) };
    })
    .sort((a, b) => b.key - a.key)
    .map((entry) => entry.exercise);
}

const primaryArea = (exercise, meta) => meta[exercise.id]?.areas?.[0] ?? null;

// Warm-ups, then the main work, then cooldown; inside each phase, grouped by
// body position (standing, hands on floor, kneeling, seated, lying) so the
// person moves through the room rather than up and down. Within a group,
// neighbours with the same main muscle area are separated where possible.
export function orderForFlow(items, meta = {}, rng = Math.random) {
  const rank = (exercise) => {
    const m = meta[exercise.id];
    return [m ? PHASE_ORDER.indexOf(m.phase) : 1, m ? POSITION_ORDER.indexOf(m.position) : 0];
  };
  const sorted = items
    .map((exercise) => ({ exercise, rank: rank(exercise), tie: rng() }))
    .sort((a, b) => a.rank[0] - b.rank[0] || a.rank[1] - b.rank[1] || a.tie - b.tie)
    .map((entry) => entry.exercise);

  const sameBlock = (a, b) => {
    const [pa, qa] = rank(a);
    const [pb, qb] = rank(b);
    return pa === pb && qa === qb;
  };
  for (let i = 1; i < sorted.length; i++) {
    const area = primaryArea(sorted[i], meta);
    if (area === null || area !== primaryArea(sorted[i - 1], meta)) continue;
    for (let j = i + 1; j < sorted.length && sameBlock(sorted[i], sorted[j]); j++) {
      if (primaryArea(sorted[j], meta) !== area) {
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
        break;
      }
    }
  }
  return sorted;
}

// Drops exercises that stress a joint the person wants to protect, but never
// returns an empty pool: a workout with a few such moves beats none at all.
export function withoutLoads(pool, meta, avoidLoads) {
  if (!avoidLoads || avoidLoads.length === 0) return pool;
  const safe = pool.filter((e) => !(meta[e.id]?.load ?? []).some((l) => avoidLoads.includes(l)));
  return safe.length > 0 ? safe : pool;
}
