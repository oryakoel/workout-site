import { C } from "../theme.js";
import { WORKOUT_TYPES } from "../data/exercises.js";

const OPTIONS = [{ id: "auto", label: "תבחר לי" }, ...WORKOUT_TYPES];

export default function TypeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className="py-3 px-2 rounded-xl text-sm font-medium touch-manipulation transition-colors"
            style={{
              backgroundColor: isActive ? C.tealDim : C.surface,
              border: `1px solid ${isActive ? C.teal : C.line}`,
              color: isActive ? C.teal : C.textMuted,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
