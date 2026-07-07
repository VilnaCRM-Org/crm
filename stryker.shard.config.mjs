import { collectMutateFiles } from './scripts/ci/mutation-scope.mjs';
import base from './stryker.config.mjs';

const total = Math.max(1, Number.parseInt(process.env.MUTATION_SHARD_TOTAL ?? '1', 10) || 1);
const index = Math.max(0, Number.parseInt(process.env.MUTATION_SHARD_INDEX ?? '0', 10) || 0);

const sliced = collectMutateFiles().filter((_, i) => i % total === index % total);

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  ...base,
  mutate: sliced,
  reporters: ['json', 'clear-text', 'progress'],
  jsonReporter: { fileName: `reports/mutation/mutation-shard-${index}.json` },
  // Per-shard incremental cache: with `--incremental`, each shard reuses prior results for its own
  // unchanged slice and only re-runs mutants touched by the diff. The gate stays exact because the
  // json report still lists every mutant in the slice (reused ones keep their prior status).
  incrementalFile: `reports/stryker-incremental-${index}.json`,
  thresholds: { ...base.thresholds, break: null },
};

export default config;
