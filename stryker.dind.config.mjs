import base from './stryker.config.mjs';

// AWS DinD candidate: bound worker concurrency and give the Jest runner 4096 MiB
// of old-space heap. This is not a total-memory limit; validate on the AWS child.
// Keep the complete mutation scope, TypeScript checker, and 100% gate from base.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  ...base,
  concurrency: 1,
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
};

export default config;
