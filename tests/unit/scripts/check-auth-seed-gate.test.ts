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

const DEMO_EMAIL = 'demo@vilnacrm.com';
const DEMO_PASSWORD = 'Demo1234';
const DEMO_TOKEN = 'sandbox-demo-session-token';
const SANDBOX_FLAG = 'ENABLE_SANDBOX_DEMO';
const SHELL = '<!doctype html><html lang="uk"><body><div id="root"></div></body></html>';
const demoScript = `e!=="${DEMO_EMAIL}"||p!=="${DEMO_PASSWORD}"?null:"${DEMO_TOKEN}"`;

const presentArgs = (dir: string, seam: string): string[] => [
  '--dir',
  dir,
  '--expect',
  'present',
  '--seam',
  seam,
  '--token',
  PROBE_TOKEN,
];

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

describe('check-auth-seed-gate', () => {
  it('passes a clean bundle and fails one that leaked the seam', () => {
    const clean = makeBundle({ 'static/js/index.js': 'console.log("hello")' });
    const leaked = makeBundle({
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

    expect(run([...presentArgs(seeded, 'preloaded-auth')]).status).toBe(0);
    expect(run([...presentArgs(clean, 'preloaded-auth')]).status).toBe(1);
  });

  it('scans assets that are not scripts', () => {
    const leaked = makeBundle({ 'index.html': `<script>window.${WINDOW_KEY}=1</script>` });

    expect(run(['--dir', leaked, '--expect', 'absent', '--token', PROBE_TOKEN]).status).toBe(1);
  });

  it('ignores source maps, which always embed the original TypeScript', () => {
    const mapOnly = makeBundle({
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
    ['the sandbox opt-in flag', SANDBOX_FLAG],
    ['the demo email', DEMO_EMAIL],
    ['the demo password', DEMO_PASSWORD],
    ['the demo token', DEMO_TOKEN],
  ])('fails a deployable bundle that carries %s', (_label, marker) => {
    const leaked = makeBundle({ 'static/js/index.js': `var x="${marker}"` });

    const failure = run(['--dir', leaked, '--expect', 'absent', '--token', PROBE_TOKEN]);
    expect(failure.status).toBe(1);
    expect(failure.output).toContain(marker);
  });

  it('fails a deployable bundle that emits the sandbox 404.html', () => {
    const leaked = makeBundle({ 'index.html': SHELL, '404.html': SHELL });

    const failure = run(['--dir', leaked, '--expect', 'absent', '--token', PROBE_TOKEN]);
    expect(failure.status).toBe(1);
    expect(failure.output).toContain('404.html');
  });

  it('passes a sandbox bundle with the demo login and a byte-copied 404.html', () => {
    const sandbox = makeBundle({
      'index.html': SHELL,
      '404.html': SHELL,
      'static/js/auth.js': demoScript,
    });

    const result = run(presentArgs(sandbox, 'sandbox-demo'));
    expect(result.status).toBe(0);
    expect(result.output).toContain('sandbox-demo build still carries its seam');
  });

  it.each([
    ['no 404.html', { 'index.html': SHELL }, '404.html is missing'],
    [
      'a 404.html that is not the shell',
      { 'index.html': SHELL, '404.html': '<p>Not found</p>' },
      '404.html is not a byte copy of index.html',
    ],
    ['no shell to compare against', { '404.html': SHELL }, 'index.html is missing'],
  ])('fails a sandbox bundle with %s', (_label, documents, problem) => {
    const sandbox = makeBundle({ ...documents, 'static/js/auth.js': demoScript });

    const failure = run(presentArgs(sandbox, 'sandbox-demo'));
    expect(failure.status).toBe(1);
    expect(failure.output).toContain(problem);
  });

  it('fails a sandbox bundle whose demo login was stripped', () => {
    const sandbox = makeBundle({ 'index.html': SHELL, '404.html': SHELL });

    const failure = run(presentArgs(sandbox, 'sandbox-demo'));
    expect(failure.status).toBe(1);
    expect(failure.output).toContain(`missing ${DEMO_EMAIL}`);
    expect(failure.output).toContain(`missing ${DEMO_TOKEN}`);
  });

  it('fails a sandbox bundle that also carries the preloaded-auth seed', () => {
    const sandbox = makeBundle({
      'index.html': SHELL,
      '404.html': SHELL,
      'static/js/auth.js': `${demoScript};window.${WINDOW_KEY}`,
    });

    const failure = run(presentArgs(sandbox, 'sandbox-demo'));
    expect(failure.status).toBe(1);
    expect(failure.output).toContain(`unexpected ${WINDOW_KEY}`);
  });

  it('fails a test-harness bundle that also carries the sandbox seam or its 404.html', () => {
    const seeded = `window.${WINDOW_KEY}||"${PROBE_TOKEN}"`;
    const withDemo = makeBundle({ 'static/js/index.js': `${seeded};${demoScript}` });
    const withFallback = makeBundle({
      'index.html': SHELL,
      '404.html': SHELL,
      'static/js/index.js': seeded,
    });

    const demoFailure = run(presentArgs(withDemo, 'preloaded-auth'));
    expect(demoFailure.status).toBe(1);
    expect(demoFailure.output).toContain(`unexpected ${DEMO_EMAIL}`);

    const fallbackFailure = run(presentArgs(withFallback, 'preloaded-auth'));
    expect(fallbackFailure.status).toBe(1);
    expect(fallbackFailure.output).toContain('unexpected 404.html');
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

  it('demands a known seam for a positive control and refuses one for an absent scan', () => {
    const dir = makeBundle({ 'static/js/index.js': 'console.log("hello")' });
    const present = ['--dir', dir, '--expect', 'present', '--token', PROBE_TOKEN];

    const unnamed = run(present);
    expect(unnamed.status).not.toBe(0);
    expect(unnamed.output).toContain('--seam preloaded-auth|sandbox-demo');
    expect(run([...present, '--seam', 'toString']).status).not.toBe(0);

    const absentWithSeam = run([
      '--dir',
      dir,
      '--expect',
      'absent',
      '--seam',
      'sandbox-demo',
      '--token',
      PROBE_TOKEN,
    ]);
    expect(absentWithSeam.status).not.toBe(0);
    expect(absentWithSeam.output).toContain('--seam only applies to --expect present');
  });
});
