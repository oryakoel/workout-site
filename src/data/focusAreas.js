// The body regions a person can ask to focus on in the quiz. Each groups the
// finer "areas" used in the exercise table (see exerciseMeta.js).
export const FOCUS_GROUPS = {
  "neck-shoulders": { label: "צוואר, כתפיים וגב עליון", areas: ["neck", "shoulders", "upper-back"] },
  "chest-arms": { label: "חזה וזרועות", areas: ["chest", "arms"] },
  core: { label: "בטן וליבה", areas: ["core", "obliques"] },
  back: { label: "גב תחתון", areas: ["lower-back"] },
  hips: { label: "ירכיים, מפשעה וישבן", areas: ["hips", "adductors", "glutes"] },
  "legs-back": { label: "ירך אחורית ושוקיים", areas: ["hamstrings", "calves"] },
  "legs-front": { label: "ירך קדמית", areas: ["quads"] },
};

export function focusAreasFor(groupIds = []) {
  return [...new Set(groupIds.flatMap((id) => FOCUS_GROUPS[id]?.areas ?? []))];
}
