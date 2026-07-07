import { collectMutateFiles } from './scripts/ci/mutation-scope.mjs';

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  plugins: ['@stryker-mutator/jest-runner'],
  tsconfigFile: 'tsconfig.json',
  jest: {
    // Union of the unit and integration suites so mutants in the logic layer are killed by the
    // tests that actually assert on it (see jest.mutation.config.ts). The default jest.config.ts
    // would only run tests/unit and leave repository/service/store mutants uncovered.
    configFile: 'jest.mutation.config.ts',
    enableFindRelatedTests: false,
  },
  // Widened from ./src/components/**/*.tsx to the whole logic layer + module UI, minus non-logic
  // files (types, styles, stories, generated, DI-free i18n). Single source of truth shared with
  // stryker.shard.config.mjs so the union of shards equals this exact set.
  mutate: collectMutateFiles(),
  // PR runs pass --incremental so only changed mutants re-run; this is the cached report path.
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
  // Ratchet policy: raise `break` toward `high` as suites improve; never lower it to make CI pass
  // (see the mutation-testing section in CONTRIBUTING.md). `break` is a bootstrap floor pending the
  // first full sharded run's measured baseline, after which it is ratcheted to just below it.
  thresholds: { high: 90, low: 70, break: 30 },
};

export default config;
