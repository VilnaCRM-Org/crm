import type { Config } from 'jest';

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testMatch: [
    process.env.TEST_ENV === 'server'
      ? '<rootDir>/src/test/apollo-server**/*.test.ts'
      : '<rootDir>/src/test/unit/**/*.test.{ts,tsx}',
  ],
  preset: 'ts-jest',
  testEnvironment: process.env.TEST_ENV === 'server' ? 'node' : 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/.stryker-tmp/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
