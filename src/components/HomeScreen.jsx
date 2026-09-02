import { C } from "../theme.js";
import DurationTile from "./DurationTile.jsx";
import NavTabs from "./NavTabs.jsx";
import TypeSelector from "./TypeSelector.jsx";
import { Shuffle, BatteryLow } from "lucide-react";
import { DURATIONS_MINUTES } from "../lib/workoutEngine.js";

export default function HomeScreen({
  onStart,
  onQuickStart,
  randomOrder,
  setRandomOrder,
  workoutType,
  setWorkoutType,
  onNavigate,
}) {
  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-8 gap-6 overflow-y-auto">
      <NavTabs active="home" onChange={onNavigate} />

      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
          אימון היום
        </h1>
        <p className="text-base" style={{ color: C.textMuted }}>
          כמה זמן יש לך?
        </p>
      </div>

      <button
        onClick={onQuickStart}
        className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium touch-manipulation"
        style={{ backgroundColor: C.tealDim, border: `1px solid ${C.teal}`, color: C.teal }}
      >
        <BatteryLow size={18} />
        אין לי כוח — 5 דק׳ התאוששות עדינה
      </button>

      <div className="grid grid-cols-3 gap-3">
        {DURATIONS_MINUTES.map((m) => (
          <DurationTile key={m} minutes={m} onSelect={onStart} />
        ))}
      </div>

      <div>
        <p className="text-sm mb-2" style={{ color: C.textMuted }}>
          איזה סוג אימון?
        </p>
        <TypeSelector value={workoutType} onChange={setWorkoutType} />
      </div>

      <button
        onClick={() => setRandomOrder(!randomOrder)}
        className="flex items-center justify-between px-4 py-3 rounded-xl mt-auto touch-manipulation"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.line}` }}
      >
        <span className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
          <Shuffle size={16} color={randomOrder ? C.amber : C.textMuted} />
          סדר אקראי
        </span>
        <span
          className="w-10 h-6 rounded-full relative transition-colors"
          style={{ backgroundColor: randomOrder ? C.amber : C.line }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
            style={{ backgroundColor: C.bg, right: randomOrder ? "2px" : "18px" }}
          />
        </span>
      </button>
    </div>
  );
}
