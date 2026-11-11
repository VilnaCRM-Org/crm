import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { relatedTestCounts } from './mutation-related-tests.mjs';

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
 * What one mutant run costs on top of its related tests, in logic-test loads, and what a component
 * test costs against a logic test. Fitted to 39 cold shards of one 48-shard run on 2026-11-10:
 * about 0.3 s per mutant run, 0.09 s per related `.ts` test and 0.29 s per related `.tsx` test,
 * against a fixed 75 s per shard (residual 50 s).
 */
const RUN_OVERHEAD_IN_TEST_LOADS = 4;
const COMPONENT_TEST_LOADS = 3;

/**
 * How far over the mean a shard's runnable mutants may go. A load weight cannot see how long the
 * covering tests themselves take, and a shard that drew 257 mutants of cheap-looking files with
 * slow page tests met the kill switch while its weight sat at the minimum; capping the count
 * bounds what that blind spot can add.
 */
const MUTANT_CAP_OVER_MEAN = 1.05;

/**
 * What one mutant of a file costs its shard, in logic-test loads: the run overhead plus every
 * related test file Jest loads for it, a component test counting three. Not rounded: a power-of-two
 * step once weighed the scrubber 29% light and packed eight files beside it, while a repack only
 * costs the shards a cold run, which the mutant cap is sized for.
 */
export function fanOutFactor({ logic, component }) {
  return RUN_OVERHEAD_IN_TEST_LOADS + logic + COMPONENT_TEST_LOADS * component;
}

/**
 * The packing weight of every file that holds a runnable mutant: its runnable mutants, plus one
 * for the shard's dry run, times the fan-out factor of its related tests. A cold shard runs every
 * runnable mutant, the static ones a test loads inside its own body included, and each one reloads
 * every related test file, so a 150-mutant file related to 37 tests costs what a 150-mutant leaf
 * related to one never could; the dry run loads each file's related tests once more, which keeps
 * a pile of cheap files from looking free. A file without a runnable mutant has no weight and goes
 * to no shard.
 */
export function packingWeights(counts, relatedTests) {
  const none = { logic: 0, component: 0 };
  const weights = new Map();
  for (const [file, { runnable }] of counts) {
    if (runnable > 0) {
      weights.set(file, (runnable + 1) * fanOutFactor(relatedTests.get(file) ?? none));
    }
  }
  return weights;
}

function mutantCap(mutants, total) {
  if (mutants === undefined) return Number.POSITIVE_INFINITY;
  const sum = [...mutants.values()].reduce((all, count) => all + count, 0);
  return Math.ceil((MUTANT_CAP_OVER_MEAN * sum) / total);
}

function targetShard(loads, held, room) {
  let target = -1;
  for (let i = 0; i < loads.length; i += 1) {
    if (held[i] + room <= held.cap && (target < 0 || loads[i] < loads[target])) target = i;
  }
  return target < 0 ? lightestShard(loads) : target;
}

/**
 * Deterministic longest-processing-time bin packing: heaviest file first, each to the lightest
 * shard that stays within the mutant cap (the lightest of all when none does). Weights are
 * mutant-run costs because a shard is only as fast as the mutants it runs: packing by file size
 * left a cold shard holding 1.6x the mean mutant load, and packing by mutant count alone put a
 * 37-related-test file and a 111-related-test file in shards that ran 22 and 29 minutes cold
 * against a 15-minute cap. Every weighed file lands in exactly one shard, each sorted by path.
 * `packingWeights` keeps every weight positive: zero-weight files would all tie onto the one
 * lightest shard, which is how one shard drew 57 barrels and a 3,779-test related set. Without
 * `mutants` no cap applies.
 */
export function packShards(weights, total, mutants) {
  assertShardTotal(total);

  const shards = Array.from({ length: total }, () => []);
  const loads = new Array(total).fill(0);
  const held = Object.assign(new Array(total).fill(0), { cap: mutantCap(mutants, total) });

  // Code-unit ordering, not localeCompare: the tiebreak decides which shard a file lands in, and
  // each shard carries its own incremental cache, so it has to agree across every machine's locale.
  const heaviestFirst = [...weights]
    .map(([file, weight]) => ({ file, weight }))
    .sort((a, b) => b.weight - a.weight || byPath(a.file, b.file));

  for (const { file, weight } of heaviestFirst) {
    const count = mutants?.get(file) ?? 0;
    const target = targetShard(loads, held, count);
    shards[target].push(file);
    loads[target] += weight;
    held[target] += count;
  }

  return shards.map((files) => files.sort(byPath));
}

/**
 * The one packing every shard job and the merge job derive from the same commit. `weights` holds
 * every file with a runnable mutant and the shards hold exactly those, `counts` the mutant counts
 * behind them; `unsharded` lists the rest
 * of `collectMutateFiles()` (barrels, token modules, files with nothing to mutate), which no shard
 * runs, so the merge can still account for the whole scope.
 */
export async function packMutateShards(total) {
  assertShardTotal(total);
  const scope = collectMutateFiles();
  const counts = await countMutants(scope);
  const runnable = scope.filter((file) => counts.get(file).runnable > 0);
  const weights = packingWeights(counts, relatedTestCounts(runnable));
  const mutants = new Map(runnable.map((file) => [file, counts.get(file).runnable]));
  const unsharded = scope.filter((file) => !weights.has(file));
  return { shards: packShards(weights, total, mutants), weights, mutants, unsharded, counts };
}

export async function shardMutateFiles(total, index) {
  assertShardTotal(total);
  assertShardIndex(total, index);
  const { shards } = await packMutateShards(total);
  return shards[index];
}
