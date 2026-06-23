import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/signup.spec.ts',

  fullyParallel: false,
  retries: 0,
  timeout: 300000,

  use: {
    baseURL: 'https://authorized-partner.vercel.app/',
    trace: 'on-first-retry',
    headless: false,
    video: 'on', // Record every test
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});