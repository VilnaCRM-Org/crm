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
  ],
  testEnvironment: '<rootDir>/tests/jsdom-fetch-environment.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/mutation/setup.ts'],
  transform: {
    ...base.transform,
    '^.+\\.(ts|tsx)$': ['ts-jest', { isolatedModules: true }],
  },
  collectCoverage: false,
  coverageThreshold: undefined,
};

export default config;
