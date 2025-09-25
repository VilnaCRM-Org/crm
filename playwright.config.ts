import { defineConfig, devices } from '@playwright/test';
import { config as dotenvConfig, type DotenvConfigOutput } from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';

const env: DotenvConfigOutput = dotenvConfig();
dotenvExpand(env);

const cdHeaderName = process.env.REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_NAME?.trim();
const cdHeaderValue = process.env.REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_VALUE?.trim();

export default defineConfig({
  testMatch: ['**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    baseURL: process.env.REACT_APP_PROD_CONTAINER_API_URL,
    ...(cdHeaderName && cdHeaderValue
      ? {
          extraHTTPHeaders: {
            [`aws-cf-cd-${cdHeaderName}`]: cdHeaderValue,
          },
        }
      : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Required for cross-container communication in Docker test environment (for CORS)
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins',
            '--disable-site-isolation-trials',
          ],
        },
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
