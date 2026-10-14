// What each exercise is, for building better sessions: when it belongs in
// one, how demanding it is, what it stresses, and what it is good for.
// Kept apart from exercises.js so this table can be reviewed on its own.

// phase      warmup: dynamic, raises the heart rate; cooldown: calm, floor-based
// intensity  1 gentle, 2 moderate, 3 demanding
// position   the body position, used to order a session with few transitions
// areas      what it mainly works or stretches (empty when it's about breathing)
// load       joints it puts stress on, so sensitive areas can be avoided
// goals      the goals it helps with
// equipment  anything beyond the floor
export const POSITION_ORDER = ["standing", "plank", "kneeling", "seated", "lying"];
export const PHASE_ORDER = ["warmup", "work", "cooldown"];

export const LOAD_LABELS = {
  neck: "צוואר",
  shoulders: "כתפיים",
  wrists: "פרקי ידיים",
  "lower-back": "גב תחתון",
  knees: "ברכיים",
  hips: "מפשעה וירכיים",
  impact: "קפיצות ועומס על המפרקים",
};

export const GOAL_LABELS = {
  sitting: "ישיבה ממושכת",
  running: "לפני ריצה",
  back: "הקלה על הגב",
  splits: "התקדמות בשפגט",
  handstand: "הכנה לעמידת ידיים",
  sleep: "לפני השינה",
};

