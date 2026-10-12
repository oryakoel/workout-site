import { useCallback, useEffect, useState } from "react";
import { pickBestHebrewVoice } from "./voicePick.js";
import { cuePattern } from "./cues.js";

const MUTE_STORAGE_KEY = "workout-tts-muted";
// "voice" = speak Hebrew cues; "beeps" = distinct beep patterns instead
// (for devices with no working Hebrew voice). Unset until the user has
// done the voice check once.
const VOICE_MODE_KEY = "workout-voice-mode";

export function isTTSSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getTTSMuted() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
}

export function setTTSMuted(muted) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
}

export function getVoiceMode() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(VOICE_MODE_KEY);
  return stored === "voice" || stored === "beeps" ? stored : null;
}

export function setVoiceMode(mode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VOICE_MODE_KEY, mode);
}

let cachedVoice = null;
let cacheReady = false;

function pickHebrewVoice() {
  if (!isTTSSupported()) return null;
  if (cacheReady) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null; // not loaded yet — try again next call
  cachedVoice = pickBestHebrewVoice(voices);
  cacheReady = true;
  return cachedVoice;
}

if (isTTSSupported()) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    cacheReady = false;
  });
}

// Bumped by every speak()/cancel so a cue still waiting out its short
// start delay is dropped when something newer (or a pause) supersedes it.
let currentSpeakToken = 0;

// Some browsers (notably Chrome on Android) drop the reference to a
// SpeechSynthesisUtterance and silently stop speaking, or never start,
// if nothing else holds onto it — stashing it on window guards against it.
function startUtterance(utterance) {
  window.__lastUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

// "canceled"/"interrupted" are what a cancel() we issued ourselves looks
// like — not a real failure, and must never trigger a retry.
function isOwnCancel(code) {
  return code === "canceled" || code === "interrupted";
}

function speakWithBrowserVoice(text, token, handlers = {}) {
  if (!isTTSSupported()) {
    handlers.onError?.("unsupported");
    return;
  }
  // Chrome on Android silently drops speak() called synchronously right
  // after cancel() — a short delay avoids that race.
  setTimeout(() => {
    if (token !== currentSpeakToken) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "he-IL";
    utterance.rate = 0.95; // default 1.0 reads slightly rushed for held-stretch cues
    const voice = pickHebrewVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = () => handlers.onStart?.();
    utterance.onend = () => handlers.onEnd?.();
    utterance.onerror = (event) => {
      if (isOwnCancel(event.error)) return;
      handlers.onError?.(event.error);
      // Some devices reject this lang/voice pairing outright — retry once
      // with the engine's own default rather than staying silent.
      if (token === currentSpeakToken) startUtterance(new SpeechSynthesisUtterance(text));
    };
    startUtterance(utterance);
  }, 60);
}

// Speaks Hebrew text aloud, replacing anything currently being spoken.
// Silently does nothing if muted or empty.
export function speak(text) {
  if (getTTSMuted() || !text) return;
  cancelSpeech();
  speakWithBrowserVoice(text, currentSpeakToken);
}

export function cancelSpeech() {
  currentSpeakToken += 1;
  if (isTTSSupported()) window.speechSynthesis.cancel();
}

// Resolves { ok: true } once the engine reports it started speaking, or
// { ok: false, reason } if it errors or never responds. Whether it was
// actually audible is for the user to confirm.
export function testVoice() {
  return new Promise((resolve) => {
    cancelSpeech();
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ ok: false, reason: "no-response" }), 4000);
    speakWithBrowserVoice("שלום, זו בדיקת קול", currentSpeakToken, {
      onStart: () => finish({ ok: true }),
      onError: (code) => finish({ ok: false, reason: code || "error" }),
    });
  });
}

// What the device offers, kept current as the browser loads its voice list.
export function useVoiceStatus() {
  const read = () => {
    if (!isTTSSupported()) return { supported: false, loaded: false, hebrewName: null };
    const voices = window.speechSynthesis.getVoices();
    return {
      supported: true,
      loaded: voices.length > 0,
      hebrewName: pickBestHebrewVoice(voices)?.name ?? null,
    };
  };
  const [status, setStatus] = useState(read);

  useEffect(() => {
    if (!isTTSSupported()) return;
    const update = () => setStatus(read());
    window.speechSynthesis.addEventListener("voiceschanged", update);
    const timer = setTimeout(update, 1500);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", update);
      clearTimeout(timer);
    };
  }, []);

  return status;
}

let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) audioCtx = new AudioContextClass();
  return audioCtx;
}

function scheduleTone(ctx, freq, offset, duration) {
  const start = ctx.currentTime + offset;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.3, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

// A short countdown beep for the last few seconds of any timed segment,
// so a transition is audible without having to watch the screen. Tied to
// the same mute toggle as the voice cues.
export function playBeep() {
  if (getTTSMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  scheduleTone(ctx, 880, 0, 0.15);
}

export function playCue(kind) {
  if (getTTSMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  for (const [freq, offset, duration] of cuePattern(kind)) scheduleTone(ctx, freq, offset, duration);
}

// The one entry point for workout cues: speaks the Hebrew text, or — when
// the device can't speak Hebrew (chosen in the voice check) — plays the
// matching beep pattern instead. The on-screen text always shows either way.
export function announce(kind, text) {
  if (getTTSMuted()) return;
  if (getVoiceMode() === "beeps") {
    cancelSpeech();
    playCue(kind);
    return;
  }
  speak(text);
}

// Small hook so components can render a mute toggle without each one
// re-implementing localStorage plumbing.
export function useTTSMuted() {
  const [muted, setMutedState] = useState(getTTSMuted);
  const toggle = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      setTTSMuted(next);
      if (next) cancelSpeech();
      return next;
    });
  }, []);
  return [muted, toggle];
}
