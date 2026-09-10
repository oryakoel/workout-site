import { useCallback, useState } from "react";

const MUTE_STORAGE_KEY = "workout-tts-muted";

// Cloudflare Worker that proxies text-to-speech requests to ElevenLabs
// (see cloudflare-worker/README.md) — the API key lives only in the
// Worker's secret storage, never in this bundle. Empty until deployed,
// in which case speak() just uses the browser's built-in voice below.
const ELEVENLABS_WORKER_URL = "";

// Once an ElevenLabs call fails (network error, or the monthly character
// quota is used up), stop retrying it for a while so every announcement
// doesn't pay for a slow failed request first — fall straight back to
// the browser voice until this cools down.
const ELEVEN_COOLDOWN_KEY = "workout-eleven-unavailable-until";
const ELEVEN_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

function isElevenLabsCoolingDown() {
  if (typeof window === "undefined") return true;
  const until = Number(window.localStorage.getItem(ELEVEN_COOLDOWN_KEY) || 0);
  return Date.now() < until;
}

function markElevenLabsUnavailable() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ELEVEN_COOLDOWN_KEY, String(Date.now() + ELEVEN_COOLDOWN_MS));
}

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

function speakWithBrowserVoice(text) {
  if (!isTTSSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "he-IL";
  utterance.rate = 0.95; // default 1.0 reads slightly rushed for held-stretch cues
  const voice = pickHebrewVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

let currentElevenAudio = null;
let currentSpeakToken = 0;

async function speakWithElevenLabs(text, token) {
  const res = await fetch(ELEVENLABS_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`elevenlabs proxy failed: ${res.status}`);
  const blob = await res.blob();
  if (token !== currentSpeakToken) return; // superseded by a newer call — drop it

  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentElevenAudio = audio;
  audio.addEventListener("ended", () => URL.revokeObjectURL(url));
  await audio.play();
}

// Speaks Hebrew text aloud, replacing anything currently being spoken.
// Prefers ElevenLabs (via the Worker proxy) when configured and not
// cooling down from a recent failure; otherwise (or if that call fails
// — network issue, offline, or the monthly quota ran out) falls back to
// the browser's built-in voice. Silently does nothing if muted or empty
// — callers never need to check either condition themselves.
export function speak(text) {
  if (getTTSMuted() || !text) return;
  cancelSpeech();
  const token = ++currentSpeakToken;

  if (ELEVENLABS_WORKER_URL && !isElevenLabsCoolingDown()) {
    speakWithElevenLabs(text, token).catch(() => {
      markElevenLabsUnavailable();
      if (token === currentSpeakToken) speakWithBrowserVoice(text);
    });
  } else {
    speakWithBrowserVoice(text);
  }
}

export function cancelSpeech() {
  if (isTTSSupported()) window.speechSynthesis.cancel();
  if (currentElevenAudio) {
    currentElevenAudio.pause();
    currentElevenAudio = null;
  }
}

let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) audioCtx = new AudioContextClass();
  return audioCtx;
}

// A short countdown beep for the last few seconds of any timed segment,
// so a transition is audible without having to watch the screen. Tied to
// the same mute toggle as the voice cues.
export function playBeep() {
  if (getTTSMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.16);
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
