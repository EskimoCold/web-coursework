/// <reference types="vitest" />
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: false,
        suppressWarnings: true,
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'apple-touch-icon-*.png'],
      manifest: {
        name: 'FinTrack',
        short_name: 'FinTrack',
        description: 'Personal Finance Tracker',
        theme_color: '#2b7cff',
        background_color: '#f3f6f9',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
    }),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: { name: process.env.VITE_RELEASE },
      sourcemaps: { assets: './dist/assets/**' },
      telemetry: false,
    }),
  ],
  build: { sourcemap: true },
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  resolve: {},
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: ['localhost', '127.0.0.1', '063a78770fff.ngrok-free.app', ''],
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    coverage: {
      reporter: ['json-summary', 'text'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/app/main.tsx'],
      clean: true,
    },
  },
});
