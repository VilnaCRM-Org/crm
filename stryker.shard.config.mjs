import fs from 'node:fs';

import base from './stryker.config.mjs';

const total = Math.max(1, Number.parseInt(process.env.MUTATION_SHARD_TOTAL ?? '1', 10) || 1);
const index = Math.max(0, Number.parseInt(process.env.MUTATION_SHARD_INDEX ?? '0', 10) || 0);
if (index >= total) {
  throw new Error(`MUTATION_SHARD_INDEX (${index}) must be < MUTATION_SHARD_TOTAL (${total}).`);
}

// Round-robin balances file COUNT, and a shard's wall clock is driven by mutant count, which
// tracks file size — one 400-line policy file outweighs ten barrels. Shards are packed
// longest-processing-time-first instead: sort by size, then repeatedly hand the next file to
// the lightest shard. The partition stays deterministic (size ties break on path), so every
// runner computes the same disjoint slices and their union is still the full mutate set.
function weighFiles(files) {
  return files
    .map((file) => ({ file, weight: fs.statSync(file).size }))
    .sort((a, b) => b.weight - a.weight || a.file.localeCompare(b.file));
}

function packShards(files, shardCount) {
  const shards = Array.from({ length: shardCount }, () => ({ load: 0, files: [] }));
  weighFiles(files).forEach(({ file, weight }) => {
    const lightest = shards.reduce((min, shard) => (shard.load < min.load ? shard : min));
    lightest.load += weight;
    lightest.files.push(file);
  });
  return shards.map((shard) => shard.files.sort());
}

const sliced = packShards(base.mutate, total)[index];

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
