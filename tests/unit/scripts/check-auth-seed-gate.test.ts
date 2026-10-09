/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import { spawnSync } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const SCRIPT = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'scripts',
  'ci',
  'check-auth-seed-gate.mjs'
);
const PROBE_TOKEN = 'probe-token-for-the-gate';
const WINDOW_KEY = '__PRELOADED_AUTH_TOKEN__';
const DEMO_STORAGE_KEY = 'vilnacrm.sandbox-demo-session';
const DEMO_EMAIL = 'demo@vilnacrm.com';
const SHELL = '<!doctype html><html lang="uk"><body><div id="root"></div></body></html>';
const DEMO_PROVIDER = `this.storageKey="${DEMO_STORAGE_KEY}";this.session={email:"${DEMO_EMAIL}"}`;

const run = (args: string[]): { status: number | null; output: string } => {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

  return { status: result.status, output: `${result.stdout}${result.stderr}` };
};

const makeBundle = (files: Record<string, string>): string => {
  const dir = mkdtempSync(path.join(tmpdir(), 'auth-seed-gate-'));
  for (const [name, contents] of Object.entries(files)) {
    const full = path.join(dir, name);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, contents);
  }
  return dir;
};

// What every deployable build ships besides the app itself (ADR-019): the runtime-gated sandbox
// demo provider and a 404.html that is a byte copy of index.html.
const shippable = (files: Record<string, string> = {}): string =>
  makeBundle({
    'index.html': SHELL,
    '404.html': SHELL,
    'static/js/auth.js': DEMO_PROVIDER,
    ...files,
  });

const absent = (dir: string): { status: number | null; output: string } =>
  run(['--dir', dir, '--expect', 'absent', '--token', PROBE_TOKEN]);

