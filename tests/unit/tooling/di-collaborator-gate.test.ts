// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

type AllowedTarget = {
  id: string;
  reason: string;
  path: string | string[];
  specifier: string;
  sample: string;
  sampleSpecifier: string;
};

type ExemptFile = { path: string; reason: string };

type ExemptPattern = { id: string; reason: string; globs: string[]; paths: string[] };

type DiCollaboratorPolicy = {
  ALLOWED_LIBRARIES: string[];
  ALLOWED_TARGETS: AllowedTarget[];
  EXEMPT_PATTERNS: ExemptPattern[];
  EXEMPT_RENDER_PATH_FILES: ExemptFile[];
  LOGIC_SOURCE_GLOBS: string[];
  LOGIC_SOURCE_PATHS: string[];
  PROJECT_SPECIFIER: string;
  RESTRICTED_LIBRARY_ADAPTERS: ExemptFile[];
  RESTRICTED_LIBRARY_SPECIFIER: string;
  allowedTargetPaths: () => string[];
  allowedTargetSpecifier: () => string;
  exemptGlobs: () => string[];
  exemptPaths: () => string[];
};

type ForbiddenRule = {
  name: string;
  severity: string;
  from: { path: string | string[]; pathNot?: string[] };
  to: { path: string; pathNot?: string[]; dependencyTypesNot?: string[] };
};

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const policy = require('../../../config/di-collaborator-policy.js') as DiCollaboratorPolicy;
const depcruise = require('../../../.dependency-cruiser.js') as { forbidden: ForbiddenRule[] };

const rule = depcruise.forbidden.find(
  (candidate) => candidate.name === 'injectable-classes-no-value-imports'
) as ForbiddenRule;

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const exists = (relativePath: string): boolean =>
  fs.existsSync(path.join(projectRoot, relativePath));

const matchesAny = (patterns: string[], value: string): boolean =>
  patterns.some((pattern) => new RegExp(pattern).test(value));

const walk = (relativeDir: string): string[] => {
  const absolute = path.join(projectRoot, relativeDir);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = `${relativeDir}/${entry.name}`;
    return entry.isDirectory() ? walk(child) : [child];
  });
};

const inScope = (file: string): boolean =>
  matchesAny(policy.LOGIC_SOURCE_PATHS, file) && !matchesAny(policy.exemptPaths(), file);

const sourceFiles = walk('src').filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts'));

const injectableFiles = sourceFiles.filter((file) => readFile(file).includes('@injectable()'));

const allowedTargetSpecifier = new RegExp(policy.allowedTargetSpecifier());
const projectSpecifier = new RegExp(policy.PROJECT_SPECIFIER);
const restrictedLibrary = new RegExp(policy.RESTRICTED_LIBRARY_SPECIFIER);

const isForbiddenSpecifier = (specifier: string): boolean =>
  (projectSpecifier.test(specifier) && !allowedTargetSpecifier.test(specifier)) ||
  restrictedLibrary.test(specifier);

describe('DI collaborator gate — one policy, two layers (issue #130)', () => {
  it('wires the dependency-cruiser rule straight from the shared policy', () => {
    expect(rule).toBeDefined();
    expect(rule.severity).toBe('error');
    expect(rule.from.path).toEqual(policy.LOGIC_SOURCE_PATHS);
    expect(rule.from.pathNot).toEqual(policy.exemptPaths());
    expect(rule.to.pathNot).toEqual(policy.allowedTargetPaths());
    expect(rule.to.dependencyTypesNot).toContain('type-only');
  });

  it('wires the ESLint gate straight from the same shared policy', () => {
    const config = readFile('eslint.config.mjs');

    expect(config).toContain(
      "import diCollaboratorPolicy from './config/di-collaborator-policy.js'"
    );
    expect(config).toContain('diCollaboratorPolicy.LOGIC_SOURCE_GLOBS');
    expect(config).toContain('diCollaboratorPolicy.exemptGlobs()');
    expect(config).toContain('diCollaboratorPolicy.allowedTargetSpecifier()');
    expect(config).toContain('diCollaboratorPolicy.RESTRICTED_LIBRARY_SPECIFIER');
    expect(config).toContain('noUninjectedCollaboratorSelectors');
  });

  it('runs both layers under `make lint`', () => {
    const lintTarget = readFile('Makefile')
      .split('\n')
      .find((line) => line.startsWith('lint:'));

    expect(lintTarget).toContain('lint-eslint');
    expect(lintTarget).toContain('lint-deps');
  });
});

describe('DI collaborator gate — scope covers every injectable class (issue #130)', () => {
  it('finds injectable classes to gate', () => {
    expect(injectableFiles.length).toBeGreaterThan(0);
  });

  it('leaves no `@injectable()` class outside the enforced scope', () => {
    expect(injectableFiles.filter((file) => !inScope(file))).toEqual([]);
  });

  it('never lets a carve-out hide an `@injectable()` class', () => {
    const hidden = policy.EXEMPT_RENDER_PATH_FILES.filter((file) =>
      readFile(file.path).includes('@injectable()')
    );

    expect(hidden).toEqual([]);
  });

  it('keeps the scope disjoint from the component-side rule (#128) — no .tsx is matched', () => {
    const components = walk('src').filter((file) => file.endsWith('.tsx'));

    expect(components.length).toBeGreaterThan(0);
    expect(components.filter((file) => matchesAny(policy.LOGIC_SOURCE_PATHS, file))).toEqual([]);
  });
});

