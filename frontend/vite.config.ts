import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: process.VITE_RELEASE,
      sourcemaps: { assets: './dist/assets/**' },
      telemetry: false,
    }),
  ],

  build: {
    sourcemap: true,
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
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

      exclude: [
        'src/app/main.tsx',
        'src/sentry.client.ts',
        'src/mocks/**',
        'src/pages/analytics/**',
        'src/components/TransactionForm.tsx',
        'src/api/categories.ts',
        'src/components/SettingsPage.tsx',
      ],

      clean: true,
    },
  },
});
