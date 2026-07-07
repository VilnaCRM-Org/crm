import type { Config } from 'jest';

import base from './jest.config';

/**
 * Jest config used only by Stryker. Stryker's jest-runner does not support Jest `projects` with
 * `coverageAnalysis: perTest` (it reads a single top-level `testEnvironment`/`roots`), so the unit
 * and integration suites are unioned into one flat config instead. Per-file setup lives in
 * tests/mutation/setup.ts, which keys off the test path so the unit fetch-stub and the integration
 * MSW server never collide. Coverage is disabled here: Stryker instruments its own coverage, and
 * the 100% `coverageThreshold` from jest.config.ts would otherwise fail the mutation dry run.
 */
const config: Config = {
  ...base,
  roots: ['./tests/unit', './tests/integration'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{ts,tsx,js,jsx}',
    '<rootDir>/tests/integration/**/*.integration.test.{ts,tsx}',
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/mutation/setup.ts'],
  collectCoverage: false,
  coverageThreshold: undefined,
};

export default config;
