import { C } from "../theme.js";

export default function ProgressDots({ queue, index }) {
  const exerciseItems = queue.filter((q) => q.type === "exercise");
  const currentExerciseCount = queue.slice(0, index + 1).filter((q) => q.type === "exercise").length;
  return (
    <div className="flex items-center justify-center gap-1.5">
      {exerciseItems.map((_, i) => (
        <span
          key={i}
          className="rounded-full transition-all"
          style={{
            width: i === currentExerciseCount - 1 ? "18px" : "6px",
            height: "6px",
            backgroundColor: i < currentExerciseCount ? C.amber : C.line,
          }}
        />
      ))}
    </div>
  );
}
