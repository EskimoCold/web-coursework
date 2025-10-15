import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Vite config for E2E tests - excludes Vitest globals to avoid conflicts with Playwright
export default defineConfig({
  plugins: [react()],
});
