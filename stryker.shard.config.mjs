import base from './stryker.config.mjs';

const total = Math.max(1, Number.parseInt(process.env.MUTATION_SHARD_TOTAL ?? '1', 10) || 1);
const index = Math.max(0, Number.parseInt(process.env.MUTATION_SHARD_INDEX ?? '0', 10) || 0);

const sliced = base.mutate.filter((_, i) => i % total === index % total);

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  ...base,
  mutate: sliced,
  reporters: ['json', 'clear-text', 'progress'],
  jsonReporter: { fileName: `reports/mutation/mutation-shard-${index}.json` },
  incrementalFile: `reports/stryker-incremental-${index}.json`,
  thresholds: { ...base.thresholds, break: null },
};

export default config;
