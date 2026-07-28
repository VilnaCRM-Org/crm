import { execFileSync } from 'node:child_process';
import path from 'node:path';

const PROBE_SCRIPT = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'scripts',
  'ci',
  'probe-di-component-gates.mjs'
);

const report = JSON.parse(
  execFileSync(process.execPath, [PROBE_SCRIPT], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
) as {
  eslint: Record<string, string[]>;
  depcruise: Record<string, string[]>;
};

describe('component DI gate (issue #128)', () => {
  it('ESLint fails a component that news a behavioral class', () => {
    expect(report.eslint.component).toHaveLength(1);
    expect(report.eslint.component?.[0]).toContain('useService(TOKENS.X)');
  });

  it.each([
    ['built-in constructors', 'builtins'],
    ['the auth render path', 'authCarveOut'],
    ['the route shell', 'routeShellCarveOut'],
    ['story files', 'story'],
    ['test files', 'test'],
    ['hooks, which stay a review-gate concern', 'hook'],
  ])('ESLint exempts %s', (_label, fixture) => {
    expect(report.eslint[fixture]).toEqual([]);
  });

  it('dependency-cruiser fails a component value-importing a service', () => {
    expect(report.depcruise.valueImport).toEqual(['components-no-direct-injectable-import']);
  });

  it('dependency-cruiser allows the same import as a type-only import', () => {
    expect(report.depcruise.typeImport).toEqual([]);
  });

  it('dependency-cruiser leaves the auth carve-out to no-feature-ui-to-services', () => {
    expect(report.depcruise.authCarveOut).toEqual(['no-feature-ui-to-services']);
  });

  it('dependency-cruiser keeps the DI bridge off the container-free paint path', () => {
    expect(report.depcruise.authImportsBridge).toEqual(['no-paint-path-import-di-bridge']);
  });
});
