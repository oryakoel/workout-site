import { CloudOff } from "lucide-react";
import { C } from "../theme.js";
import { Button } from "./ui.jsx";

// Shown only while finished workouts are still waiting to be saved.
export default function SyncNotice({ pending, needsSignIn, onSignIn }) {
  if (!pending) return null;
  const waiting = pending === 1 ? "אימון אחד" : `${pending} אימונים`;
  return (
    <div
      role="status"
      className="flex items-center gap-3 p-4 rounded-2xl"
      style={{ backgroundColor: C.accentDim, border: `1px solid ${C.line}`, color: C.text }}
    >
      <CloudOff size={20} aria-hidden="true" color={C.accent} className="shrink-0" />
      <p className="flex-1 text-sm leading-relaxed">
        {needsSignIn
          ? `${waiting} ${pending === 1 ? "מחכה" : "מחכים"} לשמירה. כדי לשמור ${pending === 1 ? "אותו" : "אותם"} צריך להתחבר שוב.`
          : `${waiting} ${pending === 1 ? "ממתין" : "ממתינים"} לסנכרון. ${pending === 1 ? "הוא יישלח" : "הם יישלחו"} ברגע שיהיה חיבור.`}
      </p>
      {needsSignIn && (
        <Button size="sm" onClick={onSignIn}>
          התחברות
        </Button>
      )}
    </div>
  );
}
