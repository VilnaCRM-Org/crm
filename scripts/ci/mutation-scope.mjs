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

function projectRequire() {
  return createRequire(path.join(process.cwd(), 'package.json'));
}

/**
 * The instrumenter the pinned `@stryker-mutator/core` itself resolves, so the count follows every
 * Stryker bump in `bun.lock` without a second version to keep in step. Resolved from the working
 * directory, the project root for every caller, as `collectMutateFiles` already assumes.
 */
async function loadInstrumenter() {
  const fromCore = createRequire(projectRequire().resolve('@stryker-mutator/core/package.json'));
  const { Instrumenter } = await import(
    pathToFileURL(fromCore.resolve('@stryker-mutator/instrumenter')).href
  );
  return new Instrumenter(SILENT_LOGGER);
}

async function loadTypeScript() {
  const { default: ts } = await import(pathToFileURL(projectRequire().resolve('typescript')).href);
  return ts;
}

function runsOnCall(ts, node) {
  if (ts.isFunctionLike(node)) return node.body !== undefined;
  const isStatic = (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword;
  return (
    ts.isPropertyDeclaration(node) &&
    node.initializer !== undefined &&
    !(node.modifiers ?? []).some(isStatic)
  );
}

/**
 * Source ranges of the code that runs when called rather than on import: every function-like node
 * with a body, and every instance property initializer, which runs when a test constructs the
 * class.
 */
function functionRanges(ts, name, content) {
  const source = ts.createSourceFile(name, content, ts.ScriptTarget.Latest, true);
  const ranges = [];
  const visit = (node) => {
    if (runsOnCall(ts, node)) ranges.push([node.getStart(source), node.getEnd()]);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { source, ranges };
}

/**
 * Whether a mutant sits inside one of those ranges, so it runs when a test calls or constructs it.
 * A mutant elsewhere is evaluated on import, which is what Stryker's `ignoreStatic` reports as `Ignored`
 * without running it; the mutant that replaces a whole module-level function is one of those too,
 * so the function's own exact range does not count.
 */
function runsInsideFunction({ source, ranges }, location) {
  const start = source.getPositionOfLineAndCharacter(location.start.line, location.start.column);
  const end = source.getPositionOfLineAndCharacter(location.end.line, location.end.column);
  return ranges.some(([from, to]) => from <= start && end <= to && (from !== start || to !== end));
}

/**
 * Mutants per file, counted by Stryker's own instrumenter over the given files, as
 * `{ runnable, scored }`. `runnable` leaves out the mutants the instrumenter already reports as
 * `Ignored` (a `Stryker disable` directive); a file with none runnable has nothing for a shard to
 * do. `scored` further leaves out the static ones, the mutants outside every function and instance
 * property initializer, which `ignoreStatic` skips, so it tracks what a shard spends its time on. Every file is present.
 */
export async function countMutants(files) {
  const [instrumenter, ts] = await Promise.all([loadInstrumenter(), loadTypeScript()]);
  const contents = new Map(files.map((name) => [name, fs.readFileSync(name, 'utf8')]));
  const { mutants } = await instrumenter.instrument(
    files.map((name) => ({ name, mutate: true, content: contents.get(name) })),
    DEFAULT_INSTRUMENTER_OPTIONS
  );

  const counts = new Map(files.map((file) => [file, { runnable: 0, scored: 0 }]));
  const parsed = new Map();
  for (const mutant of mutants) {
    if (mutant.status !== undefined) continue;
    const count = counts.get(mutant.fileName);
    count.runnable += 1;
    if (!parsed.has(mutant.fileName)) {
      parsed.set(
        mutant.fileName,
        functionRanges(ts, mutant.fileName, contents.get(mutant.fileName))
      );
    }
    if (runsInsideFunction(parsed.get(mutant.fileName), mutant.location)) count.scored += 1;
  }
  return counts;
}

/**
 * The packing weight of every file that holds a runnable mutant: its scored mutants, and at least
 * 1, because a file whose mutants are all static still costs its shard a dry run and Stryker still
 * scores the static ones a test loads inside its own body. A file without a runnable mutant has no
 * weight and goes to no shard.
 */
export function packingWeights(counts) {
  const weights = new Map();
  for (const [file, { runnable, scored }] of counts) {
    if (runnable > 0) weights.set(file, Math.max(1, scored));
  }
  return weights;
}

/**
 * Deterministic longest-processing-time bin packing: heaviest file first, each to the currently
 * lightest shard. Weights are scored-mutant counts because a shard's cost is the mutants it runs;
 * packing by file size left a cold shard holding 1.6x the mean mutant load, and a sharded run is
 * only as fast as its slowest shard. Every weighed file lands in exactly one shard, each sorted by
 * path. `packingWeights` keeps every weight positive: zero-weight files would all tie onto the one
 * lightest shard, which is how one shard drew 57 barrels and a 3,779-test related set.
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
 * The one packing every shard job and the merge job derive from the same commit. `weights` holds
 * every file with a runnable mutant and the shards hold exactly those; `unsharded` lists the rest
 * of `collectMutateFiles()` (barrels, token modules, files with nothing to mutate), which no shard
 * runs, so the merge can still account for the whole scope.
 */
export async function packMutateShards(total) {
  assertShardTotal(total);
  const scope = collectMutateFiles();
  const weights = packingWeights(await countMutants(scope));
  const unsharded = scope.filter((file) => !weights.has(file));
  return { shards: packShards(weights, total), weights, unsharded };
}

export async function shardMutateFiles(total, index) {
  assertShardTotal(total);
  assertShardIndex(total, index);
  const { shards } = await packMutateShards(total);
  return shards[index];
}
