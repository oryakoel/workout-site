import { useEffect } from "react";
import { Check, RotateCcw, CloudOff } from "lucide-react";
import { C } from "../theme.js";
import { announce } from "../lib/tts.js";
import { doneAnnouncement } from "../lib/announcements.js";
import { Button } from "./ui.jsx";

const minutes = (seconds) => Math.max(1, Math.round(seconds / 60));

// What the screen says depends on how the session was recorded: a finished
// workout gets the cheer; a partial one is saved honestly as partial; one
// skipped through in seconds isn't saved at all.
function describe(outcome) {
  if (outcome.status === "completed") {
    return {
      title: "כל הכבוד!",
      body: `התאמנתם ${minutes(outcome.completedSeconds)} דקות · ${outcome.exercisesDone} תרגילים`,
    };
  }
  if (outcome.status === "partial") {
    return {
      title: "אימון חלקי",
      body: `התאמנתם ${minutes(outcome.completedSeconds)} דקות מתוך ${outcome.plannedMinutes}. אימון חלקי לא נחשב כיום אימון מלא.`,
    };
  }
  return { title: "האימון היה קצר מדי", body: "דילגתם על רוב השלבים, ולכן הוא לא נשמר." };
}

export default function DoneScreen({ outcome, syncPending, onRestart }) {
  useEffect(() => {
    if (outcome.status === "completed") announce("done", doneAnnouncement());
  }, [outcome.status]);

  const { title, body } = describe(outcome);
  const notSaved = outcome.status !== "none" && !outcome.saved;

  return (
    <div className="flex flex-col items-center justify-center h-full px-5 text-center gap-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ backgroundColor: outcome.status === "completed" ? C.accentDim : C.surfaceAlt }}
      >
        <Check size={36} aria-hidden="true" color={outcome.status === "completed" ? C.accent : C.textMuted} />
      </div>
      <div className="max-w-xs">
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
          {title}
        </h1>
        <p className="text-base leading-relaxed" style={{ color: C.textMuted }}>
          {body}
        </p>
        {notSaved && (
          <p className="text-sm mt-3" style={{ color: C.textMuted }}>
            האימון לא נשמר כי התאמנתם בלי שמירה.
          </p>
        )}
        {outcome.saved && outcome.status !== "none" && syncPending > 0 && (
          <p className="flex items-center justify-center gap-2 text-sm mt-3" style={{ color: C.textMuted }}>
            <CloudOff size={16} aria-hidden="true" />
            יישמר ברגע שיהיה חיבור.
          </p>
        )}
      </div>
      <Button icon={RotateCcw} onClick={onRestart}>
        אימון חדש
      </Button>
    </div>
  );
}
