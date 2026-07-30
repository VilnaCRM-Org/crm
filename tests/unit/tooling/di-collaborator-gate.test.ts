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
  ALLOWED_LIBRARY_SPECIFIER: string;
  PROJECT_SPECIFIER: string;
  RESTRICTED_LIBRARY_ADAPTERS: ExemptFile[];
  RUNTIME_IMPORT_SHAPES: string[];
  allowedTargetPaths: () => string[];
  allowedTargetSpecifier: () => string;
  collaboratorSelectors: () => Array<{ selector: string; message: string }>;
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
const allowedLibrary = new RegExp(policy.ALLOWED_LIBRARY_SPECIFIER);

const isForbiddenSpecifier = (specifier: string): boolean =>
  projectSpecifier.test(specifier)
    ? !allowedTargetSpecifier.test(specifier)
    : !allowedLibrary.test(specifier);

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
    expect(config).toContain('diCollaboratorPolicy.collaboratorSelectors()');
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

  it('keeps the scope disjoint from the component-side rule (#128) — no .tsx is gated', () => {
    const components = walk('src').filter((file) => file.endsWith('.tsx'));

    expect(components.length).toBeGreaterThan(0);
    expect(components.filter(inScope)).toEqual([]);
  });

  // ESLint only ever sees `.ts` (its `files` globs say so), so dependency-cruiser needs an
  // explicit `.tsx` exclusion or a component placed in a gated directory would be flagged by
  // BOTH this rule and the #128 component rule — the double-flag the policy promises not to do.
  it('excludes .tsx on the dependency-cruiser layer too, not just by convention', () => {
    const hypothetical = 'src/services/observability/hypothetical-widget.tsx';

    expect(matchesAny(policy.LOGIC_SOURCE_PATHS, hypothetical)).toBe(true);
    expect(inScope(hypothetical)).toBe(false);
    expect(policy.LOGIC_SOURCE_GLOBS.every((glob) => glob.endsWith('.ts'))).toBe(true);
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
    // UI libraries have no business inside a logic class — they belong to the `.tsx`
    // components and hooks that this scope deliberately excludes.
    'react',
    '@mui/material',
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
  ];

  it.each(forbidden)('rejects the value import %s', (specifier) => {
    expect(isForbiddenSpecifier(specifier)).toBe(true);
  });

  it.each(allowed)('accepts the value import %s', (specifier) => {
    expect(isForbiddenSpecifier(specifier)).toBe(false);
  });

  it('accepts every declared library and nothing else', () => {
    policy.ALLOWED_LIBRARIES.forEach((library) => {
      expect(isForbiddenSpecifier(library)).toBe(false);
      expect(isForbiddenSpecifier(`${library}/sub/path`)).toBe(false);
    });

    // The third-party half is an allowlist, not a denylist: an unnamed package is rejected by
    // default, so a future behavioral dependency cannot slip in without a policy edit.
    expect(isForbiddenSpecifier('dayjs')).toBe(true);
    expect(isForbiddenSpecifier('lodash')).toBe(true);
    expect(isForbiddenSpecifier('tsyringe-extra')).toBe(true);
  });
});

