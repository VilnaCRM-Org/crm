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
      ? [
          'docker/apollo-server/**/*.test-src.ts',
          '!**/*.d.ts',
          '!docker/apollo-server/schemaFetcher.test-src.ts',
        ]
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
      ? '<rootDir>/tests/apollo-server/**/*.test.ts'
      : '<rootDir>/tests/unit/**/*.test.{ts,tsx}',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(mts)$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
        },
      },
    ],
    '^.+\\.js$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/.stryker-tmp/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold:
    process.env.TEST_ENV === 'server'
      ? {
          global: {
            branches: 91,
            functions: 100,
            lines: 99,
            statements: 99,
          },
        }
      : {
          global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
          },
        },
};

export default config;
