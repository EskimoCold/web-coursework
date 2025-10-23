import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  testIgnore: '../src/**',
  globalSetup: resolve(__dirname, './global-setup.ts'),
  webServer: {
    command: 'npm run dev:e2e',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:5173' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
