// scripts/ci/sonarjs-gate-fixtures.mjs
//
// Must-fail / must-pass coverage for the curated eslint-plugin-sonarjs bug-pattern set in
// eslint.config.mjs (issue #136). `make lint-eslint` proves `src/` obeys the rules AS CONFIGURED;
// it cannot tell a rule that is quiet because the code is clean from one that is quiet because a
// plugin upgrade renamed it, a typed rule lost its type information, or a later override block
// stopped reaching a scope. Every adopted rule is silent on `src/` today, so without this runner
// the whole set could go dead with CI still green.
//
// It resolves the effective config for representative paths, derives the adopted rule universe
// from the flat config itself (never from a transcript), and lints one violating and one
// corrected snippet per rule through the RESOLVED plugin, rule options and parser. The typed
// rules need a real TypeScript program, so the snippets are written to a throwaway directory
// under the OS temp dir with its own tsconfig — never into the repository.
//
// Runs in a plain `node` child process (spawned by tests/unit/tooling/sonarjs-gate.test.ts):
// jest.config.ts runs CJS Jest with no --experimental-vm-modules, and ESLint v9 loads the flat
// eslint.config.mjs via a native dynamic import() that fails inside Jest's vm context.
import { ESLint, Linter } from 'eslint';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import flatConfig from '../../eslint.config.mjs';

const PREFIX = 'sonarjs/';

// Representative paths per scope. calculateConfigForFile resolves by glob, so the files need not
// exist. `src` probes must carry every adopted rule; `outOfScope` probes must carry none.
const PROBES = {
  src: {
    logic: 'src/services/__probe__.ts',
    component: 'src/components/__probe__.tsx',
    hook: 'src/modules/user/features/auth/stores/use-__probe__.ts',
    authPaintPath: 'src/modules/user/features/auth/components/__probe__.tsx',
    routes: 'src/routes/__probe__.tsx',
    typeOnly: 'src/modules/user/types/__probe__.ts',
  },
  outOfScope: {
    unitTest: 'tests/unit/__probe__.test.ts',
    story: 'src/components/__probe__.stories.tsx',
  },
};

