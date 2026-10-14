// A short buzz on supporting phones (Android Chrome); silently nothing on
// iPhones and desktops. Never throws: a cue must not break a workout.
export function vibrate(pattern) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
  } catch {
    // blocked by the browser: the sound and screen cues still work
  }
}

export const BUZZ_STEP = 40;
export const BUZZ_COUNTDOWN = 15;
export const BUZZ_DONE = [80, 60, 80];
