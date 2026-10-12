// Chooses the best Hebrew text-to-speech voice from what the device offers.

// Android has used "iw" (the legacy code) and an underscore separator.
function isHebrew(voice) {
  const lang = (voice.lang || "").toLowerCase().replace("_", "-");
  return lang.startsWith("he") || lang.startsWith("iw");
}

// Quality markers first; then prefer on-device voices so cues keep working
// offline; Google network voices only break ties.
function score(voice) {
  let s = 0;
  if (/enhanced|premium|neural|natural/i.test(voice.name || "")) s += 4;
  if (voice.localService) s += 3;
  if (/google/i.test(voice.name || "")) s += 1;
  return s;
}

export function pickBestHebrewVoice(voices) {
  const hebrew = voices.filter(isHebrew);
  if (hebrew.length === 0) return null;
  return hebrew.reduce((best, voice) => (score(voice) > score(best) ? voice : best));
}
