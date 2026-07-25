import { defineConfig, devices } from '@playwright/test';
import { config as dotenvConfig, type DotenvConfigOutput } from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';

const env: DotenvConfigOutput = dotenvConfig();
dotenvExpand(env);

const cdHeaderName = process.env.REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_NAME?.trim();
const cdHeaderValue = process.env.REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_VALUE?.trim();

const isDevMode = process.env.PLAYWRIGHT_DEV_MODE === '1';
const prodBaseURL = process.env.REACT_APP_PROD_CONTAINER_API_URL || 'http://localhost:3001';
const devBaseURL = process.env.WEBSITE_URL || `http://localhost:${process.env.DEV_PORT || '3000'}`;
const baseURL = isDevMode ? devBaseURL : prodBaseURL;
const devChromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH || '/usr/bin/chromium-browser';

const chromiumLaunchArgs = [
  // Required for cross-container communication in Docker test environment (for CORS)
  '--disable-web-security',
  '--disable-features=IsolateOrigins',
  '--disable-site-isolation-trials',
];

const devSnapshotPathTemplate =
  'tests/visual/__snapshots__-dev/' +
  '{testFileName}-snapshots/{arg}{-projectName}{-snapshotSuffix}{ext}';

// Snapshot path: relies on Playwright defaults, which match the repo convention
// of `{spec-file-name}-snapshots/{snapshot-name}-{projectName}-{platform}.png`.
// Snapshot names passed to `toHaveScreenshot('<locale>-<screen-name>')` produce
// files like `uk-desktop-chromium-linux.png` — Playwright auto-appends
// `-{projectName}-{platform}`. Any future override (e.g. dev-mode) must preserve
// this pattern so existing recorded snapshots resolve correctly.
export default defineConfig({
  testMatch: ['**/*.spec.ts'],
  fullyParallel: true,
  // CI is now passed into the playwright container via docker-compose.test.yml, so
  // forbidOnly actually binds under CI: a stray `test.only` fails the required e2e /
  // visual checks instead of silently shrinking the suite to a single test (#190).
  forbidOnly: !!process.env.CI,
  // Pinned explicit so #190 is behavior-neutral apart from forbidOnly binding.
  // Enabling CI retries (2) + on-first-retry trace capture is a deliberate follow-up,
  // reviewed alongside #144; until then retries stay 0 so no flake is retry-masked.
  retries: 0,
  // Keep Playwright's default parallelism for the dedicated test container — this
  // matches the suite's actual pre-#190 CI behavior (CI never reached the container,
  // so workers resolved to undefined). A reviewed choice, not an accident.
  workers: undefined,
  reporter: [['html', { open: 'never' }]],
  ...(isDevMode ? { snapshotPathTemplate: devSnapshotPathTemplate } : {}),
  use: {
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    baseURL,
    ...(cdHeaderName && cdHeaderValue
      ? {
          extraHTTPHeaders: {
            [`aws-cf-cd-${cdHeaderName}`]: cdHeaderValue,
          },
        }
      : {}),
  },
  projects: isDevMode
    ? [
        {
          name: 'chromium-dev',
          use: {
            ...devices['Desktop Chrome'],
            launchOptions: { args: chromiumLaunchArgs, executablePath: devChromiumPath },
          },
        },
      ]
    : [
        {
          name: 'chromium',
          use: {
            ...devices['Desktop Chrome'],
            launchOptions: { args: chromiumLaunchArgs },
          },
        },

        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },

        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
      ],
});
