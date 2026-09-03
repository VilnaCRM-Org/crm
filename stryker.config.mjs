import { collectMutateFiles } from './scripts/ci/mutation-scope.mjs';

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  ignoreStatic: true,
  plugins: ['@stryker-mutator/jest-runner', '@stryker-mutator/typescript-checker'],
  checkers: ['typescript'],
  disableTypeChecks: false,
  tsconfigFile: 'tsconfig.stryker.json',
  typescriptChecker: { prioritizePerformanceOverAccuracy: true },
  jest: {
    configFile: 'jest.mutation.config.ts',
    enableFindRelatedTests: true,
  },
  mutate: collectMutateFiles(),
  incrementalFile: 'reports/stryker-incremental.json',
  ignorePatterns: [
    '**/*.stories.tsx',
    '**/*.stories.ts',
    'dist',
    'coverage',
    'tests/memory-leak/results/**',
    '.junie/',
    '.qlty/',
  ],
  thresholds: { high: 100, low: 100, break: 100 },
};

export default config;
