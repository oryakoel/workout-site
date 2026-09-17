import { useEffect, useState } from "react";
import { C } from "../theme.js";
import { fetchHistory, computeStreak } from "../lib/history.js";
import PlantIllustration from "./PlantIllustration.jsx";

// Personal streak plant: fetches this user's own history and derives the
// streak client-side, so it needs no dedicated backend beyond the
// existing history Worker. `variant="badge"` renders a small always-on
// indicator (Home screen); `variant="full"` renders a detailed card
// (History screen).
export default function PlantWidget({ userName, variant = "full" }) {
  const [streak, setStreak] = useState(0);
  const [everTrained, setEverTrained] = useState(false);

  useEffect(() => {
    if (!userName) return;
    let cancelled = false;
    fetchHistory(userName).then((entries) => {
      if (cancelled) return;
      setStreak(computeStreak(entries));
      setEverTrained(entries.length > 0);
    });
    return () => {
      cancelled = true;
    };
  }, [userName]);

  if (!userName) return null;

  if (variant === "badge") {
    return (
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <PlantIllustration streak={streak} everTrained={everTrained} size="badge" />
        <span className="text-xs font-medium whitespace-nowrap" style={{ color: C.textMuted }}>
          {streak > 0 ? `${streak} ימים ברצף` : "התחילו היום"}
        </span>
      </div>
    );
  }

  const headline =
    streak > 0 ? `${streak} ימים ברצף` : everTrained ? "הרצף נעצר — בואו נחזור אליו" : "עדיין אין רצף";

  return (
    <div
      className="flex flex-col items-center gap-2 py-5 rounded-xl"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.line}` }}
    >
      <PlantIllustration streak={streak} everTrained={everTrained} size="full" />
      <div className="text-center">
        <div className="text-lg font-bold" style={{ color: C.text }}>
          {headline}
        </div>
        <div className="text-xs" style={{ color: C.textMuted }}>
          כל יום אימון מגדיל את הצמח שלך
        </div>
      </div>
    </div>
  );
}
