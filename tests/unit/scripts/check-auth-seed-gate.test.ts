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

    expect(run(['--dir', seeded, '--expect', 'present', '--token', PROBE_TOKEN]).status).toBe(0);
    expect(run(['--dir', clean, '--expect', 'present', '--token', PROBE_TOKEN]).status).toBe(1);
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

  it('rejects a malformed invocation instead of silently scanning nothing', () => {
    const dir = makeBundle({ 'static/js/index.js': 'console.log("hello")' });

    expect(run(['--expect', 'absent', '--token', PROBE_TOKEN]).status).not.toBe(0);
    expect(run(['--dir', dir, '--token', PROBE_TOKEN]).status).not.toBe(0);
    expect(run(['--dir', dir, '--expect', 'maybe', '--token', PROBE_TOKEN]).status).not.toBe(0);
    expect(run(['--dir', dir, '--expect', 'absent']).status).not.toBe(0);
    expect(run(['--dir', dir, '--expect', 'absent', '--token', '  ']).status).not.toBe(0);
  });
});
