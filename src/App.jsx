import { useState, useEffect, useRef } from "react";
import { C } from "./theme.js";
import { EXERCISES } from "./data/exercises.js";
import { buildWorkout, buildQuickStartWorkout, filterByType, QUICK_START_MINUTES } from "./lib/workoutEngine.js";
import HomeScreen from "./components/HomeScreen.jsx";
import LibraryScreen from "./components/LibraryScreen.jsx";
import ActiveScreen from "./components/ActiveScreen.jsx";
import DoneScreen from "./components/DoneScreen.jsx";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [randomOrder, setRandomOrder] = useState(false);
  const [workoutType, setWorkoutType] = useState("auto");
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastMinutes, setLastMinutes] = useState(10);
  const intervalRef = useRef(null);

  const launchQueue = (q, minutes) => {
    setQueue(q);
    setIndex(0);
    setTimeLeft(q[0].duration);
    setIsPaused(false);
    setLastMinutes(minutes);
    setScreen("active");
  };

  const startWorkout = (minutes) => {
    const pool = filterByType(EXERCISES, workoutType);
    launchQueue(buildWorkout(minutes, randomOrder, pool), minutes);
  };

  const quickStart = () => {
    launchQueue(buildQuickStartWorkout(EXERCISES), QUICK_START_MINUTES);
  };

  const goNext = () => {
    setIndex((prevIndex) => {
      const next = prevIndex + 1;
      if (next < queue.length) {
        setTimeLeft(queue[next].duration);
        return next;
      }
      setScreen("done");
      return prevIndex;
    });
  };

  const goPrev = () => {
    setIndex((prevIndex) => {
      if (prevIndex === 0) return prevIndex;
      const prev = prevIndex - 1;
      setTimeLeft(queue[prev].duration);
      return prev;
    });
  };

  useEffect(() => {
    if (screen !== "active" || isPaused) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [screen, isPaused, index]);

  useEffect(() => {
    if (screen === "active" && timeLeft <= 0) {
      goNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const exerciseCount = queue.filter((q) => q.type === "exercise").length;

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
        {screen === "home" && (
          <HomeScreen
            onStart={startWorkout}
            onQuickStart={quickStart}
            randomOrder={randomOrder}
            setRandomOrder={setRandomOrder}
            workoutType={workoutType}
            setWorkoutType={setWorkoutType}
            onNavigate={setScreen}
          />
        )}
        {screen === "library" && <LibraryScreen exercises={EXERCISES} onNavigate={setScreen} />}
        {screen === "active" && queue.length > 0 && (
          <ActiveScreen
            queue={queue}
            index={index}
            timeLeft={timeLeft}
            isPaused={isPaused}
            onPauseToggle={() => setIsPaused((p) => !p)}
            onSkip={goNext}
            onPrev={goPrev}
            onQuit={() => setScreen("home")}
          />
        )}
        {screen === "done" && (
          <DoneScreen minutes={lastMinutes} exerciseCount={exerciseCount} onRestart={() => setScreen("home")} />
        )}
      </div>
    </div>
  );
}
