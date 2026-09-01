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
    ['the route composer', 'routeComposerCarveOut'],
    ['the route mapper', 'routeMapperCarveOut'],
    ['the permission branch builder', 'permissionBranchBuilderCarveOut'],
    ['the app entrypoint', 'appEntrypointCarveOut'],
    ['the root error boundary', 'rootErrorBoundaryCarveOut'],
    ['story files', 'story'],
    ['test files', 'test'],
    ['hooks, which stay a review-gate concern', 'hook'],
  ])('ESLint exempts %s', (_label, fixture) => {
    expect(report.eslint[fixture]).toEqual([]);
  });

  it('ESLint still gates a functional error-boundary descendant', () => {
    expect(report.eslint.errorBoundaryDescendant).toHaveLength(1);
  });

  it('ESLint still gates a non-shell file under src/routes', () => {
    expect(report.eslint.routeShellOtherFile).toHaveLength(1);
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

  it('dependency-cruiser catches the bridge reached through an intermediate component', () => {
    expect(report.depcruise.authReachesBridgeIndirectly).toEqual([
      'no-paint-path-import-di-bridge',
    ]);
  });

  it('dependency-cruiser keeps the bridge out of the eagerly evaluated app shell', () => {
    expect(report.depcruise.eagerShellImportsBridge).toEqual(['no-eager-shell-import-di-bridge']);
  });

  it('dependency-cruiser allows a lazily routed page to use the bridge', () => {
    expect(report.depcruise.lazyRouteReachesBridge).toEqual([]);
  });

  // The ESLint half probes each route-shell carve-out file above; this is the other half, so
  // CLAUDE.md's "both gates read the same carve-out list" is pinned on the newest entry on it
  // (`permission-branch-builder`, issue #114) rather than asserted of one gate only.
  it('dependency-cruiser exempts the route-shell singletons but not the rest of src/routes', () => {
    expect(report.depcruise.routeShellCarveOut).toEqual([]);
    expect(report.depcruise.routeShellOtherFile).toEqual([
      'components-no-direct-injectable-import',
    ]);
  });

  it('dependency-cruiser exempts the root error boundary but not its descendants', () => {
    expect(report.depcruise.rootErrorBoundaryCarveOut).toEqual([]);
    expect(report.depcruise.errorBoundaryDescendant).toEqual([
      'components-no-direct-injectable-import',
    ]);
  });
});
