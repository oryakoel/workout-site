import { C } from "../theme.js";

export default function DurationTile({ minutes, onSelect }) {
  return (
    <button
      onClick={() => onSelect(minutes)}
      className="flex flex-col items-center justify-center gap-1 py-7 rounded-2xl transition-transform active:scale-95 touch-manipulation"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.line}` }}
    >
      <span className="text-4xl font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: C.text }}>
        {minutes}
      </span>
      <span className="text-sm" style={{ color: C.textMuted }}>
        דקות
      </span>
    </button>
  );
}
