import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'icon-maskable.svg'],
      manifest: {
        id: '/',
        name: 'GitBit — Git, one bit at a time.',
        short_name: 'GitBit',
        description: 'A mental-model-first Git learning and reference PWA.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#14121f',
        background_color: '#14121f',
        categories: ['education', 'developer'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Everything the app needs is already in the bundle (no API calls),
        // so precaching the build output is enough for full offline use.
        // woff2 only — every PWA-capable browser supports it, and the legacy
        // .woff fallback @fontsource ships alongside it would otherwise
        // double the precached font payload for nothing.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // /api/* is server-only (the daily-push cron route). Without this the
        // SPA fallback would answer it with index.html when hit from a
        // controlled tab.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
