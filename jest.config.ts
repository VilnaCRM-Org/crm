import type { Config } from 'jest';

const { TEST_ENV } = process.env;

const rootsMap: Record<string, string[]> = {
  server: ['./tests/apollo-server'],
  integration: ['./tests/integration'],
  default: ['./tests/unit'],
};

const roots = rootsMap[TEST_ENV ?? ''] || rootsMap.default;

const isIntegration = process.env.TEST_ENV === 'integration';
const testEnvironment = TEST_ENV === 'server' || isIntegration ? 'node' : 'jsdom';

const testMatchMap: Record<string, string[]> = {
  server: ['<rootDir>/tests/apollo-server/**/*.test.{ts,mts}'],
  integration: ['<rootDir>/tests/integration/**/*.integration.test.{ts,tsx}'],
  default: ['<rootDir>/tests/unit/**/*.test.{ts,tsx,js,jsx}'],
};

const testMatch = testMatchMap[TEST_ENV ?? ''] || testMatchMap.default;

const thresholdValue = isIntegration ? 90 : 100;
const coverageThreshold = {
  global: {
    branches: thresholdValue,
    functions: thresholdValue,
    lines: thresholdValue,
    statements: thresholdValue,
  },
};
const config: Config = {
  preset: 'ts-jest',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coveragePathIgnorePatterns: ['/node_modules/', '/jest.setup.ts'],
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

  roots,
  testEnvironment,
  testMatch,
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
  coverageThreshold,
};

export default config;
