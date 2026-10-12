import { PersonStanding, BookOpen, CalendarCheck } from "lucide-react";
import { C } from "../theme.js";

const TABS = [
  { id: "home", label: "אימון", Icon: PersonStanding },
  { id: "library", label: "ספרייה", Icon: BookOpen },
  { id: "history", label: "היסטוריה", Icon: CalendarCheck },
];

// Bottom navigation: always within thumb reach, shown only on the three
// browsing screens (hidden during a workout so nothing competes with it).
export default function TabBar({ active, onChange }) {
  return (
    <nav
      aria-label="ניווט ראשי"
      className="shrink-0 flex"
      style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.line}` }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={isActive ? "page" : undefined}
            className="flex-1 flex flex-col items-center gap-1 pt-3 pb-3 touch-manipulation transition-colors duration-200"
            style={{ color: isActive ? C.accent : C.textMuted }}
          >
            <Icon size={22} aria-hidden="true" strokeWidth={isActive ? 2.4 : 1.9} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
