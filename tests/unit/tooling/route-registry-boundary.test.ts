type ForbiddenRule = {
  name: string;
  severity: string;
  from: { path: string };
  to: { path: string; pathNot: string[] };
};

type DepcruiseConfig = { forbidden: ForbiddenRule[] };

const depcruise = require('../../../.dependency-cruiser.js') as DepcruiseConfig;

const rule = depcruise.forbidden.find(
  (candidate) => candidate.name === 'no-routes-import-feature-internals'
) as ForbiddenRule;

const matchesAny = (patterns: string[], value: string): boolean =>
  patterns.some((pattern) => new RegExp(pattern).test(value));

// A module owns its routes; the shell mounts a feature only through its
// routes/index contract barrel + the guard. The deep page path is the
// deliberate violation the rule must reject (issue #105).
const barrel = 'src/modules/user/features/auth/routes/index.ts';
const deepPage = 'src/modules/user/features/auth/routes/sign-up/index.tsx';
const guard = 'src/modules/user/features/auth/components/protected-route/index.tsx';

describe('route registry dependency-cruiser boundary (issue #105)', () => {
  it('errors when the routes shell reaches into a feature internal', () => {
    expect(rule).toBeDefined();
    expect(rule.severity).toBe('error');
    expect(new RegExp(rule.from.path).test('src/routes/registry.ts')).toBe(true);
    expect(new RegExp(rule.to.path).test(deepPage)).toBe(true);
  });

  it('allows only the module-owned route contract barrel and the routing guard', () => {
    expect(matchesAny(rule.to.pathNot, barrel)).toBe(true);
    expect(matchesAny(rule.to.pathNot, guard)).toBe(true);
  });

  it('forbids the shell from deep-importing a feature page (bypassing the contract)', () => {
    expect(matchesAny(rule.to.pathNot, deepPage)).toBe(false);
  });
});
