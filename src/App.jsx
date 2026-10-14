import { useState, useEffect, useMemo, useRef } from "react";
import { C } from "./theme.js";
import {
  startClock,
  pauseClock,
  resumeClock,
  isRunning,
  secondsLeft,
  remainingMs,
  advanceClock,
} from "./lib/sessionClock.js";
import { useWakeLock } from "./lib/wakeLock.js";
import { EXERCISES, WORKOUT_TYPES } from "./data/exercises.js";
import { EXERCISE_META, GOAL_LABELS } from "./data/exerciseMeta.js";
import { focusAreasFor } from "./data/focusAreas.js";
import {
  buildWorkout,
  buildQuickStartWorkout,
  QUICK_START_MINUTES,
  QUICK_START_TYPE,
  DURATIONS_MINUTES,
} from "./lib/workoutEngine.js";
import { planPool } from "./lib/sessionPlan.js";
import HomeScreen from "./components/HomeScreen.jsx";
import LibraryScreen from "./components/LibraryScreen.jsx";
import ActiveScreen from "./components/ActiveScreen.jsx";
import DoneScreen from "./components/DoneScreen.jsx";
import IdentityScreen from "./components/IdentityScreen.jsx";
import PinScreen from "./components/PinScreen.jsx";
import QuizScreen from "./components/QuizScreen.jsx";
import HistoryScreen from "./components/HistoryScreen.jsx";
import TabBar from "./components/TabBar.jsx";
import { saveUser, readIdentity, GUEST } from "./lib/history.js";
import { getToken, setToken } from "./lib/auth.js";
import { enqueueSession, newClientId } from "./lib/sessionQueue.js";
import { useSessionSync } from "./lib/useSessionSync.js";
import { useMyEntries } from "./lib/useMyEntries.js";
import { computeConsistency } from "./lib/consistency.js";
import { summarizeProgress, classifySession } from "./lib/sessionOutcome.js";
import { loadPrefs, savePrefs } from "./lib/prefs.js";
import { commitProfile, loadProfile, newProfile, skippedProfile, syncProfile } from "./lib/profile.js";
import { loadLastUsed, recordUsed } from "./lib/exerciseHistory.js";

