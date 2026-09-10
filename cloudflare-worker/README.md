# TTS Proxy (Cloudflare Worker)

Keeps the ElevenLabs API key server-side. The site calls this Worker;
the Worker calls ElevenLabs with the secret key attached, and streams
the audio back. The key never appears in the site's public JS bundle.

## Deploy (dashboard, no CLI needed)

1. Go to https://dash.cloudflare.com and sign up / log in (free).
2. In the sidebar: **Workers & Pages** → **Create** → **Create Worker**.
3. Give it a name, e.g. `workout-tts-proxy`, and click **Deploy** (it
   deploys a placeholder — that's fine, you'll replace the code next).
4. Click **Edit code** (opens the online editor).
5. Delete everything in the editor and paste in the contents of
   `tts-proxy.js` from this folder.
6. Click **Deploy** (top right).
7. Back on the Worker's page, go to **Settings** → **Variables and
   Secrets** → **Add** → type `ELEVENLABS_API_KEY`, paste the API key
   as the value, and set the type to **Secret** (not plain text) →
   **Save and deploy**.
8. Copy the Worker's URL, shown at the top of its page — looks like
   `https://workout-tts-proxy.<your-subdomain>.workers.dev`.
9. Send that URL back so it can be wired into the site.

That's it — the key lives only in this Worker's secret storage, never
in the GitHub repo or the deployed site's code.
