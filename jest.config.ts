import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom:
    process.env.TEST_ENV === 'server'
      ? ['docker/apollo-server/**/*.{ts,js}', '!**/*.d.ts']
      : [
          '<rootDir>/src/**/*.{ts,tsx}',
          '!<rootDir>/src/**/*.d.ts',
          '!<rootDir>/src/**/*.stories.{ts,tsx}',
          '!<rootDir>/src/**/*.test.{ts,tsx}',
          '!<rootDir>/src/index.tsx',
        ],
  roots:
    process.env.TEST_ENV === 'server'
      ? ['./tests/apollo-server']
      : ['./tests/unit', './scripts/test/unit'],
  testEnvironment: process.env.TEST_ENV === 'server' ? 'node' : 'jsdom',
  testMatch: [
    process.env.TEST_ENV === 'server'
      ? '<rootDir>/tests/apollo-server/server.test.ts'
      : '<rootDir>/tests/unit/**/*.test.{ts,tsx}',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/.stryker-tmp/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

export default config;
