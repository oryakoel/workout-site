import { useCallback, useState } from "react";

const MUTE_STORAGE_KEY = "workout-tts-muted";

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

let cachedHebrewVoice = null;
let cacheReady = false;

// iOS lets users download "Enhanced"/"Premium" quality voices per
// language (Settings → Accessibility → Read & Speak → Voices → Hebrew).
// When installed, they show up alongside the default compact voice with
// that word in the name — prefer them when present.
function pickHebrewVoice() {
  if (!isTTSSupported()) return null;
  if (cacheReady) return cachedHebrewVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null; // not loaded yet — try again next call

  const hebrewVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith("he"));
  const enhanced = hebrewVoices.find((v) => /enhanced|premium/i.test(v.name));
  cachedHebrewVoice = enhanced || hebrewVoices[0] || null;
  cacheReady = true;
  return cachedHebrewVoice;
}

if (isTTSSupported()) {
  window.speechSynthesis.onvoiceschanged = () => {
    cacheReady = false;
  };
}

// Speaks Hebrew text aloud, replacing anything currently being spoken.
// Silently does nothing if TTS isn't supported or the user muted it —
// callers never need to check either condition themselves.
export function speak(text) {
  if (!isTTSSupported() || getTTSMuted() || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "he-IL";
  utterance.rate = 0.95; // default 1.0 reads slightly rushed for held-stretch cues
  const voice = pickHebrewVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech() {
  if (isTTSSupported()) window.speechSynthesis.cancel();
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
