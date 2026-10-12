import { useEffect, useRef } from "react";
import { Play, Pause, SkipForward, SkipBack, X, Volume2, VolumeX } from "lucide-react";
import { C, FONT_MONO } from "../theme.js";
import { formatTime, SIDE_LABEL } from "../lib/workoutEngine.js";
import { exerciseAnnouncement, restAnnouncement, prepAnnouncement, tenSecondsLeftAnnouncement } from "../lib/announcements.js";
import { announce, cancelSpeech, playBeep, useTTSMuted } from "../lib/tts.js";
import ProgressDots from "./ProgressDots.jsx";

export default function ActiveScreen({
  queue,
  index,
  timeLeft,
  isPaused,
  interrupted,
  wakeLockStatus,
  onPauseToggle,
  onSkip,
  onPrev,
  onQuit,
}) {
  const item = queue[index];
  const isRest = item.type === "rest";
  const accent = isRest ? C.sage : C.accent;
  const exerciseNum = queue.slice(0, index + 1).filter((q) => q.type === "exercise").length;
  const totalExercises = queue.filter((q) => q.type === "exercise").length;

  const [muted, toggleMuted] = useTTSMuted();
  const announcedTenSecRef = useRef(null);
  const beepedSecondsRef = useRef(new Set());

  useEffect(() => {
    announcedTenSecRef.current = null;
    beepedSecondsRef.current = new Set();
    if (item.type === "exercise") {
      announce(item.side === "left" ? "side" : "exercise", exerciseAnnouncement(item.exercise, item.side));
    } else if (item.isPrep) {
      announce("prep", prepAnnouncement(item.nextExercise, item.nextSide));
    } else {
      announce("rest", restAnnouncement(item.nextExercise, item.nextSide));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (isPaused) cancelSpeech();
  }, [isPaused]);

  useEffect(() => {
    if (
      item.type === "exercise" &&
      item.duration > 12 &&
      timeLeft === 10 &&
      announcedTenSecRef.current !== index
    ) {
      announcedTenSecRef.current = index;
      announce("tenSeconds", tenSecondsLeftAnnouncement());
    }
  }, [timeLeft, item, index]);

  useEffect(() => {
    if (isPaused) return;
    if (timeLeft >= 1 && timeLeft <= 3 && !beepedSecondsRef.current.has(timeLeft)) {
      beepedSecondsRef.current.add(timeLeft);
      playBeep();
    }
  }, [timeLeft, isPaused]);

  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-8">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onQuit}
          aria-label="יציאה מהאימון"
          className="p-3 -m-3 touch-manipulation"
          style={{ color: C.textMuted }}
        >
          <X size={22} aria-hidden="true" />
        </button>
        <span className="text-sm" style={{ color: C.textMuted }}>
          {item.isPrep ? "מתכוננים" : `תרגיל ${exerciseNum} מתוך ${totalExercises}`}
        </span>
        <button
          onClick={toggleMuted}
          aria-label={muted ? "ביטול השתקה" : "השתקת ההנחיות"}
          aria-pressed={muted}
          className="p-3 -m-3 touch-manipulation"
          style={{ color: C.textMuted }}
        >
          {muted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
        </button>
      </div>

      <ProgressDots queue={queue} index={index} />

      {interrupted && isPaused && (
        <div
          role="status"
          className="mt-3 px-4 py-3 rounded-xl text-sm leading-relaxed"
          style={{ backgroundColor: C.accentDim, border: `1px solid ${C.accent}`, color: C.text }}
        >
          האימון הושהה כי יצאתם מהאפליקציה. לחצו על כפתור ההפעלה כדי להמשיך בדיוק מאותה נקודה.
        </div>
      )}
      {wakeLockStatus === "unsupported" && !isPaused && (
        <p className="mt-3 text-xs" style={{ color: C.textMuted }}>
          הדפדפן לא מאפשר להשאיר את המסך דלוק. אם המסך ייכבה, האימון יושהה.
        </p>
      )}

      <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4 overflow-y-auto">
        {isRest ? (
          <div className="flex flex-col items-center gap-4">
            <span className="text-lg font-medium" style={{ color: C.sage }}>
              {item.isPrep ? "התכוננו" : "מנוחה"}
            </span>
            {item.nextExercise && (
              <>
                <div
                  className="w-full rounded-2xl p-4 relative"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, aspectRatio: "6 / 5", maxWidth: "380px" }}
                >
                  <div style={{ width: "100%", height: "100%", transform: item.nextSide === "left" ? "scaleX(-1)" : undefined }}>
                    <item.nextExercise.Illustration alt={item.nextExercise.name} />
                  </div>
                  {item.nextSide && (
                    <span
                      className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: C.accent, color: C.bg }}
                    >
                      {SIDE_LABEL[item.nextSide]}
                    </span>
                  )}
                </div>
                <span className="text-sm text-center" style={{ color: C.textMuted }}>
                  {item.isPrep ? "תרגיל ראשון: " : "הבא: "}
                  {item.nextExercise.name}
                  {item.nextSide ? ` · ${SIDE_LABEL[item.nextSide]}` : ""}
                </span>
              </>
            )}
          </div>
        ) : (
          <>
            <div
              className="w-full rounded-2xl p-4 relative"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, aspectRatio: "6 / 5", maxWidth: "380px" }}
            >
              <div style={{ width: "100%", height: "100%", transform: item.side === "left" ? "scaleX(-1)" : undefined }}>
                <item.exercise.Illustration alt={item.exercise.name} />
              </div>
              {item.side && (
                <span
                  className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: C.accent, color: C.bg }}
                >
                  {SIDE_LABEL[item.side]}
                </span>
              )}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1" style={{ color: C.text }}>
                {item.exercise.name}
              </h2>
              <span className="text-sm" style={{ color: C.textMuted }}>
                {item.exercise.muscleGroup}
              </span>
            </div>
            <ul className="w-full max-w-sm flex flex-col gap-2 px-2">
              {item.exercise.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: C.text }}>
                  <span className="mt-1.5 shrink-0 rounded-full" style={{ width: "5px", height: "5px", backgroundColor: C.accent }} />
                  {tip}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-6 shrink-0">
        <span
          role="timer"
          aria-label="זמן שנותר"
          className="text-6xl font-semibold tabular-nums"
          style={{ fontFamily: FONT_MONO, color: accent }}
        >
          {formatTime(timeLeft)}
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={onPrev}
            disabled={index === 0}
            aria-label="שלב קודם"
            className="p-4 rounded-full touch-manipulation disabled:opacity-30"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, color: C.text }}
          >
            {/* dir="rtl" mirrors this button to the right, so the icon
                that visually points right ("back" in RTL reading order)
                is the correct one for "previous" here. */}
            <SkipForward size={22} aria-hidden="true" />
          </button>
          <button
            onClick={onPauseToggle}
            aria-label={isPaused ? "המשך" : "השהיה"}
            className="p-6 rounded-full touch-manipulation"
            style={{ backgroundColor: accent, color: C.bg }}
          >
            {isPaused ? <Play size={26} aria-hidden="true" /> : <Pause size={26} aria-hidden="true" />}
          </button>
          <button
            onClick={onSkip}
            aria-label="שלב הבא"
            className="p-4 rounded-full touch-manipulation"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, color: C.text }}
          >
            {/* mirrored to the left by dir="rtl" — points left, "forward"
                in RTL reading order, matching the next-exercise action. */}
            <SkipBack size={22} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
