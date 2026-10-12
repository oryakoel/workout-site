// Weekly consistency and the plant's growth, computed from workout history.
// Rest days are fine: what matters is how many days a week you train.
//
// A day counts as "done" when it has a completed session; a day with only
// a partial session is shown, but doesn't count toward the goal. Weeks run
// Sunday to Saturday, in the device's local time.

export const DEFAULT_WEEKLY_GOAL = 4;
const RECENT_WEEKS = 8;
// More than a week without a counted session and the plant starts to droop.
const WILT_AFTER_DAYS = 8;

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfWeek(date) {
  const day = startOfDay(date);
  return addDays(day, -day.getDay());
}

export function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// Hebrew count of days: יום אחד, יומיים, 3 ימים.
export function daysLabel(count) {
  if (count === 1) return "יום אחד";
  if (count === 2) return "יומיים";
  return `${count} ימים`;
}

// A text alternative for the plant picture, for screen readers.
export function plantLabel({ condition, level, garden }) {
  if (condition === "seed") return "זרע בעציץ, מחכה לאימון הראשון";
  const base = condition === "wilting" ? "צמח נבול" : `צמח בשלב ${Math.floor(level)}`;
  return garden.flowers ? `${base}, עם גינה של ${garden.flowers} פרחים` : base;
}

function buildDayMap(entries) {
  const days = new Map();
  for (const entry of entries) {
    const date = startOfDay(new Date(entry.completed_at));
    if (Number.isNaN(date.getTime())) continue;
    const key = dayKey(date);
    const status = entry.status === "partial" ? "partial" : "done";
    const known = days.get(key);
    // Several sessions in a day: the best one decides.
    if (!known || (known.status === "partial" && status === "done")) days.set(key, { date, status });
  }
  return days;
}

function weekDays(weekStart, dayMap, today) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const found = dayMap.get(dayKey(date));
    return {
      date,
      isToday: dayKey(date) === dayKey(today),
      isFuture: date > today,
      status: found ? found.status : "none",
    };
  });
}

const countDone = (days) => days.filter((d) => d.status === "done").length;

// The garden that accumulates and never shrinks: every goal week adds to it,
// and what it contains keeps changing as it grows.
export function gardenFor(goalWeeks) {
  return {
    flowers: Math.floor(goalWeeks / 4),
    butterflies: Math.floor(goalWeeks / 13),
    trees: Math.floor(goalWeeks / 26),
    sun: goalWeeks >= 52,
  };
}

export function computeConsistency(entries, { goal = DEFAULT_WEEKLY_GOAL, now = new Date() } = {}) {
  const today = startOfDay(now);
  const thisWeekStart = startOfWeek(today);
  const dayMap = buildDayMap(entries);

  const doneDates = [...dayMap.values()].filter((d) => d.status === "done").map((d) => d.date);
  const firstDone = doneDates.length ? new Date(Math.min(...doneDates)) : null;
  const lastDone = doneDates.length ? new Date(Math.max(...doneDates)) : null;

  // Replay every finished week, oldest first. Meeting the goal grows the
  // plant a stage; training less but at all leaves it as it is; a week with
  // nothing costs at most one stage. Weeks before the first session never
  // count against anyone.
  let stage = 0;
  let goalWeeks = 0;
  let run = 0;
  let bestRun = 0;
  if (firstDone) {
    for (let start = startOfWeek(firstDone); start < thisWeekStart; start = addDays(start, 7)) {
      const done = countDone(weekDays(start, dayMap, today));
      if (done >= goal) {
        stage += 1;
        goalWeeks += 1;
        run += 1;
        bestRun = Math.max(bestRun, run);
      } else {
        run = 0;
        if (done === 0) stage = Math.max(0, stage - 1);
      }
    }
  }

  // The week in progress never counts against you yet; it only adds.
  const days = weekDays(thisWeekStart, dayMap, today);
  const doneThisWeek = countDone(days);
  const met = doneThisWeek >= goal;
  const progress = Math.min(1, doneThisWeek / goal);
  if (met) {
    goalWeeks += 1;
    run += 1;
    bestRun = Math.max(bestRun, run);
  }

  const recentWeeks = Array.from({ length: RECENT_WEEKS }, (_, i) => {
    const start = addDays(thisWeekStart, -7 * (RECENT_WEEKS - 1 - i));
    const done = countDone(weekDays(start, dayMap, today));
    return { start, done, met: done >= goal, isCurrent: i === RECENT_WEEKS - 1 };
  });

  const daysSinceLast = lastDone ? Math.round((today - lastDone) / 86400000) : null;
  let condition = "growing";
  if (!firstDone) condition = "seed";
  else if (daysSinceLast >= WILT_AFTER_DAYS) condition = "wilting";
  else if (met) condition = "thriving";

  // Days still available this week, today included.
  const daysLeftInWeek = days.filter((d) => d.isToday || d.isFuture).length;

  return {
    thisWeek: { start: thisWeekStart, days, done: doneThisWeek, goal, met, remaining: Math.max(0, goal - doneThisWeek), daysLeft: daysLeftInWeek },
    recentWeeks,
    stage,
    progress,
    level: stage + progress,
    goalWeeks,
    weeksInARow: run,
    bestWeeksInARow: bestRun,
    condition,
    daysSinceLast,
    garden: gardenFor(goalWeeks),
  };
}
