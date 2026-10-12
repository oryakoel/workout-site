import { useEffect, useState } from "react";
import { C } from "../theme.js";
import { WORKOUT_TYPES } from "../data/exercises.js";
import { fetchHistory, deleteWorkoutEntry } from "../lib/history.js";
import { getAuthStatus, getToken } from "../lib/auth.js";
import { Chip } from "./ui.jsx";
import PlantWidget from "./PlantWidget.jsx";
import SyncNotice from "./SyncNotice.jsx";
import { Trash2 } from "lucide-react";

const TYPE_LABELS = Object.fromEntries(WORKOUT_TYPES.map((t) => [t.id, t.label]));
TYPE_LABELS.auto = "תבחר לי";

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryScreen({ currentUser, syncPending, needsSignIn, onSignIn }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("all");
  // Names nobody has set a PIN for: their entries stay deletable by anyone.
  const [unclaimed, setUnclaimed] = useState(() => new Set());
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchHistory().then((data) => {
      if (!cancelled) {
        setEntries(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const users = [...new Set(entries.map((e) => e.user_name))];
  const visible = userFilter === "all" ? entries : entries.filter((e) => e.user_name === userFilter);

  const usersKey = users.join("|");
  useEffect(() => {
    let cancelled = false;
    users
      .filter((name) => name !== currentUser)
      .forEach(async (name) => {
        const status = await getAuthStatus(name);
        if (!cancelled && status.ok && !status.claimed) setUnclaimed((prev) => new Set(prev).add(name));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersKey, currentUser]);

  // You can delete your own entries, and those of names nobody has claimed.
  const canDelete = (entry) => entry.user_name === currentUser || unclaimed.has(entry.user_name);

  const handleDelete = async (entry) => {
    if (!window.confirm("למחוק את האימון הזה לצמיתות?")) return;
    setMessage(null);
    const result = await deleteWorkoutEntry(entry.id, getToken(currentUser));
    if (result.ok) setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    else if (result.status === 401) setMessage("אין הרשאה למחוק את האימון הזה. אפשר למחוק רק אימונים שלכם, ואם צריך להתחבר שוב.");
    else setMessage("המחיקה נכשלה. בדקו את החיבור ונסו שוב.");
  };

  return (
    <div className="flex flex-col h-full px-5 pt-6 pb-6 gap-6 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
          היסטוריית אימונים
        </h1>
      </div>

      <SyncNotice pending={syncPending} needsSignIn={needsSignIn} onSignIn={onSignIn} />

      {currentUser && <PlantWidget userName={currentUser} variant="full" />}

      {users.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="סינון לפי משתמש">
          {["all", ...users].map((u) => (
            <Chip key={u} selected={userFilter === u} onClick={() => setUserFilter(u)}>
              {u === "all" ? "הכל" : u}
            </Chip>
          ))}
        </div>
      )}

      {message && (
        <p role="alert" className="text-sm" style={{ color: C.accent }}>
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-center" style={{ color: C.textMuted }}>
          טוען...
        </p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-center" style={{ color: C.textMuted }}>
          עדיין אין אימונים שמורים
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.line}` }}
            >
              <div>
                <div className="text-sm font-medium" style={{ color: C.text }}>
                  {entry.user_name} · {TYPE_LABELS[entry.workout_type] || entry.workout_type}
                </div>
                <div className="text-xs" style={{ color: C.textMuted }}>
                  {entry.status === "partial" && entry.completed_seconds != null
                    ? `חלקי · ${Math.max(1, Math.round(entry.completed_seconds / 60))} דק׳ מתוך ${entry.duration_minutes}`
                    : `${entry.duration_minutes} דקות · ${entry.exercise_count} תרגילים`}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs" style={{ color: C.textMuted }}>
                  {formatDate(entry.completed_at)}
                </span>
                {canDelete(entry) && (
                  <button
                    onClick={() => handleDelete(entry)}
                    aria-label="מחיקת אימון"
                    className="p-2 -m-2 touch-manipulation"
                    style={{ color: C.textMuted }}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
