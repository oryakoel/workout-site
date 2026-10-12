import { useState } from "react";
import { Check } from "lucide-react";
import { C } from "../theme.js";
import { daysLabel, plantLabel } from "../lib/consistency.js";
import { Card, Chip } from "./ui.jsx";
import PlantIllustration from "./PlantIllustration.jsx";

const DAY_LETTERS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const STATUS_TEXT = { done: "אימון הושלם", partial: "אימון חלקי", none: "ללא אימון" };

function statusLine(week) {
  if (week.met) return "הגעתם ליעד השבועי. כל הכבוד!";
  if (week.remaining <= week.daysLeft) return `עוד ${daysLabel(week.remaining)} ליעד השבועי`;
  return "גם אם לא מגיעים ליעד השבוע, כל אימון מקדם את הצמח.";
}

function DayDot({ day, index }) {
  const { status, isToday, isFuture } = day;
  const done = status === "done";
  const partial = status === "partial";
  const label = `${isToday ? "היום, " : ""}יום ${DAY_NAMES[index]}: ${isFuture ? "עוד לא הגיע" : STATUS_TEXT[status]}`;
  return (
    <li className="flex flex-col items-center gap-1.5" aria-label={label}>
      <span className="text-xs" style={{ color: isToday ? C.text : C.textMuted }} aria-hidden="true">
        {DAY_LETTERS[index]}
      </span>
      <span
        aria-hidden="true"
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: done ? C.accent : "transparent",
          border: `2px ${partial ? "dashed" : "solid"} ${done || partial ? C.accent : isToday ? C.text : C.line}`,
          opacity: isFuture ? 0.45 : 1,
        }}
      >
        {done && <Check size={18} color={C.bg} strokeWidth={3} />}
      </span>
    </li>
  );
}

// The week at a glance: how many days trained against the goal, the plant
// it is growing, and a way to change the goal.
export default function WeekCard({ consistency, goal, onGoalChange, offline }) {
  const [editing, setEditing] = useState(false);
  const { thisWeek } = consistency;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium" style={{ color: C.textMuted }}>
            השבוע שלך
          </h2>
          <p className="text-2xl font-bold mt-1" style={{ color: C.text }}>
            {thisWeek.done} מתוך {goal} ימים
          </p>
          <p className="text-sm mt-1 leading-snug" style={{ color: C.textMuted }}>
            {statusLine(thisWeek)}
          </p>
        </div>
        <PlantIllustration
          size="badge"
          level={consistency.level}
          condition={consistency.condition}
          label={plantLabel(consistency)}
        />
      </div>

      <ol className="flex items-center justify-between" aria-label="ימי השבוע">
        {thisWeek.days.map((day, i) => (
          <DayDot key={i} day={day} index={i} />
        ))}
      </ol>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setEditing((v) => !v)}
          aria-expanded={editing}
          className="text-xs touch-manipulation py-2"
          style={{ color: C.textMuted }}
        >
          יעד שבועי: {daysLabel(goal)} · {editing ? "סגירה" : "שינוי"}
        </button>
        {offline && (
          <span className="text-xs" style={{ color: C.textMuted }}>
            מוצג המצב האחרון שנשמר
          </span>
        )}
      </div>

      {editing && (
        <div role="group" aria-label="יעד שבועי בימים" className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <Chip key={n} selected={goal === n} onClick={() => onGoalChange(n)} aria-label={daysLabel(n)}>
              {n}
            </Chip>
          ))}
        </div>
      )}
    </Card>
  );
}