const TABLE = {
  // ----- flexibility -----
  "hamstring-stretch": ["work", 2, "seated", ["hamstrings"], ["lower-back"], ["sitting", "running", "splits"]],
  "butterfly-stretch": ["cooldown", 1, "seated", ["adductors", "hips"], ["hips"], ["sitting", "splits", "sleep"]],
  "hip-flexor-stretch": ["work", 2, "kneeling", ["hips", "quads"], ["knees"], ["sitting", "running", "splits"]],
  "quad-stretch": ["work", 1, "standing", ["quads"], ["knees"], ["running", "sitting"]],
  "wide-leg-straddle-stretch": ["work", 2, "seated", ["hamstrings", "adductors"], ["hips", "lower-back"], ["splits", "sitting"]],
  "runners-stretch": ["work", 2, "standing", ["hamstrings", "hips"], ["knees"], ["running", "sitting", "splits"]],
  "pigeon-pose": ["work", 2, "kneeling", ["glutes", "hips"], ["knees", "hips"], ["sitting", "running", "back"]],
  "downward-dog": ["work", 2, "plank", ["hamstrings", "calves", "shoulders"], ["wrists", "shoulders"], ["sitting", "running", "handstand"]],
  "downward-dog-wall": ["work", 2, "plank", ["hamstrings", "calves", "shoulders"], ["wrists", "shoulders"], ["splits", "handstand"], ["wall"]],
  "pyramid-pose": ["work", 2, "standing", ["hamstrings"], ["lower-back"], ["running", "splits", "sitting"]],
  "seated-forward-fold": ["cooldown", 1, "seated", ["hamstrings", "lower-back"], ["lower-back"], ["sitting", "sleep"]],
  "splits-practice": ["work", 3, "seated", ["hamstrings", "hips"], ["hips", "knees"], ["splits"]],
  "frog-pose": ["work", 3, "kneeling", ["adductors", "hips"], ["knees", "hips"], ["splits", "sitting"]],
  "middle-splits": ["work", 3, "seated", ["adductors", "hamstrings"], ["hips"], ["splits"]],
  "reclined-leg-stretch": ["cooldown", 1, "lying", ["hamstrings", "adductors"], [], ["sitting", "running", "back", "sleep"]],
  "happy-baby": ["cooldown", 1, "lying", ["adductors", "lower-back", "hips"], [], ["back", "sleep", "sitting"]],
  "seated-figure-4": ["cooldown", 1, "seated", ["glutes", "hips"], ["knees"], ["sitting", "back"]],
  "side-lunge-stretch": ["work", 2, "standing", ["adductors"], ["knees"], ["splits", "running"]],
  "cobra-quad-stretch": ["work", 2, "lying", ["quads", "chest"], ["knees", "lower-back"], ["sitting", "running"]],
  "straddle-side-reach": ["work", 2, "seated", ["hamstrings", "obliques"], ["hips"], ["splits", "sitting"]],
  "seated-hip-opener": ["work", 2, "seated", ["adductors", "hips"], ["hips", "knees"], ["sitting", "splits"]],
  "kneeling-forward-reach": ["work", 2, "kneeling", ["hips", "upper-back", "shoulders"], ["knees"], ["sitting", "handstand"]],
  "straddle-fold-to-leg": ["work", 2, "seated", ["hamstrings", "adductors"], ["lower-back", "hips"], ["splits", "sitting"]],
  "pigeon-backbend": ["work", 3, "kneeling", ["glutes", "hips", "chest"], ["knees", "hips", "lower-back"], ["splits", "sitting"]],
  "standing-forward-fold": ["work", 1, "standing", ["hamstrings", "lower-back"], ["lower-back"], ["sitting", "running", "sleep"]],
  "wall-forward-fold-block": ["work", 1, "standing", ["hamstrings", "lower-back", "hips"], ["lower-back"], ["sitting", "back"], ["wall", "block"]],
  "sphinx-pose": ["work", 1, "lying", ["lower-back", "core", "chest"], ["lower-back"], ["back", "sitting"]],
  "overhead-triceps-stretch": ["work", 1, "standing", ["arms", "shoulders"], ["shoulders"], ["sitting", "handstand"]],
  "behind-head-clasp-stretch": ["work", 1, "standing", ["upper-back", "shoulders", "chest"], ["shoulders", "neck"], ["sitting", "handstand"]],
  "yogi-squat": ["work", 2, "standing", ["adductors", "hips"], ["knees"], ["sitting", "splits"]],
  "seated-side-stretch": ["cooldown", 1, "seated", ["obliques", "upper-back"], [], ["sitting", "back", "sleep"]],
  "lunge-knee-hands": ["work", 2, "kneeling", ["hips", "quads"], ["knees"], ["sitting", "running", "splits"]],
  "deep-straddle-fold": ["work", 3, "seated", ["hamstrings", "adductors"], ["lower-back", "hips"], ["splits"]],
  "twisting-lunge-side-angle": ["work", 2, "standing", ["hips", "obliques", "adductors"], ["knees", "lower-back"], ["running", "sitting"]],
  "reclined-wide-leg-v": ["cooldown", 1, "lying", ["adductors", "hamstrings"], [], ["sleep", "splits", "sitting"]],
  "extended-side-angle": ["work", 2, "standing", ["hips", "adductors", "obliques"], ["knees"], ["splits", "running"]],

  // ----- recovery -----
  "seated-breathing": ["cooldown", 1, "seated", [], [], ["sleep", "back", "sitting"]],
  "neck-stretch": ["cooldown", 1, "seated", ["neck"], ["neck"], ["sitting", "sleep"]],
  "reclined-butterfly": ["cooldown", 1, "lying", ["adductors", "hips"], ["hips"], ["sleep", "sitting", "splits"]],
  "knee-to-chest": ["cooldown", 1, "lying", ["glutes", "lower-back"], [], ["back", "sleep", "sitting"]],

  // ----- strength (handstand prep) -----
  plank: ["work", 2, "plank", ["core", "shoulders"], ["wrists", "shoulders"], ["handstand"]],
  "forearm-plank": ["work", 2, "plank", ["core", "shoulders"], ["shoulders"], ["handstand"]],
  bridge: ["work", 1, "lying", ["glutes", "lower-back"], ["lower-back"], ["back", "sitting", "running"]],
  "dolphin-pushup": ["work", 3, "plank", ["shoulders", "arms", "core"], ["shoulders", "wrists"], ["handstand"]],
  "push-up-t-rotation": ["work", 3, "plank", ["chest", "core", "shoulders"], ["wrists", "shoulders"], ["handstand"]],
  "pike-shoulder-taps": ["work", 3, "plank", ["shoulders", "core"], ["wrists", "shoulders"], ["handstand"]],
  "side-to-side-pushups": ["work", 3, "plank", ["chest", "arms"], ["wrists", "shoulders"], ["handstand"]],
  "plank-knee-rotations": ["work", 3, "plank", ["core", "obliques"], ["wrists", "shoulders"], ["handstand"]],
  "reverse-plank-knee-drive": ["work", 3, "plank", ["core", "glutes", "shoulders"], ["wrists", "shoulders"], ["handstand"]],
  commandos: ["work", 3, "plank", ["core", "arms"], ["wrists", "shoulders"], ["handstand"]],
  "basic-pushups": ["work", 2, "plank", ["chest", "shoulders", "arms"], ["wrists", "shoulders"], ["handstand"]],
  "tricep-dips": ["work", 3, "seated", ["arms", "shoulders"], ["shoulders", "wrists"], ["handstand"], ["bench"]],
  "side-plank": ["work", 2, "plank", ["obliques", "core", "shoulders"], ["wrists", "shoulders"], ["handstand", "back"]],
  "crow-pose": ["work", 3, "plank", ["core", "arms", "shoulders"], ["wrists"], ["handstand"]],

  // ----- full body -----
  "squat-hold": ["work", 2, "standing", ["quads", "glutes"], ["knees"], ["running"]],
  "lunge-hold": ["work", 2, "standing", ["quads", "glutes"], ["knees"], ["running"]],
  "reverse-lunge-reach": ["work", 2, "standing", ["quads", "glutes", "core"], ["knees"], ["running", "sitting"]],
  "step-out-squat-walk": ["work", 2, "standing", ["glutes", "quads"], ["knees"], ["running"]],
  "reverse-snow-angels": ["work", 2, "lying", ["upper-back", "shoulders"], ["shoulders", "lower-back"], ["sitting", "handstand"]],
  "overhead-prayer-crunch": ["work", 2, "lying", ["core"], ["neck"], []],
  "heel-touches": ["work", 2, "lying", ["obliques"], ["neck"], []],
  "leg-extended-oblique-crunch": ["work", 2, "lying", ["obliques", "core"], ["neck", "lower-back"], []],
  "reverse-crunch": ["work", 2, "lying", ["core"], ["lower-back"], []],
  "criss-cross-oblique-crunch": ["work", 2, "lying", ["obliques", "core"], ["neck"], []],
  "air-squats": ["work", 2, "standing", ["quads", "glutes"], ["knees"], ["running"]],
  "bicycle-crunches": ["work", 2, "lying", ["obliques", "core"], ["neck"], []],
  "wall-sit": ["work", 2, "standing", ["quads", "glutes"], ["knees"], ["running"], ["wall"]],

  // ----- cardio -----
  "jumping-jack": ["warmup", 2, "standing", ["full-body"], ["impact", "knees"], ["running"]],
  "high-knees": ["warmup", 2, "standing", ["full-body", "hips"], ["impact", "knees"], ["running"]],
  "ghost-rope": ["warmup", 2, "standing", ["full-body", "calves"], ["impact"], ["running"]],
  "runner-step-back-knee-drive": ["warmup", 2, "standing", ["quads", "hips", "glutes"], ["knees"], ["running"]],
  "butt-kicks": ["warmup", 2, "standing", ["hamstrings"], ["impact", "knees"], ["running"]],
  "pushup-mountain-climber-combo": ["work", 3, "plank", ["chest", "core", "full-body"], ["wrists", "shoulders"], []],
  "in-and-out-squats": ["work", 3, "standing", ["quads", "glutes"], ["impact", "knees"], ["running"]],
  burpees: ["work", 3, "plank", ["full-body"], ["impact", "knees", "wrists", "shoulders"], []],
  "mountain-climbers": ["work", 3, "plank", ["core", "full-body"], ["wrists", "shoulders"], []],
  "step-ups": ["work", 2, "standing", ["quads", "glutes"], ["knees"], ["running"], ["bench"]],
};

export const EXERCISE_META = Object.fromEntries(
  Object.entries(TABLE).map(([id, [phase, intensity, position, areas, load, goals, equipment = []]]) => [
    id,
    { phase, intensity, position, areas, load, goals, equipment },
  ]),
);
