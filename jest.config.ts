import type { Config } from 'jest';

const { TEST_ENV } = process.env;

const rootsMap: Record<string, string[]> = {
  server: ['./tests/apollo-server'],
  integration: ['./tests/integration'],
  default: ['./tests/unit'],
};

const roots = rootsMap[TEST_ENV ?? ''] || rootsMap.default;

const testEnvironment = TEST_ENV === 'server' || TEST_ENV === 'integration' ? 'node' : 'jsdom';

const testMatchMap: Record<string, string[]> = {
  server: ['<rootDir>/tests/apollo-server/**/*.test.{ts,mts}'],
  integration: ['<rootDir>/tests/integration/**/*.integration.test.{ts,tsx}'],
  default: ['<rootDir>/tests/unit/**/*.test.{ts,tsx,js,jsx}'],
};

const testMatch = testMatchMap[TEST_ENV ?? ''] || testMatchMap.default;

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
