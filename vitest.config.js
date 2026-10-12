import { defineConfig } from "vitest/config";

// Separate from vite.config.js so tests don't load the PWA/Tailwind plugins.
export default defineConfig({
  test: {
    include: ["src/**/*.test.js", "cloudflare-worker-history/**/*.test.js"],
    environment: "node",
  },
});
