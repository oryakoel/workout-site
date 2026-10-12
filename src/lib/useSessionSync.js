import { useCallback, useEffect, useState } from "react";
import { flushQueue, onQueueChange, pendingCount } from "./sessionQueue.js";

// Keeps finished sessions flowing to the server: tries at launch, whenever
// the connection returns or the app comes back to the foreground, and once
// a minute while open. Reports how many are still waiting and whether the
// person must sign in again for them to go through.
export function useSessionSync() {
  const [pending, setPending] = useState(pendingCount);
  const [authRequiredFor, setAuthRequiredFor] = useState(null);

  const flush = useCallback(async () => {
    const result = await flushQueue();
    setPending(result.pending);
    setAuthRequiredFor(result.authRequiredFor);
    return result;
  }, []);

  useEffect(() => {
    let active = true;
    flushQueue().then((result) => {
      if (!active) return;
      setPending(result.pending);
      setAuthRequiredFor(result.authRequiredFor);
    });
    const stopQueueEvents = onQueueChange(() => setPending(pendingCount()));
    const onOnline = () => flush();
    const onVisible = () => {
      if (document.visibilityState === "visible") flush();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(flush, 60000);
    return () => {
      active = false;
      stopQueueEvents();
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [flush]);

  return { pending, authRequiredFor, flush };
}
