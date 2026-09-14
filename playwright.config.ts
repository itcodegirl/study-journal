import { defineConfig, devices } from '@playwright/test';

// Set PLAYWRIGHT_CHANNEL=msedge (or chrome) to run against an installed browser
// instead of downloading Playwright's Chromium.
const channel = process.env['PLAYWRIGHT_CHANNEL'];
const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    ...(channel ? { channel } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'laptop', use: { ...devices['Desktop Chrome'], viewport: { width: 1180, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
