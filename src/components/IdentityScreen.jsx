import { useState } from "react";
import { C } from "../theme.js";
import { PRESET_USERS } from "../lib/history.js";

export default function IdentityScreen({ onSelect, onSkip }) {
  const [showOther, setShowOther] = useState(false);
  const [otherName, setOtherName] = useState("");

  const confirmOther = () => {
    const trimmed = otherName.trim();
    if (trimmed) onSelect(trimmed);
  };

  return (
    <div className="flex flex-col h-full px-6 py-8 items-center justify-center gap-8 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: C.text }}>
          מי מתאמן?
        </h1>
        <p className="text-sm" style={{ color: C.textMuted }}>
          כדי לשמור את היסטוריית האימונים שלך
        </p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        {PRESET_USERS.map((name) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className="py-4 rounded-xl text-lg font-medium touch-manipulation"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, color: C.text }}
          >
            {name}
          </button>
        ))}

        {!showOther ? (
          <button
            onClick={() => setShowOther(true)}
            className="py-4 rounded-xl text-lg font-medium touch-manipulation"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, color: C.textMuted }}
          >
            אחר
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              value={otherName}
              onChange={(e) => setOtherName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmOther()}
              placeholder="השם שלך"
              className="py-3 px-4 rounded-xl text-lg text-center"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.teal}`, color: C.text }}
            />
            <button
              onClick={confirmOther}
              disabled={!otherName.trim()}
              className="py-4 rounded-xl text-lg font-medium touch-manipulation disabled:opacity-40"
              style={{ backgroundColor: C.amber, color: C.bg }}
            >
              המשך
            </button>
          </div>
        )}
      </div>

      <button onClick={onSkip} className="text-sm underline touch-manipulation" style={{ color: C.textMuted }}>
        להתאמן בלי שמירה
      </button>
    </div>
  );
}
