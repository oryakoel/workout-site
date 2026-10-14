import { useState } from "react";
import { Check } from "lucide-react";
import { C, FONT_MONO } from "../theme.js";
import { GOAL_LABELS, LOAD_LABELS } from "../data/exerciseMeta.js";
import { FOCUS_GROUPS } from "../data/focusAreas.js";
import { DURATIONS_MINUTES } from "../lib/workoutEngine.js";
import { Button, Chip } from "./ui.jsx";

const GOAL_HINTS = {
  sitting: "מפשעה, גב ואחורי הירך",
  running: "חימום ושחרור לפני ריצה",
  back: "שחרור עדין לגב ולאגן",
  splits: "מתיחות עמוקות לקראת שפגט",
  handstand: "כתפיים, פרקי ידיים וליבה",
  sleep: "הרפיה רגועה בסוף היום",
};

const STEP_COUNT = 4;

function Option({ selected, onSelect, multi, title, hint }) {
  return (
    <button
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onSelect}
      className="flex items-center gap-4 w-full min-h-14 px-4 py-3 rounded-2xl text-right touch-manipulation transition-colors duration-200"
      style={{
        backgroundColor: selected ? C.accentDim : C.surface,
        border: `1px solid ${selected ? C.accent : C.line}`,
      }}
    >
      <span
        aria-hidden="true"
        className={`w-6 h-6 shrink-0 flex items-center justify-center ${multi ? "rounded-md" : "rounded-full"}`}
        style={{
          backgroundColor: selected ? C.accent : "transparent",
          border: `2px solid ${selected ? C.accent : C.lineStrong}`,
        }}
      >
        {selected && <Check size={14} color={C.bg} strokeWidth={3.5} />}
      </span>
      <span className="flex-1">
        <span className="block font-medium" style={{ color: C.text }}>
          {title}
        </span>
        {hint && (
          <span className="block text-sm mt-0.5" style={{ color: C.textMuted }}>
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Four short questions, each skippable as a whole. Answers only ever make
// sessions fit better (a nudge toward what you want, a hard no for joints
// you want to protect); nothing here is required.
export default function QuizScreen({ initial, editing, onFinish, onSkip }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(initial.goal);
  const [focus, setFocus] = useState(initial.focus);
  const [sensitive, setSensitive] = useState(initial.sensitive);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [weeklyGoal, setWeeklyGoal] = useState(initial.weeklyGoal);

  const isLast = step === STEP_COUNT - 1;
  const next = () => (isLast ? onFinish({ goal, focus, sensitive, minutes, weeklyGoal }) : setStep((s) => s + 1));

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm" style={{ color: C.textMuted }}>
            שאלה {step + 1} מתוך {STEP_COUNT}
          </span>
          <Button variant="quiet" size="sm" onClick={onSkip}>
            {editing ? "ביטול" : "דילוג על השאלון"}
          </Button>
        </div>
        <div className="flex gap-1.5" role="presentation">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span
              key={i}
              className="flex-1 h-1.5 rounded-full transition-colors duration-200"
              style={{ backgroundColor: i <= step ? C.accent : C.line }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
        {step === 0 && (
          <section aria-labelledby="quiz-title">
            <h1 id="quiz-title" className="text-3xl font-bold mt-4 mb-2" style={{ color: C.text }}>
              מה המטרה העיקרית שלכם?
            </h1>
            <p className="text-base mb-5" style={{ color: C.textMuted }}>
              נתאים את האימונים. אפשר לשנות בכל רגע.
            </p>
            <div role="radiogroup" aria-labelledby="quiz-title" className="flex flex-col gap-3">
              {Object.entries(GOAL_LABELS).map(([id, label]) => (
                <Option key={id} selected={goal === id} onSelect={() => setGoal(id)} title={label} hint={GOAL_HINTS[id]} />
              ))}
              <Option selected={goal === null} onSelect={() => setGoal(null)} title="כושר ומתיחות כלליים" hint="בלי מטרה מסוימת" />
            </div>
          </section>
        )}

        {step === 1 && (
          <section aria-labelledby="quiz-title">
            <h1 id="quiz-title" className="text-3xl font-bold mt-4 mb-2" style={{ color: C.text }}>
              על אילו אזורים תרצו להתמקד?
            </h1>
            <p className="text-base mb-5" style={{ color: C.textMuted }}>
              אפשר לבחור כמה, או לא לבחור. אלה יופיעו יותר, בלי לוותר על גיוון.
            </p>
            <div role="group" aria-labelledby="quiz-title" className="flex flex-col gap-3">
              {Object.entries(FOCUS_GROUPS).map(([id, group]) => (
                <Option key={id} multi selected={focus.includes(id)} onSelect={() => setFocus((list) => toggle(list, id))} title={group.label} />
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="quiz-title">
            <h1 id="quiz-title" className="text-3xl font-bold mt-4 mb-2" style={{ color: C.text }}>
              יש אזור שכדאי לחסוך?
            </h1>
            <p className="text-base mb-5" style={{ color: C.textMuted }}>
              לא נציע תרגילים שמעמיסים על מה שתסמנו. אם אין, פשוט המשיכו.
            </p>
            <div role="group" aria-labelledby="quiz-title" className="flex flex-col gap-3">
              {Object.entries(LOAD_LABELS).map(([id, label]) => (
                <Option key={id} multi selected={sensitive.includes(id)} onSelect={() => setSensitive((list) => toggle(list, id))} title={label} />
              ))}
            </div>
            <p className="text-xs mt-5 leading-relaxed" style={{ color: C.textMuted }}>
              זו התאמה כללית ולא עצה רפואית. אם יש כאב או פציעה, כדאי להתייעץ עם איש מקצוע.
            </p>
          </section>
        )}

        {step === 3 && (
          <section aria-labelledby="quiz-title">
            <h1 id="quiz-title" className="text-3xl font-bold mt-4 mb-2" style={{ color: C.text }}>
              כמה זמן, ובאיזו תדירות?
            </h1>
            <p className="text-base mb-5" style={{ color: C.textMuted }}>
              זה רק ברירת המחדל. בכל אימון אפשר לבחור אחרת.
            </p>
            <h2 id="quiz-minutes" className="text-sm font-medium mb-3" style={{ color: C.textMuted }}>
              אימון רגיל, בדקות
            </h2>
            <div role="radiogroup" aria-labelledby="quiz-minutes" className="grid grid-cols-6 gap-1.5 mb-6">
              {DURATIONS_MINUTES.map((m) => {
                const selected = minutes === m;
                return (
                  <button
                    key={m}
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${m} דקות`}
                    onClick={() => setMinutes(m)}
                    className="h-12 rounded-xl text-base font-semibold touch-manipulation transition-colors duration-200"
                    style={{
                      fontFamily: FONT_MONO,
                      backgroundColor: selected ? C.accentDim : C.surface,
                      border: `1px solid ${selected ? C.accent : C.line}`,
                      color: selected ? C.accent : C.text,
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <h2 id="quiz-days" className="text-sm font-medium mb-3" style={{ color: C.textMuted }}>
              יעד שבועי, בימים (ימי מנוחה זה בסדר)
            </h2>
            <div role="radiogroup" aria-labelledby="quiz-days" className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <Chip key={n} role="radio" aria-checked={weeklyGoal === n} selected={weeklyGoal === n} onClick={() => setWeeklyGoal(n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="flex gap-3 px-5 py-4 shrink-0" style={{ borderTop: `1px solid ${C.line}` }}>
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            הקודם
          </Button>
        )}
        <Button className="flex-1" onClick={next}>
          {isLast ? "סיום" : "הבא"}
        </Button>
      </div>
    </div>
  );
}
