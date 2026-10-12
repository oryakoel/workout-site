import { useCallback, useEffect, useState } from "react";
import { Delete } from "lucide-react";
import { C } from "../theme.js";
import { claimName, getAuthStatus } from "../lib/auth.js";
import { Button } from "./ui.jsx";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const COPY = {
  set: (name) => ({
    title: "קבעו קוד אישי",
    body: `ארבע ספרות. הקוד מגן על ההיסטוריה של ${name}, ויידרש רק כשנכנסים ממכשיר חדש.`,
  }),
  confirm: () => ({ title: "אישור הקוד", body: "הקלידו שוב את אותן ארבע ספרות." }),
  enter: (name) => ({ title: `שלום, ${name}`, body: "הקלידו את הקוד שלכם כדי להמשיך." }),
};

// Signs a name in (or sets its PIN the first time). The server tells us
// which one applies; this screen only ever shows dots, never the digits.
export default function PinScreen({ name, onSuccess, onBack, onContinueUnsaved }) {
  const [phase, setPhase] = useState("loading"); // loading | offline | set | confirm | enter
  const [digits, setDigits] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    const status = await getAuthStatus(name);
    setPhase(!status.ok ? "offline" : status.claimed ? "enter" : "set");
  }, [name]);

  useEffect(() => {
    let active = true;
    getAuthStatus(name).then((status) => {
      if (active) setPhase(!status.ok ? "offline" : status.claimed ? "enter" : "set");
    });
    return () => {
      active = false;
    };
  }, [name]);

  const retry = () => {
    setPhase("loading");
    load();
  };

  const submit = async (pin) => {
    setBusy(true);
    const result = await claimName(name, pin);
    setBusy(false);
    setDigits("");
    if (result.ok) {
      onSuccess(result.token);
      return;
    }
    if (result.reason === "wrong_pin") setNotice(`הקוד שגוי. נשארו ${result.attemptsLeft} ניסיונות.`);
    else if (result.reason === "locked") setNotice(`יותר מדי ניסיונות. נסו שוב בעוד ${Math.ceil(result.retryAfterSeconds / 60)} דקות.`);
    else if (result.reason === "network") setNotice("אין חיבור לשרת. נסו שוב.");
    else setNotice("משהו השתבש. נסו שוב.");
    // Someone may have claimed the name a moment ago: ask the server again.
    if (phase === "confirm" && result.reason !== "network") {
      setFirstPin("");
      load();
    }
  };

  const handleDigit = (digit) => {
    if (busy || (phase !== "set" && phase !== "confirm" && phase !== "enter")) return;
    const next = (digits + digit).slice(0, PIN_LENGTH);
    setDigits(next);
    setNotice(null);
    if (next.length < PIN_LENGTH) return;

    // Let the last dot fill in before moving on.
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (phase === "set") {
        setFirstPin(next);
        setDigits("");
        setPhase("confirm");
      } else if (phase === "confirm" && next !== firstPin) {
        setNotice("הקודים לא תואמים. נסו שוב מההתחלה.");
        setDigits("");
        setFirstPin("");
        setPhase("set");
      } else {
        submit(next);
      }
    }, 160);
  };

  const handleBackspace = () => {
    if (!busy) setDigits((d) => d.slice(0, -1));
  };

  // Physical keyboards (desktop) work too.
  useEffect(() => {
    const onKey = (event) => {
      if (/^\d$/.test(event.key)) handleDigit(event.key);
      else if (event.key === "Backspace") handleBackspace();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (phase === "loading") {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 px-5 text-center">
        <p role="status" className="text-base" style={{ color: C.textMuted }}>
          בודקים...
        </p>
      </div>
    );
  }

  if (phase === "offline") {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-6 px-5 text-center">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
            אין חיבור
          </h1>
          <p className="text-base leading-relaxed" style={{ color: C.textMuted }}>
            כדי להתחבר צריך אינטרנט. אפשר לנסות שוב, או להתאמן בלי שמירה.
          </p>
        </div>
        <div className="w-full max-w-sm flex flex-col gap-3">
          <Button onClick={retry}>נסו שוב</Button>
          <Button variant="secondary" onClick={onContinueUnsaved}>
            להתאמן בלי שמירה
          </Button>
          <Button variant="quiet" size="md" onClick={onBack}>
            חזרה
          </Button>
        </div>
      </div>
    );
  }

  const copy = COPY[phase](name);

  return (
    <div className="flex flex-col h-full items-center justify-center gap-6 px-5 text-center overflow-y-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
          {copy.title}
        </h1>
        <p className="text-base leading-relaxed max-w-xs" style={{ color: C.textMuted }}>
          {copy.body}
        </p>
      </div>

      <div
        role="img"
        aria-label={`הוזנו ${digits.length} מתוך ${PIN_LENGTH} ספרות`}
        className="flex items-center gap-4 h-6"
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className="w-4 h-4 rounded-full transition-colors duration-150"
            style={{
              backgroundColor: i < digits.length ? C.accent : "transparent",
              border: `2px solid ${i < digits.length ? C.accent : C.lineStrong}`,
            }}
          />
        ))}
      </div>

      <p role="alert" className="text-sm min-h-5" style={{ color: C.accent }}>
        {notice}
      </p>

      {/* A phone keypad reads left to right even in a right-to-left app. */}
      <div dir="ltr" className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {KEYS.map((key) => (
          <Key key={key} onPress={() => handleDigit(key)} disabled={busy}>
            {key}
          </Key>
        ))}
        <span />
        <Key onPress={() => handleDigit("0")} disabled={busy}>
          0
        </Key>
        <Key onPress={handleBackspace} disabled={busy} label="מחיקת ספרה">
          <Delete size={22} aria-hidden="true" />
        </Key>
      </div>

      <div className="flex flex-col items-center gap-1">
        {phase === "enter" && (
          <p className="text-xs" style={{ color: C.textMuted }}>
            שכחתם את הקוד? בקשו איפוס ממנהל האתר.
          </p>
        )}
        <Button variant="quiet" size="md" onClick={onContinueUnsaved}>
          להתאמן בלי שמירה
        </Button>
        <Button variant="quiet" size="md" onClick={onBack}>
          חזרה
        </Button>
      </div>
    </div>
  );
}

function Key({ onPress, disabled, label, children }) {
  return (
    <button
      onClick={onPress}
      disabled={disabled}
      aria-label={label}
      className="h-16 rounded-2xl text-2xl font-semibold touch-manipulation active:scale-95 transition-transform duration-150 disabled:opacity-60 flex items-center justify-center"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.line}`, color: C.text }}
    >
      {children}
    </button>
  );
}
