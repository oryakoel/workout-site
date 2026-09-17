import { useEffect, useState } from "react";
import { C } from "../theme.js";
import { WORKOUT_TYPES } from "../data/exercises.js";
import { fetchHistory, deleteWorkoutEntry } from "../lib/history.js";
import NavTabs from "./NavTabs.jsx";
import PlantWidget from "./PlantWidget.jsx";
import { Trash2 } from "lucide-react";

const TYPE_LABELS = Object.fromEntries(WORKOUT_TYPES.map((t) => [t.id, t.label]));
TYPE_LABELS.auto = "תבחר לי";

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryScreen({ onNavigate, currentUser }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("all");

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

  const handleDelete = async (entry) => {
    if (!window.confirm("למחוק את האימון הזה לצמיתות?")) return;
    const ok = await deleteWorkoutEntry(entry.id);
    if (ok) setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  };

  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-8 gap-6 overflow-y-auto">
      <NavTabs active="history" onChange={onNavigate} />

      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
          היסטוריית אימונים
        </h1>
      </div>

      {currentUser && <PlantWidget userName={currentUser} variant="full" />}

      {users.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {["all", ...users].map((u) => {
            const isActive = userFilter === u;
            return (
              <button
                key={u}
                onClick={() => setUserFilter(u)}
                className="py-2 px-4 rounded-full text-sm font-medium touch-manipulation"
                style={{
                  backgroundColor: isActive ? C.tealDim : C.surface,
                  border: `1px solid ${isActive ? C.teal : C.line}`,
                  color: isActive ? C.teal : C.textMuted,
                }}
              >
                {u === "all" ? "הכל" : u}
              </button>
            );
          })}
        </div>
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
                  {entry.duration_minutes} דקות · {entry.exercise_count} תרגילים
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs" style={{ color: C.textMuted }}>
                  {formatDate(entry.completed_at)}
                </span>
                <button
                  onClick={() => handleDelete(entry)}
                  aria-label="מחיקת אימון"
                  className="touch-manipulation"
                  style={{ color: C.textMuted }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
