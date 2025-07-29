// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: 'jest',
  reporters: ['progress', 'clear-text', 'html'],
  coverageAnalysis: 'perTest',
  plugins: ['@stryker-mutator/jest-runner'],
  tsconfigFile: 'tsconfig.json',
  jest: {
    projectType: 'create-react-app',
  },
  thresholds: { high: 100, break: 99 },
  ignorePatterns: ['**/*.stories.tsx', '**/*.stories.ts', 'dist', 'coverage', 'src/test/memory-leak/results/**'],
};
export default config;
