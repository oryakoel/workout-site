import { useState } from "react";
import { ListChecks, Trash2 } from "lucide-react";
import { C } from "../theme.js";
import { EXERCISES } from "../data/exercises.js";
import { planFromRoutine } from "../lib/routines.js";
import { planSeconds } from "../lib/planEdit.js";
import { Button, Card, SectionLabel } from "./ui.jsx";

function summary(routine) {
  const { items } = planFromRoutine(routine, EXERCISES);
  const minutes = Math.max(1, Math.round(planSeconds(items) / 60));
  return `${items.length} תרגילים · כ-${minutes} דקות`;
}

// The person's saved routines. Tapping one opens it in the preview, where it
// can still be adjusted before starting.
export default function RoutinesCard({ routines, onOpen, onDelete, notice }) {
  const [confirming, setConfirming] = useState(null);

  return (
    <Card className="flex flex-col gap-3">
      <section aria-labelledby="routines-label">
        <SectionLabel id="routines-label">הסדרות שלי</SectionLabel>
        {notice && (
          <p role="status" className="mb-3 text-sm leading-relaxed" style={{ color: C.accent }}>
            {notice}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {routines.map((routine) => (
            <li key={routine.id} className="flex items-center gap-2">
              {confirming === routine.id ? (
                <div
                  className="flex-1 flex items-center justify-between gap-2 rounded-2xl px-4 min-h-14"
                  style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${C.line}` }}
                >
                  <span className="text-sm" style={{ color: C.text }}>
                    למחוק את "{routine.name}"?
                  </span>
                  <span className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => {
                        setConfirming(null);
                        onDelete(routine.id);
                      }}
                    >
                      מחיקה
                    </Button>
                    <Button size="sm" variant="quiet" onClick={() => setConfirming(null)}>
                      ביטול
                    </Button>
                  </span>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onOpen(routine)}
                    className="flex-1 min-w-0 flex items-center gap-3 rounded-2xl px-4 min-h-14 text-right touch-manipulation"
                    style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${C.line}` }}
                  >
                    <ListChecks size={18} aria-hidden="true" color={C.accent} className="shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium truncate" style={{ color: C.text }}>
                        {routine.name}
                      </span>
                      <span className="block text-xs" style={{ color: C.textMuted }}>
                        {summary(routine)}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => setConfirming(routine.id)}
                    aria-label={`מחיקת הסדרה ${routine.name}`}
                    className="w-11 h-11 shrink-0 flex items-center justify-center touch-manipulation"
                    style={{ color: C.textMuted }}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </Card>
  );
}
