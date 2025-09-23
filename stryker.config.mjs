/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: 'pnpm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  plugins: ['@stryker-mutator/jest-runner'],
  tsconfigFile: 'tsconfig.json',
  jest: {
    configFile: 'jest.config.ts',
    enableFindRelatedTests: false,
  },
  mutate: [ './src/components/**/*.tsx', ],
  ignorePatterns: ['**/*.stories.tsx', '**/*.stories.ts', 'dist', 'coverage', 'tests/memory-leak/results/**', '.junie/'],
  thresholds: { high: 100, break: 2.17 }, // TODO: Update `break` to 90 once full test coverage is implemented

};

export default config;
