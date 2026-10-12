import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { C } from "../theme.js";
import { getVoiceMode, setVoiceMode, testVoice, useVoiceStatus, playCue } from "../lib/tts.js";

const HELP =
  "ייתכן שלא מותקן קול בעברית. באנדרואיד: הגדרות, חיפוש \"טקסט לדיבור\", מנוע Google, התקנת נתוני קול ובחירת עברית. באייפון: הגדרות, נגישות, תוכן מדובר, קולות, עברית.";

function statusLine(status) {
  if (!status.supported) return "הדפדפן לא תומך בהקראה";
  if (status.hebrewName) return `זוהה קול בעברית: ${status.hebrewName}`;
  return status.loaded ? "לא זוהה קול בעברית במכשיר" : "טוען קולות...";
}

// One-time check that the device can actually speak Hebrew. Until the
// user answers it shows as a card; afterwards it shrinks to a quiet row.
export default function VoiceCheck() {
  const status = useVoiceStatus();
  const [mode, setMode] = useState(getVoiceMode);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | testing | asking | failed

  const expanded = (mode === null && !dismissed) || open;

  const runTest = async () => {
    setPhase("testing");
    const result = await testVoice();
    setPhase(result.ok ? "asking" : "failed");
  };

  const confirm = (next) => {
    setVoiceMode(next);
    setMode(next);
    setOpen(false);
    setPhase("idle");
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 text-xs touch-manipulation py-1"
        style={{ color: C.textMuted }}
      >
        {mode === "beeps" ? <VolumeX size={14} /> : <Volume2 size={14} />}
        {mode === "beeps" ? "צפצופים בלבד · בדיקת קול" : mode === "voice" ? "הקול פעיל · בדיקת קול" : "בדיקת קול"}
      </button>
    );
  }

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2">
        <Volume2 size={18} color={C.sage} />
        <span className="font-medium" style={{ color: C.text }}>
          בדיקת קול
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
        כדי לוודא שההנחיות הקוליות עובדות בטלפון שלכם. {statusLine(status)}.
      </p>

      {(phase === "idle" || phase === "testing") && (
        <div className="flex gap-2">
          <button
            onClick={runTest}
            disabled={phase === "testing"}
            className="flex-1 py-3 rounded-xl font-medium touch-manipulation disabled:opacity-60"
            style={{ backgroundColor: C.accent, color: C.bg }}
          >
            {phase === "testing" ? "משמיע..." : "השמעת בדיקה"}
          </button>
          {mode === null ? (
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-3 rounded-xl text-sm touch-manipulation"
              style={{ color: C.textMuted }}
            >
              אחר כך
            </button>
          ) : (
            <button onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl text-sm touch-manipulation" style={{ color: C.textMuted }}>
              סגירה
            </button>
          )}
        </div>
      )}

      {phase === "asking" && (
        <>
          <p className="text-sm" style={{ color: C.text }}>
            שמעתם משפט בעברית?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => confirm("voice")}
              className="flex-1 py-3 rounded-xl font-medium touch-manipulation"
              style={{ backgroundColor: C.sageDim, border: `1px solid ${C.sage}`, color: C.sage }}
            >
              כן, שמעתי
            </button>
            <button
              onClick={() => setPhase("failed")}
              className="flex-1 py-3 rounded-xl font-medium touch-manipulation"
              style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${C.line}`, color: C.text }}
            >
              לא שמעתי
            </button>
          </div>
        </>
      )}

      {phase === "failed" && (
        <>
          <p className="text-sm leading-relaxed" style={{ color: C.text }}>
            אפשר להמשיך עם צפצופים: צליל שונה לכל שלב באימון, והשם של כל תרגיל מופיע על המסך.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>
            {HELP}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => confirm("beeps")}
              className="flex-1 py-3 rounded-xl font-medium touch-manipulation"
              style={{ backgroundColor: C.accent, color: C.bg }}
            >
              המשך עם צפצופים
            </button>
            <button
              onClick={() => playCue("exercise")}
              className="px-4 py-3 rounded-xl text-sm touch-manipulation"
              style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${C.line}`, color: C.text }}
            >
              שמעו צפצוף
            </button>
            <button onClick={() => setPhase("idle")} className="px-4 py-3 rounded-xl text-sm touch-manipulation" style={{ color: C.textMuted }}>
              נסו שוב
            </button>
          </div>
        </>
      )}
    </div>
  );
}
