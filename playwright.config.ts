import { defineConfig, devices } from '@playwright/test';
import dotenv, { DotenvConfigOutput } from 'dotenv';
import dotenvExpand from 'dotenv-expand';

const env: DotenvConfigOutput = dotenv.config();

dotenvExpand.expand(env);

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
    extraHTTPHeaders: {
      [`aws-cf-cd-${process.env.REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_NAME}`]:
        process.env.REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_VALUE || '',
    },
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
