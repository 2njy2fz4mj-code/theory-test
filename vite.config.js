import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { copyFileSync, mkdirSync } from 'node:fs'

// The text reader (for the mistakes sheet) runs in the browser. Its files are copied next to the app
// so nothing is fetched from another site.
const OCR_FILES = [
  'node_modules/tesseract.js/dist/worker.min.js',
  'node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js',
  'node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js',
  'node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js',
  'node_modules/@tesseract.js-data/heb/4.0.0_best_int/heb.traineddata.gz'
]
const copyOcr = () => ({
  name: 'copy-ocr',
  buildStart() {
    mkdirSync('public/ocr', { recursive: true })
    OCR_FILES.forEach((f) => copyFileSync(f, 'public/ocr/' + f.split('/').pop()))
  }
})

// GitHub Pages serves the site from /<repo-name>/
const base = process.env.BASE_PATH || '/theory-test/'

export default defineConfig({
  base,
  // the question bank is bundled on purpose so the app works offline
  build: { chunkSizeWarningLimit: 1000 },
  plugins: [
    copyOcr(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-180.png'],
      manifest: {
        name: 'תאוריה בקל',
        short_name: 'תאוריה בקל',
        description: 'לימוד תיאוריה לרישיון B על בסיס המאגר הרשמי של משרד התחבורה',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        background_color: '#f4f7fb',
        theme_color: '#0a2a7a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // cache the whole app, the question bank and every question image so it works offline
        globPatterns: ['**/*.{js,css,html,png,webp,svg}'],
        // the text reader is big and rarely used: it is fetched on first use and kept after that
        globIgnores: ['ocr/**', 'assets/pdf*'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/(ocr\/|assets\/pdf)/,
            handler: 'CacheFirst',
            options: { cacheName: 'reader', expiration: { maxEntries: 12 } }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          }
        ]
      }
    })
  ]
})
