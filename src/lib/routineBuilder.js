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

// How much more likely an exercise is to be picked when it works a region
// the person asked to focus on. A nudge, not a rule: variety still wins.
const FOCUS_BOOST = 1.8;

function focusMultiplier(exercise, meta, focusAreas) {
  if (!focusAreas || focusAreas.length === 0) return 1;
  return (meta[exercise.id]?.areas ?? []).some((a) => focusAreas.includes(a)) ? FOCUS_BOOST : 1;
}

const familyOf = (exercise, meta) => meta[exercise.id]?.family ?? null;

// Keeps the first exercise of each family where it is and sends the rest of
// that family to the back, so a session only uses a second one when it has
// run out of other choices.
export function spreadFamilies(order, meta = {}) {
  const seen = new Set();
  const first = [];
  const later = [];
  for (const exercise of order) {
    const family = familyOf(exercise, meta);
    if (family && seen.has(family)) later.push(exercise);
    else {
      first.push(exercise);
      if (family) seen.add(family);
    }
  }
  return [...first, ...later];
}

// True when two exercises are the same move or a close variation.
export const sameFamily = (a, b, meta = {}) => a.id === b.id || (familyOf(a, meta) !== null && familyOf(a, meta) === familyOf(b, meta));

// A weighted random order: heavier items tend to come first, but any order
// is possible (Efraimidis-Spirakis sampling).
export function weightedOrder(pool, { lastUsed = {}, now = Date.now(), rng = Math.random, meta = {}, focusAreas = [] } = {}) {
  const ordered = pool
    .map((exercise) => {
      const weight = recencyWeight(lastUsed[exercise.id], now) * focusMultiplier(exercise, meta, focusAreas);
      return { exercise, key: Math.pow(Math.max(rng(), 1e-9), 1 / weight) };
    })
    .sort((a, b) => b.key - a.key)
    .map((entry) => entry.exercise);
  return spreadFamilies(ordered, meta);
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

  // Then the same for close variations: never back to back. A stand-in from
  // the same block is preferred; failing that, from the same phase (a small
  // position change beats doing near-identical moves twice in a row).
  const samePhase = (a, b) => rank(a)[0] === rank(b)[0];
  const separate = (i, within) => {
    for (let j = i + 1; j < sorted.length && within(sorted[i], sorted[j]); j++) {
      if (!sameFamily(sorted[j], sorted[i - 1], meta)) {
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
        return true;
      }
    }
    return false;
  };
  for (let i = 1; i < sorted.length; i++) {
    if (!sameFamily(sorted[i], sorted[i - 1], meta)) continue;
    if (!separate(i, sameBlock)) separate(i, samePhase);
  }
  return sorted;
}

// Drops every exercise that stresses a joint the person wants to protect.
// Strict on purpose: it may return an empty list, and the caller then widens
// the choice (to other kinds of exercise) instead of quietly ignoring it.
export function withoutLoads(pool, meta, avoidLoads) {
  if (!avoidLoads || avoidLoads.length === 0) return pool;
  return pool.filter((e) => !(meta[e.id]?.load ?? []).some((l) => avoidLoads.includes(l)));
}
