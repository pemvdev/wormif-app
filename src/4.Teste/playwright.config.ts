import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testRoot, '../..');
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5174';
const testPort = new URL(baseURL).port || '5174';
const testStatePath = path.join(projectRoot, '.wrangler', `playwright-${process.pid}`);

export default defineConfig({
  testDir: path.join(testRoot, 'e2e'),
  outputDir: path.join(testRoot, 'test-results'),
  // E2E tests share the same local D1 database and seeded account.
  // Run serially so one test cannot mutate another test's data or session.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
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
    env: { WORMIF_TEST_STATE_PATH: testStatePath },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
