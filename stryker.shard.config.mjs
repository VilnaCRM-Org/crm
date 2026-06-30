import fs from 'node:fs';
import path from 'node:path';

import base from './stryker.config.mjs';

const total = Math.max(1, Number.parseInt(process.env.MUTATION_SHARD_TOTAL ?? '1', 10) || 1);
const index = Math.max(0, Number.parseInt(process.env.MUTATION_SHARD_INDEX ?? '0', 10) || 0);

/** Recursively collect mutatable `.tsx` files (excluding stories) under `dir`. */
function collectTsxFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectTsxFiles(full);
    if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.stories.tsx')) return [full];
    return [];
  });
}

const sliced = collectTsxFiles('src/components')
  .sort()
  .filter((_, i) => i % total === index % total);

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  ...base,
  mutate: sliced,
  reporters: ['json', 'clear-text', 'progress'],
  jsonReporter: { fileName: `reports/mutation/mutation-shard-${index}.json` },
  thresholds: { ...base.thresholds, break: null },
};

export default config;
