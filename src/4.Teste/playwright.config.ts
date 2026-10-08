import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testRoot, '../..');
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5174';
const testPort = new URL(baseURL).port || '5174';

export default defineConfig({
  testDir: path.join(testRoot, 'e2e'),
  outputDir: path.join(testRoot, 'test-results'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: path.join(testRoot, 'playwright-report') }]
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: `node ./scripts/db-setup-local.mjs --seed && npm run dev -- --port ${testPort} --strictPort`,
    cwd: projectRoot,
    env: { WORMIF_TEST_STATE_PATH: path.join(projectRoot, '.wrangler/test-state') },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
