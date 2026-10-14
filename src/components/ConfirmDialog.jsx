import { useEffect, useId, useRef } from "react";
import { C } from "../theme.js";
import { Button } from "./ui.jsx";

// An in-app replacement for window.confirm: same look as the rest of the app,
// readable by screen readers, closes with Escape or a tap outside, and keeps
// keyboard focus inside while open. Focus starts on the safe choice.
export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel = "ביטול", onConfirm, onCancel }) {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    cancelRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel();
    } else if (e.key === "Tab") {
      const first = cancelRef.current;
      const last = confirmRef.current;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(5, 9, 7, 0.72)" }}
      onClick={onCancel}
      onKeyDown={onKeyDown}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        dir="rtl"
        className="w-full rounded-3xl p-6 flex flex-col gap-5"
        style={{ maxWidth: "420px", backgroundColor: C.surface, border: `1px solid ${C.lineStrong}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <h2 id={titleId} className="text-xl font-bold" style={{ color: C.text }}>
            {title}
          </h2>
          <p id={messageId} className="text-base leading-relaxed" style={{ color: C.textMuted }}>
            {message}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button ref={confirmRef} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
