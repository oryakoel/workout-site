import { C } from "../theme.js";

const TABS = [
  { id: "home", label: "אימון" },
  { id: "library", label: "ספריית תרגילים" },
];

export default function NavTabs({ active, onChange }) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-2xl shrink-0"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.line}` }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors touch-manipulation"
            style={{
              backgroundColor: isActive ? C.amber : "transparent",
              color: isActive ? C.bg : C.textMuted,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
