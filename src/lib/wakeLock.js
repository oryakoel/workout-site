import { useEffect, useState } from "react";

// Keeps the screen on while `enabled` is true. Browsers drop the lock
// whenever the tab is hidden, so it is re-requested on return.
// Returns "unsupported" | "active" | "inactive".
export function useWakeLock(enabled) {
  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!enabled || !supported) return;
    let sentinel = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) {
          next.release().catch(() => {});
          return;
        }
        sentinel = next;
        setHeld(true);
        next.addEventListener("release", () => {
          if (!cancelled) setHeld(false);
        });
      } catch {
        if (!cancelled) setHeld(false);
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && (!sentinel || sentinel.released)) acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      sentinel?.release().catch(() => {});
    };
  }, [enabled, supported]);

  if (!supported) return "unsupported";
  return enabled && held ? "active" : "inactive";
}