// One violating (`fail`) and one corrected (`pass`) snippet per adopted rule. `ext` picks the
// parser mode; the corrected snippet is the remediation the rule asks for, so it doubles as the
// documented fix pattern.
const FIXTURES = [
  {
    rule: 'no-all-duplicated-branches',
    ext: 'ts',
    fail: 'export const pick = (flag: boolean): number => (flag ? 1 : 1);',
    pass: 'export const pick = (flag: boolean): number => (flag ? 1 : 2);',
  },
  {
    rule: 'no-duplicated-branches',
    ext: 'ts',
    fail: [
      'export function route(kind: string, log: (m: string) => void): void {',
      "  if (kind === 'a') {",
      "    log('first');",
      "    log('second');",
      "  } else if (kind === 'b') {",
      "    log('third');",
      "  } else if (kind === 'c') {",
      "    log('first');",
      "    log('second');",
      '  }',
      '}',
    ].join('\n'),
    pass: [
      'export function route(kind: string, log: (m: string) => void): void {',
      "  if (kind === 'a' || kind === 'c') {",
      "    log('first');",
      "    log('second');",
      "  } else if (kind === 'b') {",
      "    log('third');",
      '  }',
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-identical-conditions',
    ext: 'ts',
    fail: [
      'export function label(code: number): string {',
      "  if (code === 1) return 'one';",
      "  else if (code === 1) return 'uno';",
      "  return 'other';",
      '}',
    ].join('\n'),
    pass: [
      'export function label(code: number): string {',
      "  if (code === 1) return 'one';",
      "  else if (code === 2) return 'two';",
      "  return 'other';",
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-identical-expressions',
    ext: 'ts',
    fail: 'export const both = (a: number, b: number): boolean => a > b && a > b;',
    pass: 'export const both = (a: number, b: number): boolean => a > b && b > 0;',
  },
  {
    rule: 'no-gratuitous-expressions',
    ext: 'ts',
    fail: [
      'export function f(ready: boolean): string {',
      '  if (ready) {',
      "    if (ready) return 'go';",
      '  }',
      "  return 'wait';",
      '}',
    ].join('\n'),
    pass: [
      'export function f(ready: boolean, armed: boolean): string {',
      '  if (ready) {',
      "    if (armed) return 'go';",
      '  }',
      "  return 'wait';",
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-inverted-boolean-check',
    ext: 'ts',
    fail: 'export const differs = (a: number, b: number): boolean => !(a === b);',
    pass: 'export const differs = (a: number, b: number): boolean => a !== b;',
  },
  {
    rule: 'no-redundant-boolean',
    ext: 'ts',
    fail: 'export const on = (flag: boolean): boolean => flag && true;',
    pass: 'export const on = (flag: boolean): boolean => flag;',
  },
  {
    rule: 'prefer-single-boolean-return',
    ext: 'ts',
    fail: [
      'export function positive(n: number): boolean {',
      '  if (n > 0) {',
      '    return true;',
      '  } else {',
      '    return false;',
      '  }',
      '}',
    ].join('\n'),
    pass: 'export function positive(n: number): boolean {\n  return n > 0;\n}',
  },
  {
    rule: 'no-same-line-conditional',
    ext: 'ts',
    fail: [
      'export function f(a: boolean, b: boolean, log: (m: string) => void): void {',
      '  if (a) {',
      "    log('a');",
      '  } if (b) {',
      "    log('b');",
      '  }',
      '}',
    ].join('\n'),
    pass: [
      'export function f(a: boolean, b: boolean, log: (m: string) => void): void {',
      '  if (a) {',
      "    log('a');",
      '  } else if (b) {',
      "    log('b');",
      '  }',
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-redundant-jump',
    ext: 'ts',
    fail: 'export function f(log: () => void): void {\n  log();\n  return;\n}',
    pass: 'export function f(log: () => void): void {\n  log();\n}',
  },
  {
    rule: 'comma-or-logical-or-case',
    ext: 'ts',
    fail: [
      'export function f(k: string): number {',
      '  switch (k) {',
      "    case 'a' || 'b':",
      '      return 1;',
      '    default:',
      '      return 0;',
      '  }',
      '}',
    ].join('\n'),
    pass: [
      'export function f(k: string): number {',
      '  switch (k) {',
      "    case 'a':",
      "    case 'b':",
      '      return 1;',
      '    default:',
      '      return 0;',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    rule: 'bitwise-operators',
    ext: 'ts',
    fail: [
      'export function f(a: boolean, b: boolean): string {',
      "  if (a & b) return 'both';",
      "  return 'not both';",
      '}',
    ].join('\n'),
    pass: [
      'export function f(a: boolean, b: boolean): string {',
      "  if (a && b) return 'both';",
      "  return 'not both';",
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-element-overwrite',
    ext: 'ts',
    fail: 'export function f(list: number[]): void {\n  list[0] = 1;\n  list[0] = 2;\n}',
    pass: 'export function f(list: number[]): void {\n  list[0] = 1;\n  list[1] = 2;\n}',
  },
  {
    rule: 'no-empty-collection',
    ext: 'ts',
    fail: [
      'export function f(log: (n: number) => void): void {',
      '  const items: number[] = [];',
      '  items.forEach((n) => log(n));',
      '}',
    ].join('\n'),
    pass: [
      'export function f(log: (n: number) => void, seed: number): void {',
      '  const items: number[] = [];',
      '  items.push(seed);',
      '  items.forEach((n) => log(n));',
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-unused-collection',
    ext: 'ts',
    fail: 'export function f(n: number): void {\n  const seen: number[] = [];\n  seen.push(n);\n}',
    pass: [
      'export function f(n: number): number[] {',
      '  const seen: number[] = [];',
      '  seen.push(n);',
      '  return seen;',
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-collection-size-mischeck',
    ext: 'ts',
    fail: 'export const any = (list: string[]): boolean => list.length >= 0;',
    pass: 'export const any = (list: string[]): boolean => list.length > 0;',
  },
  {
    rule: 'no-ignored-return',
    ext: 'ts',
    fail: 'export function f(name: string): string {\n  name.trim();\n  return name;\n}',
    pass: 'export function f(name: string): string {\n  return name.trim();\n}',
  },
  {
    rule: 'no-use-of-empty-return-value',
    ext: 'ts',
    fail: [
      'function notify(sink: (m: string) => void): void {',
      "  sink('done');",
      '}',
      'export function f(sink: (m: string) => void): unknown {',
      '  const result = notify(sink);',
      '  return result;',
      '}',
    ].join('\n'),
    pass: [
      'function notify(sink: (m: string) => void): void {',
      "  sink('done');",
      '}',
      'export function f(sink: (m: string) => void): void {',
      '  notify(sink);',
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-misleading-array-reverse',
    ext: 'ts',
    fail: [
      'export function f(list: number[]): number[] {',
      '  const reversed = list.reverse();',
      '  return reversed;',
      '}',
    ].join('\n'),
    pass: [
      'export function f(list: number[]): number[] {',
      '  const reversed = [...list].reverse();',
      '  return reversed;',
      '}',
    ].join('\n'),
  },
  {
    rule: 'array-callback-without-return',
    ext: 'ts',
    fail: 'export const doubled = (list: number[]): unknown[] => list.map((n) => {\n  n * 2;\n});',
    pass: 'export const doubled = (list: number[]): number[] => list.map((n) => n * 2);',
  },
  {
    rule: 'reduce-initial-value',
    ext: 'ts',
    fail: 'export const sum = (list: number[]): number => list.reduce((a, b) => a + b);',
    pass: 'export const sum = (list: number[]): number => list.reduce((a, b) => a + b, 0);',
  },
  {
    rule: 'no-dead-store',
    ext: 'ts',
    fail: [
      'export function f(a: number, b: number): number {',
      '  let total = a + b;',
      '  total = a * b;',
      '  return total;',
      '}',
    ].join('\n'),
    pass: [
      'export function f(a: number, b: number): number {',
      '  let total = a + b;',
      '  total = total * b;',
      '  return total;',
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-redundant-assignments',
    ext: 'ts',
    fail: [
      'export function f(busy: boolean): string {',
      "  let mode = 'idle';",
      '  if (busy) {',
      "    mode = 'idle';",
      '  }',
      '  return mode;',
      '}',
    ].join('\n'),
    pass: [
      'export function f(busy: boolean): string {',
      "  let mode = 'idle';",
      '  if (busy) {',
      "    mode = 'busy';",
      '  }',
      '  return mode;',
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-useless-increment',
    ext: 'ts',
    fail: 'export function f(n: number): number {\n  let i = n;\n  i = i++;\n  return i;\n}',
    pass: 'export function f(n: number): number {\n  let i = n;\n  i++;\n  return i;\n}',
  },
  {
    rule: 'non-existent-operator',
    ext: 'ts',
    fail: 'export function f(n: number): number {\n  let x = n;\n  x =+ 1;\n  return x;\n}',
    pass: 'export function f(n: number): number {\n  let x = n;\n  x += 1;\n  return x;\n}',
  },
  {
    rule: 'for-loop-increment-sign',
    ext: 'ts',
    fail: [
      'export function f(log: (i: number) => void): void {',
      '  for (let i = 0; i < 10; i--) {',
      '    log(i);',
      '  }',
      '}',
    ].join('\n'),
    pass: [
      'export function f(log: (i: number) => void): void {',
      '  for (let i = 0; i < 10; i++) {',
      '    log(i);',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-unthrown-error',
    ext: 'ts',
    fail: [
      'export function f(ok: boolean): void {',
      '  if (!ok) {',
      "    new Error('not ok');",
      '  }',
      '}',
    ].join('\n'),
    pass: [
      'export function f(ok: boolean): void {',
      '  if (!ok) {',
      "    throw new Error('not ok');",
      '  }',
      '}',
    ].join('\n'),
  },
  {
    rule: 'constructor-for-side-effects',
    ext: 'ts',
    fail: [
      'class ConnectivityAdapter {',
      '  public attach(): void {',
      '    // wires listeners',
      '  }',
      '}',
      'export function boot(): void {',
      '  new ConnectivityAdapter();',
      '}',
    ].join('\n'),
    pass: [
      'class ConnectivityAdapter {',
      '  public attach(): void {',
      '    // wires listeners',
      '  }',
      '}',
      'export function boot(): void {',
      '  new ConnectivityAdapter().attach();',
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-try-promise',
    ext: 'ts',
    fail: [
      'declare function load(): Promise<string>;',
      'export function run(report: (e: unknown) => void): void {',
      '  try {',
      '    load();',
      '  } catch (error) {',
      '    report(error);',
      '  }',
      '}',
    ].join('\n'),
    pass: [
      'declare function load(): Promise<string>;',
      'export async function run(report: (e: unknown) => void): Promise<void> {',
      '  try {',
      '    await load();',
      '  } catch (error) {',
      '    report(error);',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    rule: 'jsx-no-leaked-render',
    ext: 'tsx',
    fail: [
      'export const Badge = ({ count }: { count: number }) => (',
      '  <div>{count && <span>{count}</span>}</div>',
      ');',
    ].join('\n'),
    pass: [
      'export const Badge = ({ count }: { count: number }) => (',
      '  <div>{count > 0 && <span>{count}</span>}</div>',
      ');',
    ].join('\n'),
  },
  {
    rule: 'no-hook-setter-in-body',
    ext: 'tsx',
    fail: [
      "import { useState } from 'react';",
      'export function Counter() {',
      '  const [count, setCount] = useState(0);',
      '  setCount(1);',
      '  return <p>{count}</p>;',
      '}',
    ].join('\n'),
    pass: [
      "import { useState } from 'react';",
      'export function Counter() {',
      '  const [count, setCount] = useState(0);',
      '  return <button onClick={() => setCount(count + 1)}>{count}</button>;',
      '}',
    ].join('\n'),
  },
  {
    rule: 'no-useless-react-setstate',
    ext: 'tsx',
    fail: [
      "import { useState } from 'react';",
      'export function Counter() {',
      '  const [count, setCount] = useState(0);',
      '  return <button onClick={() => setCount(count)}>{count}</button>;',
      '}',
    ].join('\n'),
    pass: [
      "import { useState } from 'react';",
      'export function Counter() {',
      '  const [count, setCount] = useState(0);',
      '  return <button onClick={() => setCount(count + 1)}>{count}</button>;',
      '}',
    ].join('\n'),
  },
  {
    rule: 'anchor-precedence',
    ext: 'ts',
    fail: 'export const isKind = (s: string): boolean => /^draft|review|final$/.test(s);',
    pass: 'export const isKind = (s: string): boolean => /^(?:draft|review|final)$/.test(s);',
  },
  {
    rule: 'existing-groups',
    ext: 'ts',
    fail: "export const swap = (s: string): string => s.replace(/(a)(b)/, '$3$1');",
    pass: "export const swap = (s: string): string => s.replace(/(a)(b)/, '$2$1');",
  },
  {
    rule: 'empty-string-repetition',
    ext: 'ts',
    fail: 'export const isRun = (s: string): boolean => /^(?:x?)*$/.test(s);',
    pass: 'export const isRun = (s: string): boolean => /^x*$/.test(s);',
  },
  {
    rule: 'no-empty-alternatives',
    ext: 'ts',
    fail: 'export const isKind = (s: string): boolean => /^(?:draft||final)$/.test(s);',
    pass: 'export const isKind = (s: string): boolean => /^(?:draft|final)$/.test(s);',
  },
];

const eslint = new ESLint({ cwd: process.cwd() });

/**
 * @param {Record<string, unknown>} rules a resolved rules map
 * @returns {Record<string, number>} each `sonarjs/*` rule name (unprefixed) → numeric severity
 */
function sonarRulesOf(rules) {
  return Object.fromEntries(
    Object.entries(rules)
      .filter(([name]) => name.startsWith(PREFIX))
      .map(([name, setting]) => [
        name.slice(PREFIX.length),
        Array.isArray(setting) ? setting[0] : setting,
      ])
  );
}

/**
 * @param {Record<string, string>} paths scope key → representative path
 * @returns {Promise<Record<string, Record<string, number>>>} scope key → resolved sonarjs rules
 */
async function resolveScopes(paths) {
  const entries = await Promise.all(
    Object.entries(paths).map(async ([key, file]) => [
      key,
      sonarRulesOf((await eslint.calculateConfigForFile(file)).rules),
    ])
  );
  return Object.fromEntries(entries);
}

/**
 * The adopted universe, derived from the flat config itself: every `sonarjs/*` rule set to error
 * in a block whose `files` target `src/`. A rule added to a new block still enters it.
 * @returns {string[]} sorted unprefixed rule names
 */
function deriveUniverse() {
  const names = new Set();
  for (const entry of flatConfig) {
    const srcScoped =
      Array.isArray(entry?.files) && entry.files.some((glob) => String(glob).startsWith('src/'));
    if (!srcScoped) continue;
    for (const [name, setting] of Object.entries(entry.rules ?? {})) {
      const severity = Array.isArray(setting) ? setting[0] : setting;
      if (name.startsWith(PREFIX) && (severity === 'error' || severity === 2)) {
        names.add(name.slice(PREFIX.length));
      }
    }
  }
  return [...names].sort();
}

const [src, outOfScope] = await Promise.all([
  resolveScopes(PROBES.src),
  resolveScopes(PROBES.outOfScope),
]);

// Lint with exactly what the gate runs on a src component: the resolved plugin object, the
// resolved rule setting, and the resolved parser — only `project` is repointed at the throwaway
// program so the typed rules see real type information.
const resolved = await eslint.calculateConfigForFile(PROBES.src.component);
const workDir = mkdtempSync(path.join(tmpdir(), 'sonarjs-gate-'));
try {
  writeFileSync(
    path.join(workDir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        lib: ['ES2023', 'DOM'],
        noEmit: true,
        skipLibCheck: true,
        types: [],
      },
      include: ['*.ts', '*.tsx'],
    })
  );
  const cases = FIXTURES.flatMap((fx) =>
    ['fail', 'pass'].map((expect) => ({
      rule: fx.rule,
      expect,
      code: fx[expect],
      file: path.join(workDir, `${fx.rule}.${expect}.${fx.ext}`),
    }))
  );
  // Every file exists before the first lint, so typescript-eslint builds one program for all.
  cases.forEach((c) => writeFileSync(c.file, c.code));

  const linter = new Linter({ configType: 'flat', cwd: workDir });
  const languageOptions = {
    ...resolved.languageOptions,
    parserOptions: {
      ...resolved.languageOptions.parserOptions,
      project: path.join(workDir, 'tsconfig.json'),
      tsconfigRootDir: workDir,
    },
  };
  const fixtures = cases.map((c) => {
    const ruleId = `${PREFIX}${c.rule}`;
    const messages = linter.verify(
      c.code,
      [
        {
          files: ['**/*.ts', '**/*.tsx'],
          languageOptions,
          plugins: { sonarjs: resolved.plugins.sonarjs },
          // An unconfigured rule lints as `off`, so its must-fail fixture goes red.
          rules: { [ruleId]: resolved.rules[ruleId] ?? 'off' },
        },
      ],
      { filename: c.file }
    );
    return {
      rule: c.rule,
      expect: c.expect,
      messages: messages.map((m) => ({ ruleId: m.ruleId, message: m.message, line: m.line })),
    };
  });

  process.stdout.write(
    JSON.stringify({ universe: deriveUniverse(), scopes: { src, outOfScope }, fixtures })
  );
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
