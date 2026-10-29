import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

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

/**
 * The options Stryker hands its instrumenter when `stryker.config.mjs` sets neither `mutator` nor
 * `ignorers`, which `tests/unit/tooling/mutation-checker-config.test.ts` pins. Counting under any
 * other options would weigh the files by mutants the shards never run.
 */
const DEFAULT_INSTRUMENTER_OPTIONS = { plugins: null, excludedMutations: [], ignorers: [] };

const noop = () => undefined;

const SILENT_LOGGER = {
  trace: noop,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
  fatal: noop,
  isTraceEnabled: () => false,
  isDebugEnabled: () => false,
  isInfoEnabled: () => false,
  isWarnEnabled: () => false,
  isErrorEnabled: () => false,
  isFatalEnabled: () => false,
};

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

function byPath(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function lightestShard(loads) {
  let lightest = 0;
  for (let i = 1; i < loads.length; i += 1) {
    if (loads[i] < loads[lightest]) lightest = i;
  }
  return lightest;
}

function assertShardTotal(total) {
  if (!Number.isInteger(total) || total < 1) {
    throw new RangeError(`MUTATION_SHARD_TOTAL must be a positive integer, received ${total}.`);
  }
}

function assertShardIndex(total, index) {
  if (!Number.isInteger(index) || index < 0 || index >= total) {
    throw new RangeError(
      `MUTATION_SHARD_INDEX must be an integer in [0, ${total}), received ${index}.`
    );
  }
}

/**
 * The instrumenter the pinned `@stryker-mutator/core` itself resolves, so the count follows every
 * Stryker bump in `bun.lock` without a second version to keep in step. Resolved from the working
 * directory, the project root for every caller, as `collectMutateFiles` already assumes.
 */
async function loadInstrumenter() {
  const fromProject = createRequire(path.join(process.cwd(), 'package.json'));
  const fromCore = createRequire(fromProject.resolve('@stryker-mutator/core/package.json'));
  const { Instrumenter } = await import(
    pathToFileURL(fromCore.resolve('@stryker-mutator/instrumenter')).href
  );
  return new Instrumenter(SILENT_LOGGER);
}

/**
 * Mutants per file, counted by Stryker's own instrumenter over the given files. A mutant the
 * instrumenter already reports as `Ignored` (a `Stryker disable` directive) never runs, so only
 * the mutants left for the test runner count. Every file is present in the result, at 0 when the
 * instrumenter finds nothing to mutate.
 */
export async function countMutants(files) {
  const instrumenter = await loadInstrumenter();
  const { mutants } = await instrumenter.instrument(
    files.map((name) => ({ name, mutate: true, content: fs.readFileSync(name, 'utf8') })),
    DEFAULT_INSTRUMENTER_OPTIONS
  );

  const counts = new Map(files.map((file) => [file, 0]));
  for (const mutant of mutants) {
    if (mutant.status === undefined) counts.set(mutant.fileName, counts.get(mutant.fileName) + 1);
  }
  return counts;
}

/**
 * Deterministic longest-processing-time bin packing: heaviest file first, each to the currently
 * lightest shard. Weights are mutant counts because a shard's cost is the mutants it runs; packing
 * by file size left a cold shard holding 1.6x the mean mutant load, and a sharded run is only as
 * fast as its slowest shard. Every weighed file lands in exactly one shard, each sorted by path.
 */
export function packShards(weights, total) {
  assertShardTotal(total);

  const shards = Array.from({ length: total }, () => []);
  const loads = new Array(total).fill(0);

  // Code-unit ordering, not localeCompare: the tiebreak decides which shard a file lands in, and
  // each shard carries its own incremental cache, so it has to agree across every machine's locale.
  const heaviestFirst = [...weights]
    .map(([file, weight]) => ({ file, weight }))
    .sort((a, b) => b.weight - a.weight || byPath(a.file, b.file));

  for (const { file, weight } of heaviestFirst) {
    const target = lightestShard(loads);
    shards[target].push(file);
    loads[target] += weight;
  }

  return shards.map((files) => files.sort(byPath));
}

/**
 * The one packing every shard job and the merge job derive from the same commit. The union of its
 * shards is exactly `collectMutateFiles()`; `weights` is the per-file mutant count it packed by.
 */
export async function packMutateShards(total) {
  assertShardTotal(total);
  const weights = await countMutants(collectMutateFiles());
  return { shards: packShards(weights, total), weights };
}

export async function shardMutateFiles(total, index) {
  assertShardTotal(total);
  assertShardIndex(total, index);
  const { shards } = await packMutateShards(total);
  return shards[index];
}