describe('check-auth-seed-gate', () => {
  it('passes a clean bundle and fails one that leaked the seam', () => {
    const clean = shippable({ 'static/js/index.js': 'console.log("hello")' });
    const leaked = shippable({
      'static/js/index.js': `window.${WINDOW_KEY}||"${PROBE_TOKEN}"`,
    });

    expect(run(['--dir', clean, '--expect', 'absent', '--token', PROBE_TOKEN]).status).toBe(0);

    const failure = run(['--dir', leaked, '--expect', 'absent', '--token', PROBE_TOKEN]);
    expect(failure.status).toBe(1);
    expect(failure.output).toContain(WINDOW_KEY);
    expect(failure.output).toContain(PROBE_TOKEN);
  });

  it('requires the positive control to actually contain the seam', () => {
    const seeded = makeBundle({
      'static/js/index.js': `window.${WINDOW_KEY}||"${PROBE_TOKEN}"`,
    });
    const clean = makeBundle({ 'static/js/index.js': 'console.log("hello")' });

    expect(run(['--dir', seeded, '--expect', 'present', '--token', PROBE_TOKEN]).status).toBe(0);
    expect(run(['--dir', clean, '--expect', 'present', '--token', PROBE_TOKEN]).status).toBe(1);
  });

  it('scans assets that are not scripts', () => {
    const page = `<script>window.${WINDOW_KEY}=1</script>`;
    const leaked = shippable({ 'index.html': page, '404.html': page });

    expect(run(['--dir', leaked, '--expect', 'absent', '--token', PROBE_TOKEN]).status).toBe(1);
  });

  it('ignores source maps, which always embed the original TypeScript', () => {
    const mapOnly = shippable({
      'static/js/index.js': 'console.log("hello")',
      'static/js/index.js.map': `{"sourcesContent":["window.${WINDOW_KEY}"]}`,
    });

    expect(run(['--dir', mapOnly, '--expect', 'absent', '--token', PROBE_TOKEN]).status).toBe(0);
  });

  it('fails closed rather than passing a scan that inspected nothing', () => {
    const empty = makeBundle({});
    const mapsOnly = makeBundle({ 'static/js/index.js.map': '{}' });

    const missing = run([
      '--dir',
      path.join(tmpdir(), 'no-such-bundle-dir'),
      '--expect',
      'absent',
      '--token',
      PROBE_TOKEN,
    ]);
    expect(missing.status).not.toBe(0);
    expect(missing.output).toContain('does not exist');

    for (const dir of [empty, mapsOnly]) {
      const result = run(['--dir', dir, '--expect', 'absent', '--token', PROBE_TOKEN]);
      expect(result.status).not.toBe(0);
      expect(result.output).toContain('inspected nothing');
    }
  });

  it.each([
    ['the preloaded-auth opt-in flag', 'ENABLE_PRELOADED_AUTH_TOKEN_SEED'],
    ['the preloaded-auth token variable', 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN'],
    ['the window key', WINDOW_KEY],
    ['the probe token', PROBE_TOKEN],
  ])('fails a deployable bundle that carries %s', (_label, marker) => {
    const leaked = shippable({ 'static/js/index.js': `var x="${marker}"` });

    const failure = run(['--dir', leaked, '--expect', 'absent', '--token', PROBE_TOKEN]);
    expect(failure.status).toBe(1);
    expect(failure.output).toContain(marker);
  });

  it('confirms the deployable bundle keeps what a sandbox needs', () => {
    const result = absent(shippable());

    expect(result.status).toBe(0);
    expect(result.output).toContain('keeps the sandbox demo login and the 404.html fallback');
  });

  it.each([
    ['the demo storage key', DEMO_STORAGE_KEY, { 'static/js/auth.js': `"${DEMO_EMAIL}"` }],
    ['the demo email', DEMO_EMAIL, { 'static/js/auth.js': `"${DEMO_STORAGE_KEY}"` }],
  ])('fails a deployable bundle that lost %s', (_label, marker, files) => {
    const failure = absent(shippable(files));

    expect(failure.status).toBe(1);
    expect(failure.output).toContain(`missing ${marker}`);
    expect(failure.output).toContain('ADR-019');
  });

  it.each([
    ['no 404.html', { '404.html': null }, '404.html is missing'],
    ['a 404.html that is not the shell', { '404.html': '<p>Not found</p>' }, 'not a byte copy'],
    ['no shell to compare against', { 'index.html': null }, 'index.html is missing'],
  ])('fails a deployable bundle with %s', (_label, overrides, problem) => {
    const documents = Object.fromEntries(
      Object.entries({ 'index.html': SHELL, '404.html': SHELL, ...overrides }).filter(
        (entry): entry is [string, string] => entry[1] !== null
      )
    );
    const failure = absent(makeBundle({ ...documents, 'static/js/auth.js': DEMO_PROVIDER }));

    expect(failure.status).toBe(1);
    expect(failure.output).toContain(problem);
  });

  it('rejects a malformed invocation instead of silently scanning nothing', () => {
    const dir = makeBundle({ 'static/js/index.js': 'console.log("hello")' });

    expect(run(['--expect', 'absent', '--token', PROBE_TOKEN]).status).not.toBe(0);
    expect(run(['--dir', dir, '--token', PROBE_TOKEN]).status).not.toBe(0);
    expect(run(['--dir', dir, '--expect', 'maybe', '--token', PROBE_TOKEN]).status).not.toBe(0);
    expect(run(['--dir', dir, '--expect', 'absent']).status).not.toBe(0);
    expect(run(['--dir', dir, '--expect', 'absent', '--token', '  ']).status).not.toBe(0);
  });

  it.each([
    ['no --dir', ['--expect', 'absent', '--token', PROBE_TOKEN], '--dir <distDir> is required'],
    ['no --expect', ['--dir', '.', '--token', PROBE_TOKEN], '--expect must be "absent" or'],
    [
      'a blank --token',
      ['--dir', '.', '--expect', 'absent', '--token', ' '],
      '--token <probeValue>',
    ],
    [
      'a valueless --token',
      ['--dir', '.', '--expect', 'absent', '--token'],
      '--token <probeValue>',
    ],
  ])('names the broken argument for an invocation with %s', (_label, args, message) => {
    const result = run(args);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain(`check-auth-seed-gate: ${message}`);
  });
});
