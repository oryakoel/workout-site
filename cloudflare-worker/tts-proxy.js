// Cloudflare Worker: proxies exercise-title text-to-speech requests to
// ElevenLabs so the API key never ships in the site's public JS bundle.
// Deploy this separately on Cloudflare (see README in this folder) and
// set ELEVENLABS_API_KEY as a Worker secret — never hardcode it here.

const ALLOWED_ORIGIN = "https://oryakoel.github.io";
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // ElevenLabs default multilingual voice
const MAX_TEXT_LENGTH = 100; // titles only — keeps character usage low

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders();

    // A real browser call from the site always sends this Origin header
    // and can't fake it — reject anything else outright. This doesn't
    // stop a script that deliberately fakes the header, but it blocks
    // casual/automated abuse of a discovered Worker URL.
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403, headers });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400, headers });
    }

    const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT_LENGTH) : "";
    if (!text) {
      return new Response("Missing text", { status: 400, headers });
    }

    // Lets the site (or a quick manual test) try a different voice without
    // redeploying — still just picks which voice this same fixed TTS call
    // uses, so it doesn't widen what the proxy can do.
    const requestedVoiceId = typeof body.voiceId === "string" ? body.voiceId.trim() : "";
    const voiceId = /^[A-Za-z0-9]{10,30}$/.test(requestedVoiceId)
      ? requestedVoiceId
      : env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      return new Response(errText, { status: elevenRes.status, headers });
    }

    return new Response(elevenRes.body, {
      headers: { ...headers, "Content-Type": "audio/mpeg" },
    });
  },
};
