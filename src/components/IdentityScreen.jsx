import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { C } from "../theme.js";
import { PRESET_USERS } from "../lib/history.js";
import { Avatar, Button } from "./ui.jsx";

// Shown on first launch, and again when the user taps their name on Home to
// switch ("onCancel" is only passed in that case).
export default function IdentityScreen({ current, onSelect, onSkip, onCancel }) {
  const [showOther, setShowOther] = useState(false);
  const [otherName, setOtherName] = useState("");

  const confirmOther = () => {
    const trimmed = otherName.trim();
    if (trimmed) onSelect(trimmed);
  };

  return (
    <div className="flex flex-col h-full px-5 py-8 items-center justify-center gap-8 text-center overflow-y-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
          {onCancel ? "מי מתאמן עכשיו?" : "מי מתאמן?"}
        </h1>
        <p className="text-base" style={{ color: C.textMuted }}>
          כדי לשמור את ההיסטוריה וההתקדמות שלך
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {PRESET_USERS.map((name) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            aria-current={current === name ? "true" : undefined}
            className="flex items-center gap-4 h-16 px-4 rounded-2xl text-lg font-medium touch-manipulation active:scale-[0.98] transition-transform duration-200"
            style={{ backgroundColor: C.surface, border: `1px solid ${current === name ? C.accent : C.line}`, color: C.text }}
          >
            <Avatar name={name} size={40} />
            <span className="flex-1 text-right">{name}</span>
            <ChevronLeft size={20} aria-hidden="true" color={C.textMuted} />
          </button>
        ))}

        {!showOther ? (
          <button
            onClick={() => setShowOther(true)}
            className="flex items-center gap-4 h-16 px-4 rounded-2xl text-lg font-medium touch-manipulation active:scale-[0.98] transition-transform duration-200"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, color: C.textMuted }}
          >
            <Avatar name="+" size={40} />
            <span className="flex-1 text-right">שם אחר</span>
            <ChevronLeft size={20} aria-hidden="true" color={C.textMuted} />
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="sr-only" htmlFor="other-name">
              השם שלך
            </label>
            <input
              id="other-name"
              autoFocus
              value={otherName}
              onChange={(e) => setOtherName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmOther()}
              placeholder="השם שלך"
              maxLength={50}
              className="h-14 px-4 rounded-2xl text-lg text-center"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.lineStrong}`, color: C.text }}
            />
            <Button onClick={confirmOther} disabled={!otherName.trim()}>
              המשך
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <Button variant="quiet" size="md" onClick={onSkip}>
          להתאמן בלי שמירה
        </Button>
        {onCancel && (
          <Button variant="quiet" size="md" onClick={onCancel}>
            ביטול
          </Button>
        )}
      </div>
    </div>
  );
}
