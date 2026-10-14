import { ArrowDown, ArrowLeft, ArrowUp, Minus, Play, Plus, RefreshCw, Shuffle, Trash2 } from "lucide-react";
import { C, FONT_MONO } from "../theme.js";
import {
  adjustDuration,
  DURATION_STEP_SECONDS,
  MAX_EXERCISE_SECONDS,
  MIN_EXERCISE_SECONDS,
  moveItem,
  planSeconds,
  removeItem,
} from "../lib/planEdit.js";
import { Button } from "./ui.jsx";

function IconButton({ label, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-11 h-11 rounded-xl flex items-center justify-center touch-manipulation disabled:opacity-30"
      style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${C.line}`, color: C.text }}
    >
      {children}
    </button>
  );
}

// A look at the session before it starts: the person can reorder, retime,
// swap or drop exercises. Nothing here is required; "start" works as is.
export default function PreviewScreen({ items, notice, onChange, onSwap, onRebuild, onStart, onBack }) {
  const minutes = Math.max(1, Math.round(planSeconds(items) / 60));

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-3 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm touch-manipulation h-11 -mt-2"
          style={{ color: C.textMuted }}
        >
          <ArrowLeft size={16} aria-hidden="true" style={{ transform: "scaleX(-1)" }} />
          חזרה
        </button>
        <h1 className="text-3xl font-bold mt-1" style={{ color: C.text }}>
          האימון שלכם
        </h1>
        <p className="text-base mt-1" style={{ color: C.textMuted }} aria-live="polite">
          {items.length} תרגילים · כ-{minutes} דקות
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 flex flex-col gap-3">
        {notice && (
          <p role="status" className="px-4 py-3 rounded-xl text-sm leading-relaxed" style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, color: C.textMuted }}>
            {notice}
          </p>
        )}

        <ol className="flex flex-col gap-3">
          {items.map((item, i) => {
            const { exercise, duration } = item;
            return (
              <li
                key={`${exercise.id}-${i}`}
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                    style={{ backgroundColor: C.accentDim, color: C.accent, fontFamily: FONT_MONO }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold leading-snug" style={{ color: C.text }}>
                      {exercise.name}
                    </h2>
                    <p className="text-sm" style={{ color: C.textMuted }}>
                      {exercise.muscleGroup}
                      {exercise.bilateral ? " · כל צד" : ""}
                    </p>
                  </div>
                  <IconButton label={`הסרת ${exercise.name}`} onClick={() => onChange(removeItem(items, i))} disabled={items.length <= 1}>
                    <Trash2 size={16} aria-hidden="true" />
                  </IconButton>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5" role="group" aria-label={`משך ${exercise.name}`}>
                    <IconButton
                      label="פחות זמן"
                      onClick={() => onChange(adjustDuration(items, i, -DURATION_STEP_SECONDS))}
                      disabled={duration <= MIN_EXERCISE_SECONDS}
                    >
                      <Minus size={16} aria-hidden="true" />
                    </IconButton>
                    <span className="w-12 flex flex-col items-center leading-tight" style={{ color: C.text }}>
                      <span className="font-semibold tabular-nums" style={{ fontFamily: FONT_MONO }}>
                        {duration}
                      </span>
                      <span className="text-xs" style={{ color: C.textMuted }}>
                        שניות
                      </span>
                    </span>
                    <IconButton
                      label="יותר זמן"
                      onClick={() => onChange(adjustDuration(items, i, DURATION_STEP_SECONDS))}
                      disabled={duration >= MAX_EXERCISE_SECONDS}
                    >
                      <Plus size={16} aria-hidden="true" />
                    </IconButton>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <IconButton label="הזזה למעלה" onClick={() => onChange(moveItem(items, i, i - 1))} disabled={i === 0}>
                      <ArrowUp size={16} aria-hidden="true" />
                    </IconButton>
                    <IconButton label="הזזה למטה" onClick={() => onChange(moveItem(items, i, i + 1))} disabled={i === items.length - 1}>
                      <ArrowDown size={16} aria-hidden="true" />
                    </IconButton>
                    <IconButton label={`החלפת ${exercise.name} בתרגיל דומה`} onClick={() => onSwap(i)}>
                      <RefreshCw size={16} aria-hidden="true" />
                    </IconButton>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex gap-3 px-5 py-4 shrink-0" style={{ borderTop: `1px solid ${C.line}` }}>
        <Button variant="secondary" icon={Shuffle} onClick={onRebuild} aria-label="בניית אימון חדש">
          אחר
        </Button>
        <Button className="flex-1" icon={Play} onClick={onStart}>
          התחלה
        </Button>
      </div>
    </div>
  );
}
