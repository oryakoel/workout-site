// Segment timer driven by wall-clock timestamps instead of counting ticks,
// so a throttled or briefly blocked interval can never make it drift.
// A clock is either running ({ endsAt }) or paused ({ remainingMs }).

export function startClock(durationSec, now) {
  return { endsAt: now + durationSec * 1000, remainingMs: null };
}

export function isRunning(clock) {
  return clock.endsAt !== null;
}

export function remainingMs(clock, now) {
  return isRunning(clock) ? Math.max(0, clock.endsAt - now) : clock.remainingMs;
}

export function secondsLeft(clock, now) {
  return Math.ceil(remainingMs(clock, now) / 1000);
}

export function pauseClock(clock, now) {
  if (!isRunning(clock)) return clock;
  return { endsAt: null, remainingMs: remainingMs(clock, now) };
}

export function resumeClock(clock, now) {
  if (isRunning(clock)) return clock;
  return { endsAt: now + clock.remainingMs, remainingMs: null };
}

// Walks forward through every segment that has already elapsed by `now`.
// A segment ending at T starts the next one at T (not at `now`), so tick
// jitter never accumulates across a session.
export function advanceClock(clock, index, durationsSec, now) {
  if (!isRunning(clock)) return { index, clock, finished: false };
  let i = index;
  let endsAt = clock.endsAt;
  while (now >= endsAt) {
    if (i + 1 >= durationsSec.length) {
      return { index: i, clock: { endsAt, remainingMs: null }, finished: true };
    }
    i += 1;
    endsAt += durationsSec[i] * 1000;
  }
  return { index: i, clock: { endsAt, remainingMs: null }, finished: false };
}
