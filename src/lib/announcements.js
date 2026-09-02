import { SIDE_LABEL } from "./workoutEngine.js";

// Right side of a bilateral exercise (or any non-bilateral exercise)
// gets the full name + tips; the left side is always the second half of
// the same exercise, so it only needs the short cue — the tips already
// apply to both sides.
export function exerciseAnnouncement(exercise, side) {
  if (side === "left") {
    return `${SIDE_LABEL.left}`;
  }
  const sideText = side ? `, ${SIDE_LABEL[side]}` : "";
  return `${exercise.name}${sideText}. ${exercise.tips.join(". ")}`;
}

export function tenSecondsLeftAnnouncement() {
  return "עוד עשר שניות";
}

export function restAnnouncement(nextExercise, nextSide) {
  if (!nextExercise) return "מנוחה";
  const sideText = nextSide ? `, ${SIDE_LABEL[nextSide]}` : "";
  return `מנוחה. הבא: ${nextExercise.name}${sideText}`;
}

export function prepAnnouncement(firstExercise, firstSide) {
  if (!firstExercise) return "מתכוננים";
  const sideText = firstSide ? `, ${SIDE_LABEL[firstSide]}` : "";
  return `מתכוננים. תרגיל ראשון: ${firstExercise.name}${sideText}`;
}

export function doneAnnouncement() {
  return "כל הכבוד! סיימתם את האימון";
}
