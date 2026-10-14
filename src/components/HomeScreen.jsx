import { BatteryLow, ChevronDown, Play, Shuffle, SlidersHorizontal, Sparkles } from "lucide-react";
import { C, FONT_MONO } from "../theme.js";
import { DURATIONS_MINUTES } from "../lib/workoutEngine.js";
import { WORKOUT_TYPES } from "../data/exercises.js";
import { GOAL_LABELS, LOAD_LABELS } from "../data/exerciseMeta.js";
import { Avatar, Button, Card, Chip, SectionLabel } from "./ui.jsx";
import WeekCard from "./WeekCard.jsx";
import VoiceCheck from "./VoiceCheck.jsx";
import SyncNotice from "./SyncNotice.jsx";

const TYPE_OPTIONS = [{ id: "auto", label: "תבחר לי" }, ...WORKOUT_TYPES];
const GOAL_OPTIONS = Object.entries(GOAL_LABELS).map(([id, label]) => ({ id, label }));

export default function HomeScreen({
  prefs,
  onPrefsChange,
  onStart,
  onQuickStart,
  currentUser,
  onSwitchUser,
  syncPending,
  needsSignIn,
  onSignIn,
  consistency,
  consistencyOffline,
  profile,
  onOpenQuiz,
  onDismissInvite,
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-6 pb-6 gap-6">
      <header className="flex items-center gap-3">
        <button
          onClick={onSwitchUser}
          aria-label={currentUser ? `${currentUser}, החלפת משתמש` : "אימון ללא שמירה, החלפת משתמש"}
          className="flex items-center gap-2 h-11 ps-3 pe-2 rounded-full touch-manipulation"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, color: C.text }}
        >
          <Avatar name={currentUser || "?"} size={30} />
          <span className="text-sm font-medium">{currentUser || "ללא שמירה"}</span>
          <ChevronDown size={16} aria-hidden="true" color={C.textMuted} />
        </button>
      </header>

      <SyncNotice pending={syncPending} needsSignIn={needsSignIn} onSignIn={onSignIn} />

      <div>
        <h1 className="text-3xl font-bold" style={{ color: C.text }}>
          מוכנים להתאמן?
        </h1>
        <p className="text-base mt-1" style={{ color: C.textMuted }}>
          בחרו סוג וזמן, והכול מוכן.
        </p>
      </div>

      {currentUser ? (
        <WeekCard
          consistency={consistency}
          goal={prefs.weeklyGoal}
          onGoalChange={(weeklyGoal) => onPrefsChange({ ...prefs, weeklyGoal })}
          offline={consistencyOffline}
        />
      ) : (
        <div
          className="p-4 rounded-3xl text-sm leading-relaxed"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, color: C.textMuted }}
        >
          מתאמנים בלי שמירה, ולכן ההתקדמות לא נספרת. לחצו על השם למעלה כדי לבחור שם ולבנות רצף שבועי.
        </div>
      )}

      {!profile && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: C.accentDim, color: C.accent }}
            >
              <Sparkles size={20} />
            </span>
            <div>
              <h2 className="font-semibold" style={{ color: C.text }}>
                אימונים שמותאמים אליכם
              </h2>
              <p className="text-sm" style={{ color: C.textMuted }}>
                ארבע שאלות קצרות על המטרה, ועל אזורים שכדאי לחסוך.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="md" className="flex-1" onClick={onOpenQuiz}>
              בואו נתחיל
            </Button>
            <Button size="md" variant="quiet" onClick={onDismissInvite}>
              לא עכשיו
            </Button>
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-6">
        <section aria-labelledby="type-label">
          <SectionLabel id="type-label">סוג אימון</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                selected={!prefs.goal && prefs.type === option.id}
                onClick={() => onPrefsChange({ ...prefs, type: option.id, goal: null })}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </section>

        <section aria-labelledby="goal-label">
          <SectionLabel id="goal-label">או לפי מטרה</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                selected={prefs.goal === option.id}
                onClick={() => onPrefsChange({ ...prefs, goal: prefs.goal === option.id ? null : option.id })}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </section>

        <section aria-labelledby="minutes-label">
          <SectionLabel id="minutes-label">כמה דקות יש לך?</SectionLabel>
          <div className="grid grid-cols-6 gap-1.5">
            {DURATIONS_MINUTES.map((minutes) => {
              const selected = prefs.minutes === minutes;
              return (
                <button
                  key={minutes}
                  onClick={() => onPrefsChange({ ...prefs, minutes })}
                  aria-pressed={selected}
                  aria-label={`${minutes} דקות`}
                  className="h-12 rounded-xl text-base font-semibold touch-manipulation transition-colors duration-200"
                  style={{
                    fontFamily: FONT_MONO,
                    backgroundColor: selected ? C.accentDim : C.surfaceAlt,
                    border: `1px solid ${selected ? C.accent : C.line}`,
                    color: selected ? C.accent : C.text,
                  }}
                >
                  {minutes}
                </button>
              );
            })}
          </div>
        </section>

        <button
          role="switch"
          aria-checked={prefs.random}
          onClick={() => onPrefsChange({ ...prefs, random: !prefs.random })}
          className="flex items-center justify-between h-11 touch-manipulation"
        >
          <span className="flex flex-col items-start text-right">
            <span className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
              <Shuffle size={16} aria-hidden="true" color={prefs.random ? C.accent : C.textMuted} />
              ערבוב אקראי
            </span>
            <span className="text-xs mt-0.5" style={{ color: C.textMuted }}>
              {prefs.random ? "סדר אקראי לגמרי" : "כבוי: חימום בהתחלה, הרפיה בסוף, ולא אותם תרגילים כל פעם"}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="w-11 h-6 rounded-full relative transition-colors duration-200"
            style={{ backgroundColor: prefs.random ? C.accent : C.lineStrong }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
              style={{ backgroundColor: C.bg, right: prefs.random ? "2px" : "22px" }}
            />
          </span>
        </button>

        <Button icon={Play} onClick={onStart}>
          התחלת אימון · {prefs.minutes} דקות
        </Button>

        {profile && (
          <div className="flex items-center justify-between gap-3 -mt-2">
            <p className="text-xs leading-snug" style={{ color: C.textMuted }}>
              {profile.sensitive.length > 0
                ? `חוסכים: ${profile.sensitive.map((l) => LOAD_LABELS[l]).join(", ")}`
                : "ללא הגבלות מיוחדות"}
            </p>
            <button
              onClick={onOpenQuiz}
              className="flex items-center gap-1.5 text-xs touch-manipulation py-2 shrink-0"
              style={{ color: C.textMuted }}
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              התאמה אישית
            </button>
          </div>
        )}
      </Card>

      <button
        onClick={onQuickStart}
        className="flex items-center gap-4 p-4 rounded-3xl text-right touch-manipulation active:scale-[0.99] transition-transform duration-200"
        style={{ backgroundColor: C.sageDim, border: `1px solid ${C.line}` }}
      >
        <span
          aria-hidden="true"
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: C.surface, color: C.sage }}
        >
          <BatteryLow size={22} />
        </span>
        <span className="flex-1">
          <span className="block font-semibold" style={{ color: C.text }}>
            אין לי כוח
          </span>
          <span className="block text-sm" style={{ color: C.textMuted }}>
            5 דקות התאוששות עדינה, בלי החלטות
          </span>
        </span>
      </button>

      <VoiceCheck />
    </div>
  );
}
