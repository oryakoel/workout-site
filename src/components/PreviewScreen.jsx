import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, BookmarkPlus, GripVertical, Minus, Play, Plus, RefreshCw, Shuffle, Trash2 } from "lucide-react";
import { C, FONT_MONO } from "../theme.js";
import {
  adjustDuration,
  DURATION_STEP_SECONDS,
  dropIndex,
  MAX_EXERCISE_SECONDS,
  MIN_EXERCISE_SECONDS,
  moveItem,
  planSeconds,
  removeItem,
} from "../lib/planEdit.js";
import { vibrate, BUZZ_STEP } from "../lib/haptics.js";
import { Button } from "./ui.jsx";
import { MAX_NAME_LENGTH } from "../lib/routines.js";

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
export default function PreviewScreen({ items, notice, routineName, onChange, onSwap, onRebuild, onSave, onStart, onBack }) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(routineName ?? "");
  const [savedAs, setSavedAs] = useState(null);
  const minutes = Math.max(1, Math.round(planSeconds(items) / 60));

  // Dragging by the grip: the card follows the finger, the others slide out
  // of the way, and the new order is applied on release. `drag` drives what
  // is drawn; `live` holds the measurements so moves don't re-measure.
  const scrollRef = useRef(null);
  const cardRefs = useRef([]);
  const live = useRef(null);
  const [drag, setDrag] = useState(null);
  const GAP = 12;

  const updateDrag = () => {
    const d = live.current;
    if (!d) return;
    const dy = d.clientY - d.startClientY + (scrollRef.current.scrollTop - d.startScroll);
    const to = dropIndex(d.centres, d.from, d.centres[d.from] + dy);
    d.to = to;
    setDrag({ from: d.from, to, dy, height: d.height });
  };

  const startDrag = (e, from) => {
    const scroller = scrollRef.current;
    const base = scroller.getBoundingClientRect().top - scroller.scrollTop;
    const rects = cardRefs.current.slice(0, items.length).map((el) => el.getBoundingClientRect());
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // not an active pointer (synthetic); dragging still works via move events
    }
    live.current = {
      from,
      startClientY: e.clientY,
      clientY: e.clientY,
      startScroll: scroller.scrollTop,
      centres: rects.map((r) => r.top - base + r.height / 2),
      height: rects[from].height,
    };
    vibrate(BUZZ_STEP);
    updateDrag();
  };

  const moveDrag = (e) => {
    if (!live.current) return;
    live.current.clientY = e.clientY;
    updateDrag();
  };

  const endDrag = (commit) => {
    const d = live.current;
    live.current = null;
    if (!d) return;
    setDrag(null);
    if (commit && d.to !== undefined && d.to !== d.from) onChange(moveItem(items, d.from, d.to));
  };

  // Near the top or bottom edge, the list scrolls by itself while dragging.
  useEffect(() => {
    if (!drag) return;
    let frame;
    const tick = () => {
      const d = live.current;
      const scroller = scrollRef.current;
      if (d && scroller) {
        const r = scroller.getBoundingClientRect();
        const edge = 72;
        let speed = 0;
        if (d.clientY < r.top + edge) speed = -Math.ceil(((r.top + edge - d.clientY) / edge) * 14);
        else if (d.clientY > r.bottom - edge) speed = Math.ceil(((d.clientY - (r.bottom - edge)) / edge) * 14);
        if (speed !== 0) {
          const before = scroller.scrollTop;
          scroller.scrollTop = before + speed;
          if (scroller.scrollTop !== before) updateDrag();
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null]);

  const shiftFor = (i) => {
    if (!drag || i === drag.from) return 0;
    const step = drag.height + GAP;
    if (drag.from < drag.to && i > drag.from && i <= drag.to) return -step;
    if (drag.from > drag.to && i >= drag.to && i < drag.from) return step;
    return 0;
  };

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

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 flex flex-col gap-3">
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
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="rounded-2xl p-4 flex flex-col gap-3 relative"
                style={{
                  backgroundColor: C.surface,
                  border: `1px solid ${drag?.from === i ? C.accent : C.line}`,
                  transform: drag ? `translateY(${drag.from === i ? drag.dy : shiftFor(i)}px)` : undefined,
                  transition: drag && drag.from !== i ? "transform 150ms ease" : "none",
                  zIndex: drag?.from === i ? 10 : undefined,
                  boxShadow: drag?.from === i ? "0 12px 28px rgba(0,0,0,0.45)" : undefined,
                }}
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
                  <button
                    aria-hidden="true"
                    tabIndex={-1}
                    onPointerDown={(e) => startDrag(e, i)}
                    onPointerMove={moveDrag}
                    onPointerUp={() => endDrag(true)}
                    onPointerCancel={() => endDrag(false)}
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-11 h-11 flex items-center justify-center shrink-0 cursor-grab"
                    style={{ color: C.textMuted, touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
                  >
                    <GripVertical size={20} />
                  </button>
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

        <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.line}` }}>
          {saving ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const clean = name.trim();
                if (!clean) return;
                onSave(clean);
                setSavedAs(clean);
                setSaving(false);
              }}
            >
              <label htmlFor="routine-name" className="text-sm font-medium" style={{ color: C.textMuted }}>
                שם הסדרה
              </label>
              <input
                id="routine-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={MAX_NAME_LENGTH}
                autoFocus
                placeholder="למשל: בוקר קצר"
                className="h-12 rounded-xl px-4 text-base"
                style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${C.lineStrong}`, color: C.text }}
              />
              <div className="flex gap-2">
                <Button type="submit" size="md" className="flex-1" disabled={!name.trim()}>
                  שמירה
                </Button>
                <Button type="button" size="md" variant="quiet" onClick={() => setSaving(false)}>
                  ביטול
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p role="status" className="text-sm" style={{ color: savedAs ? C.sage : C.textMuted }}>
                {savedAs ? `נשמר כ"${savedAs}". תמצאו אותו בדף הבית.` : "אהבתם? אפשר לשמור את האימון הזה לפעם הבאה."}
              </p>
              <Button size="md" variant="secondary" icon={BookmarkPlus} className="shrink-0" onClick={() => setSaving(true)}>
                {savedAs ? "שמירה שוב" : "שמירה כסדרה"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 px-5 py-4 shrink-0" style={{ borderTop: `1px solid ${C.line}` }}>
        {onRebuild && (
          <Button variant="secondary" icon={Shuffle} onClick={onRebuild} aria-label="בניית אימון חדש">
            אחר
          </Button>
        )}
        <Button className="flex-1" icon={Play} onClick={onStart}>
          התחלה
        </Button>
      </div>
    </div>
  );
}