describe('DI collaborator gate — the policy lists stay honest (issue #130)', () => {
  it.each(policy.EXEMPT_RENDER_PATH_FILES.map((file) => [file.path, file.reason]))(
    'render-path carve-out %s still exists and states a reason',
    (relativePath, reason) => {
      expect(exists(relativePath)).toBe(true);
      expect(reason.length).toBeGreaterThan(10);
    }
  );

  it.each(policy.RESTRICTED_LIBRARY_ADAPTERS.map((adapter) => [adapter.path]))(
    'restricted-library adapter %s still exists',
    (relativePath) => {
      expect(exists(relativePath)).toBe(true);
    }
  );

  it.each(policy.ALLOWED_TARGETS.map((target) => target.id))(
    'allowlist entry %s still matches a real file on both layers',
    (id) => {
      const entry = policy.ALLOWED_TARGETS.find((target) => target.id === id) as AllowedTarget;
      const paths = Array.isArray(entry.path) ? entry.path : [entry.path];

      expect(exists(entry.sample)).toBe(true);
      expect(matchesAny(paths, entry.sample)).toBe(true);
      expect(matchesAny([entry.specifier], entry.sampleSpecifier)).toBe(true);
      expect(entry.reason.length).toBeGreaterThan(10);
    }
  );

  it('keeps every structural carve-out expressed on both layers', () => {
    policy.EXEMPT_PATTERNS.forEach((pattern) => {
      expect(pattern.globs.length).toBeGreaterThan(0);
      expect(pattern.paths.length).toBeGreaterThan(0);
    });
  });
});

describe('DI collaborator gate — the ESLint specifier policy behaves (issue #130)', () => {
  // Real collaborators the gate must reject, plus near-miss names that a loose allowlist
  // regex would wrongly let through (`base-api-client-impl`, `tokens-registry`,
  // `evil-mutation`, `error-codes` outside its home). An allowlist entry that starts
  // matching one of these is a hole, not a convenience.
  const forbidden = [
    './api-status-error-factory',
    '../repositories/login-api',
    '@/services/https-client/http-error-guard',
    '@/services/observability/observability-core',
    '@auth/utils/auth-request-errors',
    '@auth/stores/auth-var',
    '@auth/repositories',
    '@auth/stores',
    '@/services/error',
    '@/modules/user/store/login-response-mapper',
    './tokens-registry',
    '@/services/foo/tokens-thing',
    './base',
    './base-repository',
    '../base-api-client-impl',
    '@/utils/base-api',
    './mutation',
    './create-user-mutation-runner',
    '@/services/evil-mutation',
    '@auth/utils/sneaky-mutation',
    '@/services/evil/http-error',
    '@/services/https-client/response-messages-builder',
    '@/utils/error-codes',
    '@auth/stores/response-schemas',
    '@/modules/user/lib/api-errors-extra',
    '@/config/api-config-builder',
    '@/config/environment',
    '@/routes/route-paths-extra',
    'zod',
    'zod/v4',
    '@apollo/client',
    '@apollo/client/link/context',
    '@sentry/react',
    '@sentry/browser',
    'web-vitals',
    'web-vitals/attribution',
  ];

  const allowed = [
    '@/config/api-config',
    '@/config/env',
    '@/config/env/raw-env',
    '@/routes/route-paths',
    '@/modules/user/config/tokens',
    './tokens',
    '@/modules/user/lib/api-errors',
    '@/modules/user/lib/api-errors/api-error',
    './http-error',
    '@/services/https-client/http-error',
    './response-messages',
    '@/services/https-client/response-messages',
    '@/services/error/error-codes',
    '@auth/utils/response-schemas',
    './create-user-mutation',
    './base-api',
    '@/modules/user',
    '@/modules/user/features/auth',
    '@auth',
    'tsyringe',
    'reflect-metadata',
    'uuid',
    'react',
    '@mui/material',
  ];

  it.each(forbidden)('rejects the value import %s', (specifier) => {
    expect(isForbiddenSpecifier(specifier)).toBe(true);
  });

  it.each(allowed)('accepts the value import %s', (specifier) => {
    expect(isForbiddenSpecifier(specifier)).toBe(false);
  });

  it('keeps every allowlisted library outside the restricted set', () => {
    policy.ALLOWED_LIBRARIES.forEach((library) => {
      expect(restrictedLibrary.test(library)).toBe(false);
    });
  });
});

describe('DI collaborator gate — allowlisted barrels expose data only (issue #130)', () => {
  // The gate lets a logic class value-import a module/feature barrel because issue #107 makes the
  // barrel the only legal way across the boundary. That is only safe while the barrel's VALUE
  // surface stays data — a barrel that re-exported an injectable implementation would launder it
  // past the gate. This pins the invariant the honest-limitation section relies on.
  const barrelPaths = ['src/modules/user/index.ts', 'src/modules/user/features/auth/index.ts'];

  const valueReExports = (barrel: string): string[] =>
    readFile(barrel)
      .split('\n')
      .filter((line) => line.startsWith('export ') && !line.startsWith('export type '))
      .map((line) => /from '([^']+)'/.exec(line)?.[1] ?? '')
      .filter(Boolean);

  it.each(barrelPaths)('%s re-exports values only from allowlisted contract modules', (barrel) => {
    const sources = valueReExports(barrel);

    expect(sources.length).toBeGreaterThan(0);
    sources.forEach((source) => {
      expect(allowedTargetSpecifier.test(source)).toBe(true);
    });
  });

  it('covers every barrel the allowlist opens up', () => {
    const allowlisted = walk('src').filter(
      (file) =>
        /^src\/modules\/[^/]+\/index\.ts$/.test(file) ||
        /^src\/modules\/[^/]+\/features\/[^/]+\/index\.ts$/.test(file)
    );

    expect(allowlisted.sort()).toEqual([...barrelPaths].sort());
  });
});
