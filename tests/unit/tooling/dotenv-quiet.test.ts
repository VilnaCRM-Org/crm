import fs from 'fs';
import path from 'path';

/**
 * dotenv 18 prints "◇ injected env (N) from .env" through console.error on every config() call
 * unless it is told to be quiet. The console gate fails a Jest test on that output, and the
 * Playwright, Lighthouse and memlab runners print it into their reports, so every call that loads
 * a file must pass `quiet: true`. The `dotenv/config` side-effect entry is quiet by default in
 * dotenv 18, so importing it is allowed.
 *
 * Sources are found by walking the tree rather than asking git, because the DIND unit lane copies
 * the repository without `.git`.
 */
const root = path.resolve(__dirname, '..', '..', '..');
const SELF = path.relative(root, __filename);
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.cjs', '.mjs']);
const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'reports',
  'specs',
  'storybook-static',
  'playwright-report',
  'test-results',
  'bin',
]);
const VISITED_HIDDEN_DIRECTORIES = new Set(['.storybook', '.github', '.husky']);

const isSkipped = (name: string): boolean =>
  SKIPPED_DIRECTORIES.has(name) || (name.startsWith('.') && !VISITED_HIDDEN_DIRECTORIES.has(name));

const walkSources = (dir: string, acc: string[] = []): string[] => {
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).forEach((entry) => {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory() && !isSkipped(entry.name)) walkSources(relative, acc);
    if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) acc.push(relative);
  });
  return acc;
};

const trackedSources = (): string[] => walkSources('').filter((file) => file !== SELF);

const escape = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

/**
 * Every name `config` is reachable under: `dotenv.config`, `require('dotenv').config`, and the
 * local bindings of `import { config [as x] } from 'dotenv'` and
 * `const { config[: x] } = require('dotenv')`.
 */
const calleesIn = (source: string): string[] => {
  const callees = [
    String.raw`\bdotenv\.config`,
    String.raw`require\(\s*['"]dotenv['"]\s*\)\.config`,
  ];
  const bindings = [
    ...source.matchAll(
      /import\s*(?:type\s+)?(?:[\w$]+\s*,\s*)?\{([^}]*)\}\s*from\s*['"]dotenv['"]/gu
    ),
    ...source.matchAll(/\{([^}]*)\}\s*=\s*require\(\s*['"]dotenv['"]\s*\)/gu),
  ];

  bindings.forEach((binding) =>
    (binding[1] ?? '').split(',').forEach((specifier) => {
      const [imported, local] = specifier.trim().split(/\s*(?:\bas\b|:)\s*/u);
      if (imported === 'config') callees.push(String.raw`(?<![\w.$])` + escape(local ?? imported));
    })
  );

  return callees;
};

/** The text between a call's opening parenthesis and its balanced closing one, across lines. */
const argumentsAt = (source: string, open: number): string => {
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    depth += source[index] === '(' ? 1 : 0;
    depth -= source[index] === ')' ? 1 : 0;
    if (depth === 0) return source.slice(open + 1, index);
  }
  return source.slice(open + 1);
};

const configCallsIn = (source: string): string[] =>
  calleesIn(source).flatMap((callee) =>
    Array.from(source.matchAll(new RegExp(`${callee}\\s*\\(`, 'gu')), (match) =>
      argumentsAt(source, (match.index ?? 0) + match[0].length - 1).trim()
    )
  );

const isQuiet = (args: string): boolean => /\bquiet\s*:\s*true\b/u.test(args);

const repositoryCalls = (): { file: string; args: string }[] =>
  trackedSources()
    .map((file) => ({ file, source: fs.readFileSync(path.join(root, file), 'utf8') }))
    .filter(({ source }) => source.includes('dotenv'))
    .flatMap(({ file, source }) => configCallsIn(source).map((args) => ({ file, args })));

describe('dotenv loads quietly (dotenv 18)', () => {
  it('finds the config() calls it guards', () => {
    expect(repositoryCalls().map(({ file }) => file)).toEqual(
      expect.arrayContaining([
        'playwright.config.ts',
        'lighthouse/constants.js',
        'src/config/i18n-config.js',
        'docker/apollo-server/lib/server.ts',
      ])
    );
  });

  it('scans every JavaScript and TypeScript module kind, the Apollo .mts files included', () => {
    const sources = trackedSources();

    expect(
      sources.some((file) => file.startsWith('docker/apollo-server/') && file.endsWith('.mts'))
    ).toBe(true);
    expect([...SOURCE_EXTENSIONS]).toEqual(expect.arrayContaining(['.mts', '.cts', '.jsx']));
    expect(
      sources.some((file) => file.startsWith('node_modules') || file.startsWith('specs'))
    ).toBe(false);
  });

  it('passes quiet: true to every dotenv config() call', () => {
    expect(repositoryCalls().filter(({ args }) => !isQuiet(args))).toEqual([]);
  });

  it.each([
    ['a bare require', "require('dotenv').config();"],
    ['a namespace call without quiet', "dotenv.config({ path: '.env' });"],
    ['a call split across lines', "dotenv.config({\n  path: resolve('.env'),\n});"],
    ['a named import', "import { config } from 'dotenv';\nconfig({ override: true });"],
    ['a renamed import', "import { config as load } from 'dotenv';\nload();"],
    ['a destructured require', "const { config: load } = require('dotenv');\nload({});"],
    ['a default-plus-named import', "import dotenv, { config } from 'dotenv';\nconfig();"],
  ])('flags %s', (_case, source) => {
    const calls = configCallsIn(source);

    expect(calls).toHaveLength(1);
    expect(calls.filter((args) => !isQuiet(args))).toHaveLength(1);
  });

  it.each([
    [
      'a quiet call split across lines',
      "dotenv.config({\n  path: resolve('.env'),\n  quiet: true,\n});",
    ],
    ['a quiet named import', "import { config } from 'dotenv';\nconfig({ quiet: true });"],
  ])('accepts %s', (_case, source) => {
    expect(configCallsIn(source).filter((args) => !isQuiet(args))).toEqual([]);
    expect(configCallsIn(source)).toHaveLength(1);
  });

  it('does not count another object’s config() or the quiet dotenv/config entry', () => {
    expect(configCallsIn("import 'dotenv/config';\nwebpack.config({});\nreconfig();")).toEqual([]);
  });
});
