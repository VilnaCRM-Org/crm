import fs from 'node:fs';
import path from 'node:path';

const MUTATION_ROOT = 'src';

const EXCLUDED_PATTERNS = [
  /\.d\.ts$/,
  /\.(test|stories)\.(ts|tsx)$/,
  /\/types\.ts$/,
  /\/types\//,
  /\/styles\//,
  /\/theme\.ts$/,
  /\/__mocks__\//,
  /\/__fixtures__\//,
  /^src\/test-utils\//,
  /^src\/api\/generated\//,
  /\/i18n\//,
  /^src\/index\.tsx$/,
];

function isExcluded(rel) {
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(rel));
}

function collectSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(full);
    if (/\.(ts|tsx)$/.test(entry.name)) return [full];
    return [];
  });
}

export function collectMutateFiles() {
  return collectSourceFiles(MUTATION_ROOT)
    .filter((file) => !isExcluded(file))
    .sort();
}

function lightestShard(loads) {
  let lightest = 0;
  for (let i = 1; i < loads.length; i += 1) {
    if (loads[i] < loads[lightest]) lightest = i;
  }
  return lightest;
}

/**
 * Deterministic longest-processing-time bin packing over the same file list, keyed on file size
 * because mutant count scales with it. Round-robin left the slowest shard carrying 1.54x the mean
 * mutant load, and a sharded run is only as fast as its slowest shard. The union of every index in
 * [0, total) is still exactly `collectMutateFiles()`.
 */
export function shardMutateFiles(total, index) {
  const shards = Array.from({ length: total }, () => []);
  const loads = new Array(total).fill(0);

  const heaviestFirst = collectMutateFiles()
    .map((file) => ({ file, weight: fs.statSync(file).size }))
    .sort((a, b) => b.weight - a.weight || a.file.localeCompare(b.file));

  for (const { file, weight } of heaviestFirst) {
    const target = lightestShard(loads);
    shards[target].push(file);
    loads[target] += weight;
  }

  return shards[index].sort();
}