export default function App() {
  // This device remembers who it last was, so the app opens straight to
  // Home; tapping the name there brings the picker back. A remembered name
  // with no sign-in token (from before PINs existed) goes to the PIN screen.
  const [boot] = useState(() => {
    const identity = readIdentity();
    return { identity, needsPin: Boolean(identity.chosen && identity.user && !getToken(identity.user)) };
  });
  const [hasChosenIdentity, setHasChosenIdentity] = useState(boot.identity.chosen);
  const [screen, setScreen] = useState(!boot.identity.chosen ? "identity" : boot.needsPin ? "pin" : "home");
  const [currentUser, setCurrentUser] = useState(boot.identity.user);
  const [pinFor, setPinFor] = useState(boot.needsPin ? boot.identity.user : null);
  const sync = useSessionSync();

  const [prefs, setPrefs] = useState(() =>
    loadPrefs({
      types: ["auto", ...WORKOUT_TYPES.map((t) => t.id)],
      minutes: DURATIONS_MINUTES,
      goals: Object.keys(GOAL_LABELS),
    }),
  );
  const prefsRef = useRef(prefs);
  // What the quiz learned about this person; null until they've answered or
  // skipped it. Tied to whoever is signed in (guests have their own).
  const [profile, setProfile] = useState(() => loadProfile(boot.identity.user));
  const [quizEditing, setQuizEditing] = useState(false);
  const [launchNotice, setLaunchNotice] = useState(null);
  // The signed-in person's own sessions drive the week card and the plant.
  // It reloads when returning to Home/History and when the sync queue changes.
  const mine = useMyEntries(currentUser, `${screen === "home" || screen === "history" ? screen : "other"}:${sync.pending}`);
  const consistency = useMemo(
    () => computeConsistency(mine.entries, { goal: prefs.weeklyGoal, now: mine.loadedAt }),
    [mine.entries, mine.loadedAt, prefs.weeklyGoal],
  );
  const [queue, setQueue] = useState([]);
  const [lastMinutes, setLastMinutes] = useState(10);
  const [outcome, setOutcome] = useState(null);
  const sessionTypeRef = useRef("auto");
  // Most milliseconds actually spent (unpaused, in the foreground) on each
  // queue step; this is what decides how a session is recorded.
  const progressRef = useRef([]);

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

  const commitPrefs = (next) => {
    prefsRef.current = next;
    setPrefs(next);
    savePrefs(next);
  };

  // Quiz answers become the defaults on Home (time, weekly goal, goal).
  const applyProfileToPrefs = (p) => {
    const current = prefsRef.current;
    commitPrefs({ ...current, minutes: p.minutes ?? current.minutes, weeklyGoal: p.weeklyGoal ?? current.weeklyGoal, goal: p.goal });
  };

  // Picks up the person's profile from the server (a new device has none
  // locally) and applies it if it changed.
  const pullProfile = async (name) => {
    const before = loadProfile(name)?.updatedAt;
    const result = await syncProfile(name, getToken(name));
    if (!result) return null;
    setProfile(result);
    if (result.updatedAt !== before) applyProfileToPrefs(result);
    return result;
  };

  const finalizeIdentity = async (name) => {
    saveUser(name);
    setCurrentUser(name);
    setHasChosenIdentity(true);
    setPinFor(null);
    sync.flush();
    const local = loadProfile(name);
    setProfile(local);
    if (local) {
      setScreen("home");
      pullProfile(name);
      return;
    }
    // Nothing saved here: ask the server before asking the person, since
    // they may have answered the quiz on another device.
    setScreen("loading");
    const fromServer = await pullProfile(name);
    setQuizEditing(false);
    setScreen(fromServer ? "home" : "quiz");
  };

  const chooseIdentity = (name) => {
    if (getToken(name)) {
      finalizeIdentity(name);
    } else {
      setPinFor(name);
      setScreen("pin");
    }
  };

  const onPinSuccess = (token) => {
    setToken(pinFor, token);
    finalizeIdentity(pinFor);
  };

  // currentUser stays null: nothing is saved while training as a guest.
  const skipIdentity = () => {
    saveUser(GUEST);
    setCurrentUser(null);
    setProfile(loadProfile(null));
    setHasChosenIdentity(true);
    setPinFor(null);
    setScreen("home");
  };

  // Train now without signing in, without forgetting who this device is.
  const continueUnsaved = () => {
    setCurrentUser(null);
    setProfile(loadProfile(null));
    setPinFor(null);
    setScreen("home");
  };

  const openQuiz = () => {
    setQuizEditing(Boolean(profile && !profile.skipped));
    setScreen("quiz");
  };

  const finishQuiz = (answers) => {
    const answered = newProfile(answers);
    setProfile(answered);
    commitProfile(currentUser, currentUser ? getToken(currentUser) : null, answered);
    applyProfileToPrefs(answered);
    setScreen("home");
  };

  // Skipping is remembered, so the invitation doesn't keep coming back.
  const skipQuiz = () => {
    if (!profile) {
      const skipped = skippedProfile();
      setProfile(skipped);
      commitProfile(currentUser, currentUser ? getToken(currentUser) : null, skipped);
    }
    setScreen("home");
  };

  const signInAgain = () => {
    setPinFor(currentUser);
    setScreen("pin");
  };

  const launchQueue = (q, minutes, type) => {
    const t = Date.now();
    setQueue(q);
    progressRef.current = [];
    sessionTypeRef.current = type;
    commit({ index: 0, clock: startClock(q[0].duration, t), done: false });
    setNow(t);
    setInterrupted(false);
    setLastMinutes(minutes);
    setScreen("active");
  };

  const changePrefs = commitPrefs;

  const builderOptions = () => ({ meta: EXERCISE_META, lastUsed: loadLastUsed(), now: Date.now() });

  const startWorkout = () => {
    const avoidLoads = profile?.sensitive ?? [];
    const plan = planPool({ goal: prefs.goal, type: prefs.type, exercises: EXERCISES, meta: EXERCISE_META, avoidLoads });
    const warmups = plan.needsWarmup ? EXERCISES.filter((e) => EXERCISE_META[e.id]?.phase === "warmup") : [];
    const built = buildWorkout(prefs.minutes, prefs.random, plan.pool, plan.finalExercise, {
      ...builderOptions(),
      avoidLoads,
      warmups,
      focusAreas: focusAreasFor(profile?.focus),
    });
    if (built.length === 0) return;
    setLaunchNotice(
      plan.widened ? "הסוג שבחרתם כמעט כולו מעמיס על מה שביקשתם לחסוך, אז שילבנו תרגילים מסוגים אחרים." : null,
    );
    launchQueue(built, prefs.minutes, prefs.goal ? `goal-${prefs.goal}` : prefs.type);
  };

  const quickStart = () => {
    const built = buildQuickStartWorkout(EXERCISES, {
      ...builderOptions(),
      avoidLoads: profile?.sensitive ?? [],
      focusAreas: focusAreasFor(profile?.focus),
    });
    if (built.length === 0) return;
    setLaunchNotice(null);
    launchQueue(built, QUICK_START_MINUTES, QUICK_START_TYPE);
  };

  const creditElapsed = (i, stepClock, t) => {
    const spent = queue[i].duration * 1000 - remainingMs(stepClock, t);
    progressRef.current[i] = Math.max(progressRef.current[i] || 0, spent);
  };

  const creditFull = (i) => {
    progressRef.current[i] = queue[i].duration * 1000;
  };

  // Remembers what was really done (80%+ of its time), on this device, so the
  // next workout varies. This is about variety, not an account, so guests too.
  const rememberDoneExercises = () => {
    recordUsed(
      queue
        .map((step, i) => (step.type === "exercise" && (progressRef.current[i] || 0) >= step.duration * 800 ? step.exercise.id : null))
        .filter(Boolean),
    );
  };

  // Records what actually happened: time really spent decides whether the
  // session is saved, and whether it counts as completed or partial.
  const finishSession = (reachedEnd) => {
    if (sessionRef.current.done) return;
    sessionRef.current = { ...sessionRef.current, done: true };
    const summary = summarizeProgress(queue, progressRef.current);
    const status = classifySession({ reachedEnd, ...summary });
    if (status !== "none") rememberDoneExercises();
    if (status !== "none" && currentUser) {
      enqueueSession({
        clientId: newClientId(),
        userName: currentUser,
        workoutType: sessionTypeRef.current,
        durationMinutes: lastMinutes,
        exerciseCount: summary.exerciseSteps,
        plannedSeconds: summary.plannedSeconds,
        completedSeconds: summary.completedSeconds,
        exercisesDone: summary.exercisesDone,
        status,
        completedAt: new Date().toISOString(),
      });
      sync.flush();
    }
    setOutcome({ status, ...summary, plannedMinutes: lastMinutes, saved: Boolean(currentUser) });
    setScreen(status === "none" && !reachedEnd ? "home" : "done");
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
    const { index: i, clock: c } = sessionRef.current;
    creditElapsed(i, c, Date.now());
    if (i + 1 >= queue.length) finishSession(true);
    else moveTo(i + 1);
  };

  const goPrev = () => {
    const { index: i, clock: c } = sessionRef.current;
    if (i === 0) return;
    creditElapsed(i, c, Date.now());
    moveTo(i - 1);
  };

  const togglePause = () => {
    const t = Date.now();
    const { clock: current } = sessionRef.current;
    commit({ ...sessionRef.current, clock: isRunning(current) ? pauseClock(current, t) : resumeClock(current, t) });
    setNow(t);
    setInterrupted(false);
  };

  // Leaving mid-workout: under a minute is simply discarded; more than that
  // is kept as a partial session (after asking, since it is saved).
  const quitWorkout = () => {
    const t = Date.now();
    const { index: i, clock: c } = sessionRef.current;
    creditElapsed(i, c, t);
    const summary = summarizeProgress(queue, progressRef.current);
    const status = classifySession({ reachedEnd: false, ...summary });
    if (!currentUser || status === "none") {
      if (status !== "none") rememberDoneExercises();
      setScreen("home");
      return;
    }
    const wasRunning = isRunning(c);
    if (wasRunning) commit({ ...sessionRef.current, clock: pauseClock(c, t) });
    if (window.confirm("לצאת מהאימון? נשמור את מה שעשיתם כאימון חלקי.")) {
      finishSession(false);
    } else if (wasRunning) {
      const resumeAt = Date.now();
      commit({ ...sessionRef.current, clock: resumeClock(sessionRef.current.clock, resumeAt) });
      setNow(resumeAt);
    }
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
      if (result.finished) {
        for (let k = i; k < durations.length; k++) creditFull(k);
        finishSession(true);
      } else if (result.index !== i) {
        for (let k = i; k < result.index; k++) creditFull(k);
        commit({ ...sessionRef.current, index: result.index, clock: result.clock });
      }
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

  // On launch, quietly bring this device's profile up to date with the server.
  useEffect(() => {
    const name = boot.identity.user;
    if (!name || !getToken(name)) return;
    pullProfile(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quizInitial = {
    goal: profile && !profile.skipped ? profile.goal : prefs.goal,
    focus: profile?.focus ?? [],
    sensitive: profile?.sensitive ?? [],
    minutes: profile?.minutes ?? prefs.minutes,
    weeklyGoal: profile?.weeklyGoal ?? prefs.weeklyGoal,
  };

  const showTabs = screen === "home" || screen === "library" || screen === "history";
  const syncProps = {
    syncPending: sync.pending,
    needsSignIn: Boolean(currentUser) && sync.authRequiredFor === currentUser,
    onSignIn: signInAgain,
  };

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
          {screen === "pin" && pinFor && (
            <PinScreen
              key={pinFor}
              name={pinFor}
              onSuccess={onPinSuccess}
              onBack={() => setScreen("identity")}
              onContinueUnsaved={continueUnsaved}
            />
          )}
          {screen === "loading" && (
            <div className="flex h-full items-center justify-center">
              <p role="status" className="text-base" style={{ color: C.textMuted }}>
                בודקים...
              </p>
            </div>
          )}
          {screen === "quiz" && (
            <QuizScreen
              key={quizEditing ? "edit" : "new"}
              initial={quizInitial}
              editing={quizEditing}
              onFinish={finishQuiz}
              onSkip={skipQuiz}
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
              consistency={consistency}
              consistencyOffline={mine.offline}
              profile={profile}
              onOpenQuiz={openQuiz}
              onDismissInvite={skipQuiz}
              {...syncProps}
            />
          )}
          {screen === "library" && <LibraryScreen exercises={EXERCISES} />}
          {screen === "history" && <HistoryScreen currentUser={currentUser} consistency={consistency} {...syncProps} />}
          {screen === "active" && queue.length > 0 && (
            <ActiveScreen
              queue={queue}
              index={index}
              timeLeft={timeLeft}
              isPaused={isPaused}
              interrupted={interrupted}
              wakeLockStatus={wakeLockStatus}
              notice={launchNotice}
              onPauseToggle={togglePause}
              onSkip={goNext}
              onPrev={goPrev}
              onQuit={quitWorkout}
            />
          )}
          {screen === "done" && outcome && (
            <DoneScreen outcome={outcome} syncPending={sync.pending} onRestart={() => setScreen("home")} />
          )}
        </main>
        {showTabs && <TabBar active={screen} onChange={setScreen} />}
      </div>
    </div>
  );
}