describe('DI collaborator gate — allowlisted barrels expose data only (issue #130)', () => {
  // The gate lets a logic class value-import a module/feature barrel because issue #107 makes the
  // barrel the only legal way across the boundary. That is only safe while the barrel's VALUE
  // surface stays data — a barrel that re-exported an injectable implementation would launder it
  // past the gate. This pins the invariant the honest-limitation section relies on.
  const barrelPaths = ['src/modules/user/index.ts', 'src/modules/user/features/auth/index.ts'];

  // Collapse the barrel to one statement per line first: a multi-line
  // `export {\n  A,\n} from './x'` would otherwise be invisible to a line-oriented scan and
  // silently pass the purity assertion.
  const valueReExports = (barrel: string): string[] =>
    readFile(barrel)
      .replace(/\s+/g, ' ')
      .split(';')
      .map((statement) => statement.trim())
      .filter(
        (statement) => statement.startsWith('export ') && !statement.startsWith('export type ')
      )
      .map((statement) => /from '([^']+)'/.exec(statement)?.[1] ?? '')
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

describe('DI collaborator gate — the real ESLint selectors compile and match (issue #130)', () => {
  // The assertions above validate policy DATA. They would still pass if a selector string were
  // syntactically invalid or silently stopped matching, because they re-derive the semantics in
  // plain `RegExp` instead of running esquery. This block feeds the EXACT selector strings
  // `eslint.config.mjs` installs through a real `Linter`, so a selector regression fails here
  // rather than only surfacing when `make lint-eslint` runs in CI.
  const { Linter } = require('eslint') as typeof import('eslint');
  const tsParser = require('@typescript-eslint/parser') as unknown;

  const selectors = policy.collaboratorSelectors();

  const lint = (code: string): number[] => {
    const messages = new Linter({ configType: 'flat' }).verify(code, {
      languageOptions: {
        parser: tsParser as never,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: { 'no-restricted-syntax': ['error', ...selectors] },
    });

    return messages.map((message) => message.line);
  };

  it('installs both selectors', () => {
    expect(selectors).toHaveLength(2);
    selectors.forEach((entry) => {
      expect(entry.selector).toContain('ImportDeclaration');
      expect(entry.message).toContain('issue #130');
    });
  });

  it('encodes every slash so the esquery attribute regex cannot terminate early', () => {
    selectors.forEach((entry) => {
      const attributeRegexes = entry.selector.match(/\[source\.value=\/(.*?)\/\]/g) ?? [];

      expect(attributeRegexes.length).toBeGreaterThan(0);
      attributeRegexes.forEach((attribute) => {
        expect(attribute.slice('[source.value=/'.length, -'/]'.length)).not.toContain('/');
      });
    });
  });

  it('parses and runs against real source without throwing', () => {
    expect(() => lint("import { injectable } from 'tsyringe';\n")).not.toThrow();
  });

  it('rejects a value import of a project collaborator', () => {
    expect(
      lint("import HttpErrorGuard from '@/services/https-client/http-error-guard';\n")
    ).toEqual([1]);
    expect(lint("import Sibling from './api-status-error-factory';\n")).toEqual([1]);
  });

  it('accepts the contract and data modules on the allowlist', () => {
    const allowlisted = [
      "import API_ENDPOINTS from '@/config/api-config';",
      "import HTTP_TOKENS from './tokens';",
      "import BaseAPI from './base-api';",
      "import CREATE_USER from './create-user-mutation';",
      "import { LoginResponseSchema } from '@auth/utils/response-schemas';",
      "import { ApiError } from '@/modules/user/lib/api-errors';",
      "import { HttpError } from '@/services/https-client/http-error';",
    ].join('\n');

    expect(lint(`${allowlisted}\n`)).toEqual([]);
  });

  it('accepts type-only imports in both spellings, and rejects a mixed one', () => {
    expect(lint("import type Guard from '@/services/https-client/http-error-guard';\n")).toEqual(
      []
    );
    // Inline-type specifiers are erased by the compiler, so they are not collaborator edges —
    // rejecting them would put this layer at odds with dependency-cruiser's `type-only` class.
    expect(lint("import { type UiError } from '@/services/error';\n")).toEqual([]);
    expect(lint("import { type UiError, ErrorHandler } from '@/services/error';\n")).toEqual([1]);
  });

  it('rejects a value import of a library outside the allowlist, and side-effect imports', () => {
    expect(lint("import dayjs from 'dayjs';\n")).toEqual([1]);
    expect(lint("import * as lodash from 'lodash';\n")).toEqual([1]);
    expect(lint("import { z } from 'zod';\n")).toEqual([1]);
    expect(lint("import '@/services/observability/observability-core';\n")).toEqual([1]);
  });

  it('accepts the DI mechanism and pure leaf utilities', () => {
    expect(lint("import { inject, injectable } from 'tsyringe';\n")).toEqual([]);
    expect(lint("import 'reflect-metadata';\n")).toEqual([]);
    expect(lint("import { v4 as uuidv4 } from 'uuid';\n")).toEqual([]);
    expect(lint("import type { ZodType } from 'zod';\n")).toEqual([]);
  });
});
