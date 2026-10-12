import { C } from "../theme.js";

// Shared building blocks of the visual language: large rounded surfaces,
// 44px+ touch targets, one accent for the primary action per screen.

const BUTTON_SIZES = {
  lg: "h-14 px-6 text-base rounded-2xl",
  md: "h-11 px-4 text-sm rounded-xl",
  sm: "h-9 px-3 text-sm rounded-lg",
};

const BUTTON_VARIANTS = {
  primary: { backgroundColor: C.accent, color: C.bg },
  secondary: { backgroundColor: C.surfaceAlt, color: C.text, border: `1px solid ${C.line}` },
  quiet: { backgroundColor: "transparent", color: C.textMuted },
};

export function Button({ variant = "primary", size = "lg", icon: Icon, children, className = "", style, ...rest }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold touch-manipulation transition-[transform,opacity] duration-200 active:scale-[0.98] disabled:opacity-50 ${BUTTON_SIZES[size]} ${className}`}
      style={{ ...BUTTON_VARIANTS[variant], ...style }}
      {...rest}
    >
      {Icon && <Icon size={size === "lg" ? 20 : 18} aria-hidden="true" />}
      {children}
    </button>
  );
}

// A selectable pill. Always give it an accessible name via its text.
export function Chip({ selected = false, className = "", children, ...rest }) {
  return (
    <button
      aria-pressed={selected}
      className={`h-11 px-4 rounded-full text-sm font-medium touch-manipulation whitespace-nowrap transition-colors duration-200 ${className}`}
      style={{
        backgroundColor: selected ? C.accentDim : C.surface,
        border: `1px solid ${selected ? C.accent : C.line}`,
        color: selected ? C.accent : C.textMuted,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ className = "", children, ...rest }) {
  return (
    <div
      className={`rounded-3xl p-5 ${className}`}
      style={{ backgroundColor: C.surface, border: `1px solid ${C.line}` }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children, ...rest }) {
  return (
    <h2 className="text-sm font-medium mb-3" style={{ color: C.textMuted }} {...rest}>
      {children}
    </h2>
  );
}

export function Avatar({ name, size = 36 }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{ width: size, height: size, backgroundColor: C.accentDim, color: C.accent, fontSize: size * 0.45 }}
    >
      {(name || "?").trim().charAt(0)}
    </span>
  );
}
