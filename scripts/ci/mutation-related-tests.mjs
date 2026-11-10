import fs from 'node:fs';
import path from 'node:path';

/**
 * How many test files a Stryker mutant run loads for each mutated file. Every mutant runs Jest with
 * `--findRelatedTests` on its own file, and Jest loads each related test file, its setup and its
 * imports, even when the coverage-derived name filter skips every test in it. That load is what a
 * high fan-out file pays per mutant: `pii-scrubber.ts` once took 149 mutants x 37 related files,
 * about 16 minutes cold, while its scored mutants weighed no more than a 150-mutant leaf.
 *
 * The count follows Jest's own rules rather than a full import graph. Stryker runs Jest with the
 * roots of `jest.mutation.config.ts` plus the mutated file's directory, and Jest only reads the
 * dependencies of files inside its roots, so the walk from a test stops at the first file outside
 * them. Dependencies are extracted the way Jest's default extractor does it: `import`/`export
 * from` (not `import type`), `require()`, `import()`, and `jest.requireActual`/`requireMock`/
 * `createMockFromModule`, with comments stripped first. `jest.mock` is not a dependency there.
 */

export const TEST_ROOTS = ['tests/unit', 'tests/integration'];

const TEST_FILE_PATTERNS = [
  /^tests\/unit\/.+\.test\.(?:ts|tsx|js|jsx)$/,
  /^tests\/integration\/.+\.integration\.test\.(?:ts|tsx)$/,
];

const IGNORED_TEST_PATTERNS = [
  /\/node_modules\//,
  /^tests\/unit\/(?:tooling|scripts|performance|load)\//,
  /^tests\/unit\/config\/eslint-policy\.test\.ts$/,
  /\/settings\/components\/user-profile-settings\/ready-story-provider\.test\.tsx$/,
];

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.json'];

const SOURCE_FILE = /\.(?:ts|tsx|js|jsx|mts)$/;

const STRING = String.raw`([\`'"])([^'"\`]*?)\1`;
const CALL_START = String.raw`(?<!\.\s*)\b`;
const DEPENDENCY_PATTERNS = [
  new RegExp(
    String.raw`\b(?:import|export)\s+(?!type(?:of)?\s+)(?:[^'"]+\s+from\s+)?${STRING}`,
    'g'
  ),
  new RegExp(String.raw`${CALL_START}(?:require|import)\s*\(\s*${STRING}`, 'g'),
  new RegExp(
    String.raw`${CALL_START}jest\s*\.\s*` +
      String.raw`(?:requireActual|requireMock|createMockFromModule)\s*\(\s*${STRING}`,
    'g'
  ),
];

const BLOCK_COMMENT = /\/\*[^]*?\*\//g;
const LINE_COMMENT = /\/\/.*/g;

export function isMutationTestFile(file) {
  return (
    TEST_FILE_PATTERNS.some((pattern) => pattern.test(file)) &&
    !IGNORED_TEST_PATTERNS.some((pattern) => pattern.test(file))
  );
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walk(full);
    return SOURCE_FILE.test(entry.name) ? [full] : [];
  });
}

export function extractDependencies(code) {
  const stripped = code.replace(BLOCK_COMMENT, '').replace(LINE_COMMENT, '');
  return DEPENDENCY_PATTERNS.flatMap((pattern) =>
    [...stripped.matchAll(pattern)].map((match) => match[2])
  );
}

function loadAliases() {
  const { paths } = JSON.parse(fs.readFileSync('tsconfig.paths.json', 'utf8')).compilerOptions;
  return Object.entries(paths).map(([alias, [target]]) => ({
    prefix: alias.replace(/\*$/, ''),
    target: target.replace(/\*$/, ''),
    wildcard: alias.endsWith('*'),
  }));
}

function aliasTarget(aliases, specifier) {
  for (const { prefix, target, wildcard } of aliases) {
    if (wildcard ? specifier.startsWith(prefix) : specifier === prefix) {
      return target + specifier.slice(prefix.length);
    }
  }
  return null;
}

function firstExisting(base) {
  const candidates = [
    base,
    ...EXTENSIONS.map((extension) => base + extension),
    ...EXTENSIONS.map((extension) => path.posix.join(base, `index${extension}`)),
  ];
  return candidates.find((candidate) =>
    fs.statSync(candidate, { throwIfNoEntry: false })?.isFile()
  );
}

function resolveSpecifier(aliases, from, specifier) {
  const bare = specifier.replace(/^(\.{1,2}\/.+)\.js$/, '$1');
  const target = bare.startsWith('.')
    ? path.posix.normalize(path.posix.join(path.posix.dirname(from), bare))
    : aliasTarget(aliases, bare);
  return target === null ? undefined : firstExisting(target);
}

/** Reverse import edges over every file a related-test walk can cross: the test roots and `src`. */
export function buildImporterIndex(roots = [...TEST_ROOTS, 'src']) {
  const aliases = loadAliases();
  const importers = new Map();
  for (const file of roots.flatMap(walk)) {
    for (const specifier of extractDependencies(fs.readFileSync(file, 'utf8'))) {
      const dependency = resolveSpecifier(aliases, file, specifier);
      if (dependency === undefined) continue;
      if (!importers.has(dependency)) importers.set(dependency, new Set());
      importers.get(dependency).add(file);
    }
  }
  return importers;
}

function insideRoots(file, ownDirectory) {
  return (
    TEST_ROOTS.some((root) => file.startsWith(`${root}/`)) || file.startsWith(`${ownDirectory}/`)
  );
}

/** The test files Jest's related-test search reaches from `file`, under Stryker's roots. */
export function relatedTestFiles(importers, file) {
  const ownDirectory = path.posix.dirname(file);
  const seen = new Set([file]);
  const pending = [file];
  const tests = new Set();
  while (pending.length > 0) {
    for (const importer of importers.get(pending.pop()) ?? []) {
      if (seen.has(importer) || !insideRoots(importer, ownDirectory)) continue;
      seen.add(importer);
      pending.push(importer);
      if (isMutationTestFile(importer)) tests.add(importer);
    }
  }
  return tests;
}

/**
 * The related test files of each file, split by kind: a component test (`.tsx`) renders through
 * React and MUI and costs a mutant run about three times what a logic test (`.ts`) does.
 */
export function relatedTestCounts(files) {
  const importers = buildImporterIndex();
  return new Map(
    files.map((file) => {
      const tests = [...relatedTestFiles(importers, file)];
      const component = tests.filter((test) => test.endsWith('.tsx')).length;
      return [file, { logic: tests.length - component, component }];
    })
  );
}
