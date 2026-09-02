import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { C } from "../theme.js";
import { speak } from "../lib/tts.js";
import { doneAnnouncement } from "../lib/announcements.js";

export default function DoneScreen({ minutes, exerciseCount, onRestart }) {
  useEffect(() => {
    speak(doneAnnouncement());
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: C.amberDim }}>
        <span className="text-3xl" style={{ color: C.amber }}>
          ✓
        </span>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>
          כל הכבוד!
        </h2>
        <p className="text-base" style={{ color: C.textMuted }}>
          סיימתם אימון של {minutes} דקות · {exerciseCount} תרגילים
        </p>
      </div>
      <button
        onClick={onRestart}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium touch-manipulation"
        style={{ backgroundColor: C.amber, color: C.bg }}
      >
        <RotateCcw size={18} />
        אימון חדש
      </button>
    </div>
  );
}
