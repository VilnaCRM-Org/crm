import { collectMutateFiles } from './scripts/ci/mutation-scope.mjs';

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  ignoreStatic: true,
  plugins: ['@stryker-mutator/jest-runner'],
  tsconfigFile: 'tsconfig.json',
  jest: {
    configFile: 'jest.mutation.config.ts',
    enableFindRelatedTests: false,
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
  thresholds: { high: 95, low: 90, break: 88 },
};

export default config;
