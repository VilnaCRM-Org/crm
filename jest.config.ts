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
      ? ['<rootDir>/docker/apollo-server/lib/**/*.{ts,mts}', '!**/*.d.ts']
      : [
          '<rootDir>/src/**/*.{ts,tsx}',
          '<rootDir>/scripts/localizationGenerator.js',
          '!<rootDir>/src/**/*.d.ts',
          '!<rootDir>/src/**/*.stories.{ts,tsx}',
          '!<rootDir>/src/**/*.test.{ts,tsx}',
          '!<rootDir>/src/index.tsx',
        ],
  roots:
    process.env.TEST_ENV === 'server'
      ? ['./tests/apollo-server']
      : ['./tests/unit', './tests/integration'],
  testEnvironment: process.env.TEST_ENV === 'server' ? 'node' : 'jsdom',
  testMatch:
    process.env.TEST_ENV === 'server'
      ? ['<rootDir>/tests/apollo-server/**/*.test.{ts,mts}']
      : [
          '<rootDir>/tests/unit/**/*.test.{ts,tsx,js,jsx}',
          '<rootDir>/tests/integration/**/*.integration.test.{ts,tsx}',
        ],
  extensionsToTreatAsEsm: ['.mts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(mts)$': ['ts-jest', { useESM: true }],
    '^.+\\.js$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/.stryker-tmp/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mts', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.+)\\.js$': '$1',
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
