import { describe, expect, it } from "vitest";
import {
  advanceClock,
  isRunning,
  pauseClock,
  remainingMs,
  resumeClock,
  secondsLeft,
  startClock,
} from "./sessionClock.js";

describe("secondsLeft", () => {
  it("shows the full duration at the start and counts down on whole seconds", () => {
    const clock = startClock(10, 0);
    expect(secondsLeft(clock, 0)).toBe(10);
    expect(secondsLeft(clock, 500)).toBe(10);
    expect(secondsLeft(clock, 1000)).toBe(9);
    expect(secondsLeft(clock, 9001)).toBe(1);
    expect(secondsLeft(clock, 10000)).toBe(0);
  });

  it("never goes negative", () => {
    expect(secondsLeft(startClock(5, 0), 60000)).toBe(0);
  });
});

describe("pause and resume", () => {
  it("freezes the remaining time no matter how long the pause lasts", () => {
    const paused = pauseClock(startClock(10, 0), 4000);
    expect(isRunning(paused)).toBe(false);
    expect(remainingMs(paused, 4000)).toBe(6000);
    expect(remainingMs(paused, 999999)).toBe(6000);
  });

  it("resumes with exactly the time that was left", () => {
    const resumed = resumeClock(pauseClock(startClock(10, 0), 4000), 100000);
    expect(isRunning(resumed)).toBe(true);
    expect(secondsLeft(resumed, 100000)).toBe(6);
    expect(secondsLeft(resumed, 103000)).toBe(3);
  });

  it("pausing a paused clock or resuming a running one changes nothing", () => {
    const running = startClock(10, 0);
    const paused = pauseClock(running, 1000);
    expect(pauseClock(paused, 5000)).toBe(paused);
    expect(resumeClock(running, 5000)).toBe(running);
  });
});

describe("advanceClock", () => {
  const durations = [10, 5, 20];

  it("stays on the current segment while time remains", () => {
    const result = advanceClock(startClock(10, 0), 0, durations, 9999);
    expect(result.index).toBe(0);
    expect(result.finished).toBe(false);
  });

  it("starts the next segment at the previous boundary, not at 'now'", () => {
    const result = advanceClock(startClock(10, 0), 0, durations, 10050);
    expect(result.index).toBe(1);
    expect(result.clock.endsAt).toBe(15000);
  });

  it("skips over several elapsed segments in one call", () => {
    const result = advanceClock(startClock(10, 0), 0, durations, 16000);
    expect(result.index).toBe(2);
    expect(result.clock.endsAt).toBe(35000);
    expect(result.finished).toBe(false);
  });

  it("reports finished once the last segment has elapsed", () => {
    const result = advanceClock(startClock(10, 0), 0, durations, 40000);
    expect(result.finished).toBe(true);
    expect(result.index).toBe(2);
  });

  it("does nothing while paused", () => {
    const paused = pauseClock(startClock(10, 0), 1000);
    const result = advanceClock(paused, 0, durations, 999999);
    expect(result.index).toBe(0);
    expect(result.finished).toBe(false);
  });
});
