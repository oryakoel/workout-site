import { useState } from "react";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { C } from "../theme.js";
import { WORKOUT_TYPES } from "../data/exercises.js";
import NavTabs from "./NavTabs.jsx";

const FILTERS = [{ id: "all", label: "הכול" }, ...WORKOUT_TYPES];

function ExerciseRow({ exercise, onOpen }) {
  const Illustration = exercise.Illustration;
  return (
    <button
      onClick={() => onOpen(exercise.id)}
      className="flex items-center gap-4 p-3 rounded-2xl text-right touch-manipulation active:scale-[0.98] transition-transform"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.line}` }}
    >
      <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: "84px", height: "70px", backgroundColor: C.surfaceAlt }}>
        <Illustration />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold truncate" style={{ color: C.text }}>
          {exercise.name}
        </h3>
        <p className="text-sm truncate" style={{ color: C.textMuted }}>
          {exercise.muscleGroup}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs" style={{ color: C.teal }}>
            {exercise.defaultDurationSeconds} שנ׳
          </span>
          {exercise.bilateral && (
            <span className="flex items-center gap-1 text-xs" style={{ color: C.textMuted }}>
              <RefreshCw size={11} />
              דו-צדדי
            </span>
          )}
        </div>
      </div>
      <ChevronLeft size={20} color={C.textMuted} className="shrink-0" />
    </button>
  );
}

function ExerciseDetail({ exercise, onBack }) {
  const Illustration = exercise.Illustration;
  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-8 overflow-y-auto">
      <button onClick={onBack} className="flex items-center gap-1 p-2 -m-2 self-start touch-manipulation" style={{ color: C.textMuted }}>
        <ChevronLeft size={20} />
        <span className="text-sm">חזרה לרשימה</span>
      </button>

      <div
        className="w-full rounded-2xl p-4 mt-4 mx-auto"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, aspectRatio: "6 / 5", maxWidth: "420px" }}
      >
        <Illustration />
      </div>

      <div className="text-center mt-5">
        <h2 className="text-2xl font-bold mb-1" style={{ color: C.text }}>
          {exercise.name}
        </h2>
        <span className="text-sm" style={{ color: C.textMuted }}>
          {exercise.muscleGroup}
        </span>
        <div className="flex items-center justify-center gap-3 mt-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: C.tealDim, color: C.teal }}
          >
            {exercise.defaultDurationSeconds} שניות
          </span>
          {exercise.bilateral && (
            <span
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: C.amberDim, color: C.amber }}
            >
              <RefreshCw size={12} />
              ימין ושמאל בנפרד
            </span>
          )}
        </div>
      </div>

      <ul className="w-full max-w-md mx-auto flex flex-col gap-3 mt-6">
        {exercise.tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: C.text }}>
            <span className="mt-1.5 shrink-0 rounded-full" style={{ width: "5px", height: "5px", backgroundColor: C.amber }} />
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LibraryScreen({ exercises, onNavigate }) {
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const selected = exercises.find((e) => e.id === selectedId);

  if (selected) {
    return <ExerciseDetail exercise={selected} onBack={() => setSelectedId(null)} />;
  }

  const visible = filter === "all" ? exercises : exercises.filter((e) => e.type === filter);

  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-8 gap-6">
      <NavTabs active="library" onChange={onNavigate} />

      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
          ספריית תרגילים
        </h1>
        <p className="text-base" style={{ color: C.textMuted }}>
          עיינו בתרגילים בלי טיימר, ללימוד מראש
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium touch-manipulation whitespace-nowrap"
              style={{
                backgroundColor: isActive ? C.tealDim : C.surface,
                border: `1px solid ${isActive ? C.teal : C.line}`,
                color: isActive ? C.teal : C.textMuted,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto">
        {visible.map((exercise) => (
          <ExerciseRow key={exercise.id} exercise={exercise} onOpen={setSelectedId} />
        ))}
      </div>
    </div>
  );
}
