import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// GitHub Pages serves this project from https://<user>.github.io/workout-site/,
// not from the domain root — every asset/route needs that prefix, or the
// deployed site loads blank. Rename here (and in the repo) together if you
// ever change the repo name.
const BASE_PATH = '/workout-site/'

// https://vite.dev/config/
export default defineConfig({
  base: BASE_PATH,
  server: { port: 5174 },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: BASE_PATH,
        name: 'סטרצ׳ינג יומי',
        short_name: 'סטרצ׳ינג',
        description: 'אימוני מתיחות וגמישות מותאמים לזמן שיש לך',
        lang: 'he',
        dir: 'rtl',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        display: 'standalone',
        orientation: 'any',
        background_color: '#08120F',
        theme_color: '#0F211C',
        icons: [
          { src: `${BASE_PATH}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${BASE_PATH}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${BASE_PATH}icons/icon-maskable-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: `${BASE_PATH}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,ico,woff2}'],
      },
    }),
  ],
})
