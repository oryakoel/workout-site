import { describe, expect, it } from "vitest";
import { classifySession, summarizeProgress } from "./sessionOutcome.js";

const queue = [
  { type: "rest", duration: 10 }, // prep
  { type: "exercise", duration: 45 },
  { type: "rest", duration: 15 },
  { type: "exercise", duration: 45 },
  { type: "rest", duration: 15 },
  { type: "exercise", duration: 45 },
];

describe("summarizeProgress", () => {
  it("totals planned time and the time really spent", () => {
    const s = summarizeProgress(queue, [10000, 45000, 15000, 45000, 15000, 45000]);
    expect(s).toEqual({ plannedSeconds: 175, completedSeconds: 175, exerciseSteps: 3, exercisesDone: 3 });
  });

  it("never credits more than a step's own duration", () => {
    const s = summarizeProgress(queue, [999999, 0, 0, 0, 0, 0]);
    expect(s.completedSeconds).toBe(10);
  });

  it("counts an exercise as done only once most of it was spent", () => {
    // 36s of 45s is exactly 80%: done. 35s is not.
    expect(summarizeProgress(queue, [0, 36000, 0, 0, 0, 0]).exercisesDone).toBe(1);
    expect(summarizeProgress(queue, [0, 35000, 0, 0, 0, 0]).exercisesDone).toBe(0);
  });

  it("treats missing progress as zero", () => {
    const s = summarizeProgress(queue, []);
    expect(s.completedSeconds).toBe(0);
    expect(s.exercisesDone).toBe(0);
    expect(s.plannedSeconds).toBe(175);
  });
});

describe("classifySession", () => {
  it("records nothing for under a minute of real activity, even at the end of the queue", () => {
    expect(classifySession({ reachedEnd: true, plannedSeconds: 600, completedSeconds: 20 })).toBe("none");
    expect(classifySession({ reachedEnd: false, plannedSeconds: 600, completedSeconds: 59 })).toBe("none");
  });

  it("calls a session completed when it reached the end with enough real time", () => {
    expect(classifySession({ reachedEnd: true, plannedSeconds: 600, completedSeconds: 600 })).toBe("completed");
    expect(classifySession({ reachedEnd: true, plannedSeconds: 600, completedSeconds: 360 })).toBe("completed");
  });

  it("calls it partial when most of it was skipped, even at the end", () => {
    expect(classifySession({ reachedEnd: true, plannedSeconds: 600, completedSeconds: 359 })).toBe("partial");
  });

  it("calls a quit session partial once it has a minute of activity", () => {
    expect(classifySession({ reachedEnd: false, plannedSeconds: 600, completedSeconds: 60 })).toBe("partial");
    expect(classifySession({ reachedEnd: false, plannedSeconds: 600, completedSeconds: 590 })).toBe("partial");
  });
});
