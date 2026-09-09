import type { Config } from 'jest';

import base from './jest.config';

const config: Config = {
  ...base,
  roots: ['./tests/unit', './tests/integration'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{ts,tsx,js,jsx}',
    '<rootDir>/tests/integration/**/*.integration.test.{ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/unit/tooling/',
    '/tests/unit/scripts/',
    '/tests/unit/performance/',
    '/tests/unit/load/',
    // Config-integrity meta-test (issue #165): resolves eslint.config.mjs via a child process
    // and exercises no src, so it kills zero mutants — same rationale as the tooling meta-tests
    // above, kept out of the mutation suite to avoid subprocess churn under Stryker.
    '/tests/unit/config/eslint-policy\\.test\\.ts$',
  ],
  testEnvironment: require.resolve('./tests/jsdom-fetch-environment.cjs'),
  setupFilesAfterEnv: ['<rootDir>/tests/mutation/setup.ts'],
  transform: {
    ...base.transform,
    '^.+\\.(ts|tsx)$': ['ts-jest', { isolatedModules: true }],
  },
  collectCoverage: false,
  coverageThreshold: undefined,
};

export default config;
