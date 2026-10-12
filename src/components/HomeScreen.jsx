import { BatteryLow, ChevronDown, Play, Shuffle } from "lucide-react";
import { C, FONT_MONO } from "../theme.js";
import { DURATIONS_MINUTES } from "../lib/workoutEngine.js";
import { WORKOUT_TYPES } from "../data/exercises.js";
import { Avatar, Button, Card, Chip, SectionLabel } from "./ui.jsx";
import PlantWidget from "./PlantWidget.jsx";
import VoiceCheck from "./VoiceCheck.jsx";
import SyncNotice from "./SyncNotice.jsx";

const TYPE_OPTIONS = [{ id: "auto", label: "תבחר לי" }, ...WORKOUT_TYPES];

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
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pt-6 pb-6 gap-6">
      <header className="flex items-center justify-between gap-3">
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
        <PlantWidget userName={currentUser} variant="badge" />
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

      <Card className="flex flex-col gap-6">
        <section aria-labelledby="type-label">
          <SectionLabel id="type-label">סוג אימון</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                selected={prefs.type === option.id}
                onClick={() => onPrefsChange({ ...prefs, type: option.id })}
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
          <span className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
            <Shuffle size={16} aria-hidden="true" color={prefs.random ? C.accent : C.textMuted} />
            סדר אקראי
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
