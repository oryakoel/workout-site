import { useState, useEffect, useRef } from "react";
import { C } from "./theme.js";
import { startClock, pauseClock, resumeClock, isRunning, secondsLeft, advanceClock } from "./lib/sessionClock.js";
import { useWakeLock } from "./lib/wakeLock.js";
import { EXERCISES, WORKOUT_TYPES } from "./data/exercises.js";
import {
  buildWorkout,
  buildQuickStartWorkout,
  filterByType,
  QUICK_START_MINUTES,
  FLEXIBILITY_FINALE_ID,
  DURATIONS_MINUTES,
} from "./lib/workoutEngine.js";
import HomeScreen from "./components/HomeScreen.jsx";
import LibraryScreen from "./components/LibraryScreen.jsx";
import ActiveScreen from "./components/ActiveScreen.jsx";
import DoneScreen from "./components/DoneScreen.jsx";
import IdentityScreen from "./components/IdentityScreen.jsx";
import HistoryScreen from "./components/HistoryScreen.jsx";
import TabBar from "./components/TabBar.jsx";
import { saveUser, logWorkout, readIdentity, GUEST } from "./lib/history.js";
import { loadPrefs, savePrefs } from "./lib/prefs.js";

export default function App() {
  // This device remembers who it last was, so the app opens straight to
  // Home; tapping the name there brings the picker back.
  const [identity] = useState(readIdentity);
  const [hasChosenIdentity, setHasChosenIdentity] = useState(identity.chosen);
  const [screen, setScreen] = useState(identity.chosen ? "home" : "identity");
  const [currentUser, setCurrentUser] = useState(identity.user);
  const [prefs, setPrefs] = useState(() =>
    loadPrefs({ types: ["auto", ...WORKOUT_TYPES.map((t) => t.id)], minutes: DURATIONS_MINUTES }),
  );
  const workoutType = prefs.type;
  const [queue, setQueue] = useState([]);
  const [lastMinutes, setLastMinutes] = useState(10);

  // The session is { index, clock }: which step we're on and a timestamp
  // clock for it. The ref mirrors it so timers/event handlers always read
  // the latest value without stale closures; `now` only exists to make
  // the displayed countdown re-render.
  const [session, setSession] = useState({ index: 0, clock: startClock(0, 0), done: false });
  const sessionRef = useRef(session);
  const [now, setNow] = useState(0);
  const [interrupted, setInterrupted] = useState(false);

  const commit = (next) => {
    sessionRef.current = next;
    setSession(next);
  };

  const { index, clock } = session;
  const isPaused = !isRunning(clock);
  const timeLeft = secondsLeft(clock, now);
  const wakeLockStatus = useWakeLock(screen === "active" && !isPaused);

  const chooseIdentity = (name) => {
    saveUser(name);
    setCurrentUser(name);
    setHasChosenIdentity(true);
    setScreen("home");
  };

  // currentUser stays null — logWorkout already no-ops without a
  // userName, so nothing gets saved while training as a guest.
  const skipIdentity = () => {
    saveUser(GUEST);
    setCurrentUser(null);
    setHasChosenIdentity(true);
    setScreen("home");
  };

  const launchQueue = (q, minutes) => {
    const t = Date.now();
    setQueue(q);
    commit({ index: 0, clock: startClock(q[0].duration, t), done: false });
    setNow(t);
    setInterrupted(false);
    setLastMinutes(minutes);
    setScreen("active");
  };

  const changePrefs = (next) => {
    setPrefs(next);
    savePrefs(next);
  };

  const startWorkout = () => {
    const pool = filterByType(EXERCISES, prefs.type);
    const finalExercise =
      prefs.type === "flexibility" ? EXERCISES.find((e) => e.id === FLEXIBILITY_FINALE_ID) : undefined;
    launchQueue(buildWorkout(prefs.minutes, prefs.random, pool, finalExercise), prefs.minutes);
  };

  const quickStart = () => {
    launchQueue(buildQuickStartWorkout(EXERCISES), QUICK_START_MINUTES);
  };

  const exerciseCount = queue.filter((q) => q.type === "exercise").length;

  const completeWorkout = () => {
    if (sessionRef.current.done) return;
    sessionRef.current = { ...sessionRef.current, done: true };
    logWorkout({ userName: currentUser, workoutType, durationMinutes: lastMinutes, exerciseCount });
    setScreen("done");
  };

  // Manual skips/previous start the new step now, keeping the current
  // paused/running state.
  const moveTo = (target) => {
    const t = Date.now();
    const fresh = startClock(queue[target].duration, t);
    commit({ ...sessionRef.current, index: target, clock: isRunning(sessionRef.current.clock) ? fresh : pauseClock(fresh, t) });
    setNow(t);
  };

  const goNext = () => {
    if (sessionRef.current.index + 1 >= queue.length) completeWorkout();
    else moveTo(sessionRef.current.index + 1);
  };

  const goPrev = () => {
    if (sessionRef.current.index > 0) moveTo(sessionRef.current.index - 1);
  };

  const togglePause = () => {
    const t = Date.now();
    const { clock: current } = sessionRef.current;
    commit({ ...sessionRef.current, clock: isRunning(current) ? pauseClock(current, t) : resumeClock(current, t) });
    setNow(t);
    setInterrupted(false);
  };

  // Tick 4x a second against the wall clock; stepping through elapsed
  // segments and finishing happen here, driven by timestamps, not counts.
  useEffect(() => {
    if (screen !== "active" || isPaused) return;
    const durations = queue.map((q) => q.duration);
    const id = setInterval(() => {
      const t = Date.now();
      const { index: i, clock: c, done } = sessionRef.current;
      if (done) return;
      const result = advanceClock(c, i, durations, t);
      setNow(t);
      if (result.finished) completeWorkout();
      else if (result.index !== i) commit({ ...sessionRef.current, index: result.index, clock: result.clock });
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, isPaused, queue]);

  // Cues (voice, beeps) can't run in the background, so leaving the app
  // pauses the session instead of letting it silently run on.
  useEffect(() => {
    if (screen !== "active" || isPaused) return;
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      const t = Date.now();
      commit({ ...sessionRef.current, clock: pauseClock(sessionRef.current.clock, t) });
      setNow(t);
      setInterrupted(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [screen, isPaused]);

  const showTabs = screen === "home" || screen === "library" || screen === "history";

  return (
    <div
      dir="rtl"
      lang="he"
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: C.bgOuter }}
    >
      <div
        className="w-full h-full flex flex-col"
        style={{ backgroundColor: C.bg, maxWidth: "580px" }}
      >
        <main className="flex-1 min-h-0">
          {screen === "identity" && (
            <IdentityScreen
              current={currentUser}
              onSelect={chooseIdentity}
              onSkip={skipIdentity}
              onCancel={hasChosenIdentity ? () => setScreen("home") : undefined}
            />
          )}
          {screen === "home" && (
            <HomeScreen
              prefs={prefs}
              onPrefsChange={changePrefs}
              onStart={startWorkout}
              onQuickStart={quickStart}
              currentUser={currentUser}
              onSwitchUser={() => setScreen("identity")}
            />
          )}
          {screen === "library" && <LibraryScreen exercises={EXERCISES} />}
          {screen === "history" && <HistoryScreen currentUser={currentUser} />}
          {screen === "active" && queue.length > 0 && (
            <ActiveScreen
              queue={queue}
              index={index}
              timeLeft={timeLeft}
              isPaused={isPaused}
              interrupted={interrupted}
              wakeLockStatus={wakeLockStatus}
              onPauseToggle={togglePause}
              onSkip={goNext}
              onPrev={goPrev}
              onQuit={() => setScreen("home")}
            />
          )}
          {screen === "done" && (
            <DoneScreen minutes={lastMinutes} exerciseCount={exerciseCount} onRestart={() => setScreen("home")} />
          )}
        </main>
        {showTabs && <TabBar active={screen} onChange={setScreen} />}
      </div>
    </div>
  );
}
