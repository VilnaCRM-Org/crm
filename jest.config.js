/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testMatch: [
    process.env.TEST_ENV === 'server'
      ? '<rootDir>/src/test/apollo-server**/*.test.ts'
      : '<rootDir>/src/test/testing-library**/*.test.tsx',
    '<rootDir>/src/test/unit/**/*.test.ts',
  ],
  preset: 'ts-jest',
  testEnvironment: process.env.TEST_ENV === 'server' ? 'node' : 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/.stryker-tmp/'],
};
