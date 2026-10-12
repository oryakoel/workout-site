// Beep patterns used instead of speech when the device can't speak Hebrew.
// Each tone is [frequencyHz, startOffsetSec, durationSec].
export const CUE_PATTERNS = {
  prep: [[440, 0, 0.2]],
  rest: [[330, 0, 0.28]],
  exercise: [
    [660, 0, 0.14],
    [880, 0.2, 0.18],
  ],
  side: [
    [660, 0, 0.14],
    [660, 0.2, 0.14],
  ],
  tenSeconds: [[740, 0, 0.12]],
  done: [
    [523, 0, 0.16],
    [659, 0.2, 0.16],
    [784, 0.4, 0.24],
  ],
};

export function cuePattern(kind) {
  return CUE_PATTERNS[kind] || [];
}
