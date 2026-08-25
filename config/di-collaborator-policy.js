/**
 * Issue #130 — "inside a class, only call behavioral collaborators obtained through DI".
 *
 * This module is the SINGLE SOURCE OF TRUTH for the gate. It is consumed by both
 * enforcement layers so they can never drift apart:
 *
 *   - `eslint.config.mjs`      → the import-specifier layer (`no-restricted-syntax`),
 *                                which reports on the exact `import` line.
 *   - `.dependency-cruiser.js` → the module-graph layer (`injectable-classes-no-value-imports`),
 *                                which resolves aliases/barrels and distinguishes `type-only`
 *                                dependencies from value dependencies.
 *
 * ESLint sees import *specifiers* (`'./api-status-error-factory'`, `'@auth/utils/...'`) and
 * dependency-cruiser sees resolved *paths* (`src/modules/.../api-status-error-factory.ts`), so
 * each policy entry carries both forms side by side. The rule-rot guard
 * `tests/unit/tooling/di-collaborator-gate.test.ts` fails the build when an entry goes stale,
 * when the two layers disagree, or when a carve-out starts hiding an `@injectable()` class.
 *
 * Companion gate: `.tsx` component-side consumption is governed by issue #128
 * (`components-no-direct-injectable-import`). The two scopes are disjoint (`.ts` here,
 * `.tsx` there), so no edge is flagged twice.
 */

/** Escapes a literal file path for embedding in a dependency-cruiser regex. */
const toExactPathRegex = (relativePath) =>
  `^${relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`;

/**
 * Enforced scope: the non-React logic directories that hold `@injectable()` classes.
 * Mirrors the dependency-cruiser `from.path` below; `src/components/**`, `src/styles/**`,
 * `src/routes/**`, `src/providers/**`, and `src/config/**` are deliberately out of scope —
 * they hold presentation, wiring, and configuration rather than injectable collaborators.
 */
const LOGIC_SOURCE_GLOBS = [
  'src/services/**/*.ts',
  'src/utils/**/*.ts',
  'src/modules/*/store/**/*.ts',
  'src/modules/*/features/*/repositories/**/*.ts',
  'src/modules/*/features/*/stores/**/*.ts',
  'src/modules/*/features/*/utils/**/*.ts',
];

const LOGIC_SOURCE_PATHS = [
  '^src/services/',
  '^src/utils/',
  '^src/modules/[^/]+/store/',
  '^src/modules/[^/]+/features/[^/]+/(?:repositories|stores|utils)/',
];

/**
 * Structural carve-outs that apply by file *kind* rather than by name.
 * Each entry supplies the ESLint glob and the dependency-cruiser regex for the same set.
 */
const EXEMPT_PATTERNS = [
  {
    id: 'react-components',
    reason:
      'React components are `.tsx` and belong to the companion component gate (issue #128). ' +
      "ESLint's `files` globs are `.ts`-only, so dependency-cruiser needs this explicitly or a " +
      '`.tsx` placed in a gated directory would be flagged by both rules.',
    globs: ['src/**/*.tsx'],
    paths: ['[.]tsx$'],
  },
  {
    id: 'tests-and-stories',
    reason: 'Tests and stories are consumers, not collaborators — they may construct anything.',
    globs: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*', '**/*.d.ts'],
    paths: ['[.](?:test|spec|stories)[.]tsx?$', '[.]d[.]ts$'],
  },
  {
    id: 'type-only-files',
    reason: 'Type-only files (issue #88) carry no runtime imports at all.',
    globs: ['src/**/types.ts', 'src/**/types/**/*.ts'],
    paths: ['/types[.]ts$', '/types/'],
  },
  {
    id: 'react-hooks',
    reason: 'Hooks are React functions (exempt as in issue #100); they bridge UI to state.',
    globs: ['src/**/use-*.ts'],
    paths: ['/use-[a-z0-9-]+[.]ts$'],
  },
  {
    id: 'composition-roots',
    reason:
      'Composition roots MUST value-import every concrete class in order to register it — ' +
      'that is their job (issue #109).',
    globs: ['src/**/di.ts', 'src/config/dependency-injection-config.ts'],
    paths: ['/di[.]ts$', '^src/config/dependency-injection-config[.]ts$'],
  },
  {
    id: 'token-modules',
    reason: 'Token modules declare frozen Symbol maps and import nothing behavioral.',
    globs: ['src/**/tokens.ts'],
    paths: ['/tokens[.]ts$'],
  },
  {
    id: 'public-barrels',
    reason:
      'An index barrel is a pure re-export surface (issue #107). Re-export laundering is the ' +
      'documented residual of this gate, bounded by the barrel-purity assertion in the ' +
      'di-collaborator-gate test.',
    globs: ['src/**/index.ts'],
    paths: ['/index[.]ts$'],
  },
];

/**
 * Container-free render-path singletons and their composer chains.
 *
 * These are NOT container-resolved classes: they are module singletons (`export default new X()`)
 * that the auth page mounts directly, and they compose their siblings by value import on purpose.
 * The DI container must never be eager-imported into the auth paint path (mobile Lighthouse gate),
 * so these stay off the container and are exempted by explicit path — not inferred.
 *
 * Adding a new container-free render-path singleton means adding it here.
 */
const EXEMPT_RENDER_PATH_FILES = [
  {
    path: 'src/services/observability/observability-core.ts',
    reason: 'Container-free observability core; composes the sentry/web-vitals/correlation leaves.',
  },
  {
    path: 'src/services/observability/correlation-id-provider.ts',
    reason: 'Container-free correlation-id leaf consumed by the paint path.',
  },
  {
    path: 'src/services/observability/sentry-client.ts',
    reason: 'Container-free Sentry boundary; DSN-gated dynamic import of @sentry/react.',
  },
  {
    path: 'src/services/observability/sentry-config.ts',
    reason: 'Container-free Sentry configuration leaf.',
  },
  {
    path: 'src/services/observability/pii-scrubber.ts',
    reason: 'Container-free PII scrubbing leaf used by the Sentry beforeSend hook.',
  },
  {
    path: 'src/services/observability/web-vitals-reporter.ts',
    reason: 'Container-free web-vitals leaf; dynamic import of web-vitals.',
  },
  {
    path: 'src/services/locale-formatter/locale-formatter-core.ts',
    reason:
      'Container-free Intl formatting core; `src/i18n.js` binds its language source at module ' +
      'load, so it composes the IntlFormatterCache leaf off the container (issue #155).',
  },
  {
    path: 'src/utils/url-builder.ts',
    reason: 'Container-free URL builder consumed by api-config at module load.',
  },
  {
    path: 'src/modules/user/features/auth/stores/auth-var.ts',
    reason: 'Dependency-free reactive auth state; composes ReactiveVarFactory off the container.',
  },
  {
    path: 'src/modules/user/features/auth/stores/reactive-var.ts',
    reason: 'Container-free reactive-var factory used by auth-var.',
  },
  {
    path: 'src/modules/user/features/auth/stores/reactive-var-state.ts',
    reason: 'Container-free reactive-var state leaf.',
  },
  {
    path: 'src/modules/user/features/auth/stores/auth-store-selectors.ts',
    reason: 'Container-free selector singleton consumed directly by auth components.',
  },
  {
    path: 'src/modules/user/features/auth/utils/response-schemas.ts',
    reason: 'The zod response-contract module itself; declares schemas consumed as data.',
  },
  {
    path: 'src/modules/user/features/auth/utils/map-registration-error.ts',
    reason: 'Container-free registration-error mapper singleton on the render path.',
  },
  {
    path: 'src/modules/user/features/auth/utils/lazy-module-loader.ts',
    reason: 'Container-free lazy-module loader used by the render path.',
  },
  {
    path: 'src/modules/user/features/auth/utils/load-registration-notification.ts',
    reason: 'Container-free lazy loader composing LazyModuleLoader off the container.',
  },
  {
    path: 'src/modules/user/features/auth/utils/registration-handlers-factory.ts',
    reason: 'Container-free handlers factory consumed by the registration hook.',
  },
  {
    path: 'src/modules/user/features/auth/utils/auth-error-reporter.ts',
    reason: 'Container-free reporter used by the auth error boundary before DI is loaded.',
  },
];

// A relative specifier carries no directory information, so each entry pins the module NAME on
// the relative branch and the module's real HOME on the alias branch. dependency-cruiser's `path`
// regex below is the authoritative directory check for both.
const RELATIVE = '^[.][.]?/(?:[^/]+/)*';
const REPOSITORIES = '^@auth/repositories/|^@/modules/[^/]+/features/[^/]+/repositories/';
const FEATURE_UTILS = '^@auth/utils/|^@/modules/[^/]+/features/[^/]+/utils/';

/**
 * Import targets a logic class MAY value-import: contract and data modules, not behavior.
 *
 * `path` is matched by dependency-cruiser against the resolved module path; `specifier` is
 * matched by ESLint against the literal import string (alias or relative). `sample` is a real
 * file the entry must keep matching, so a rename cannot silently widen the allowlist.
 */
const ALLOWED_TARGETS = [
  {
    id: 'di-tokens',
    reason: 'DI token modules are frozen Symbol maps — data, and the injection mechanism itself.',
    path: '/tokens[.]ts$',
    specifier: '(?:^|/)tokens$',
    sample: 'src/services/https-client/tokens.ts',
    sampleSpecifier: './tokens',
  },
  {
    id: 'api-endpoint-config',
    reason: 'API_ENDPOINTS is a frozen endpoint map — configuration data with no sensible token.',
    path: '^src/config/api-config[.]ts$',
    specifier: '^@/config/api-config$',
    sample: 'src/config/api-config.ts',
    sampleSpecifier: '@/config/api-config',
  },
  {
    id: 'typed-env',
    reason: 'The validated environment (issue #112) is frozen configuration data.',
    path: '^src/config/env/',
    specifier: '^@/config/env(?:/.*)?$',
    sample: 'src/config/env/env.ts',
    sampleSpecifier: '@/config/env',
  },
  {
    id: 'route-paths',
    reason: 'ROUTE_PATHS is a frozen route constant map.',
    path: '^src/routes/route-paths[.]ts$',
    specifier: '^@/routes/route-paths$',
    sample: 'src/routes/route-paths.ts',
    sampleSpecifier: '@/routes/route-paths',
  },
  {
    id: 'domain-error-classes',
    reason:
      'Domain error classes and their code map are data carriers that are thrown and matched ' +
      'with `instanceof` — substituting them through DI would defeat the type guard.',
    path: '^src/modules/[^/]+/lib/api-errors/',
    specifier: '(?:^@/modules/[^/]+|\\.\\.?)/lib/api-errors(?:/.*)?$',
    sample: 'src/modules/user/lib/api-errors/api-error.ts',
    sampleSpecifier: '@/modules/user/lib/api-errors',
  },
  {
    id: 'transport-error-class',
    reason: 'HttpError is a transport error class matched with `instanceof`.',
    path: '^src/services/https-client/http-error[.]ts$',
    specifier: '(?:^[.][.]?/(?:[^/]+/)*|^@/services/https-client/)http-error$',
    sample: 'src/services/https-client/http-error.ts',
    sampleSpecifier: './http-error',
  },
  {
    id: 'message-constants',
    reason: 'Response and error message/code maps are frozen constant data.',
    path: [
      '^src/services/https-client/response-messages[.]ts$',
      '^src/services/error/error-codes[.]ts$',
    ],
    specifier:
      '(?:^[.][.]?/(?:[^/]+/)*|^@/services/(?:https-client|error)/)' +
      '(?:response-messages|error-codes)$',
    sample: 'src/services/https-client/response-messages.ts',
    sampleSpecifier: '@/services/https-client/response-messages',
  },
  {
    id: 'response-contracts',
    reason:
      'A zod schema is a declarative response contract — the runtime twin of a type. Classes ' +
      'receive it as data (`{ schema }`); they never inject a schema.',
    path: '^src/modules/[^/]+/features/[^/]+/utils/response-schemas[.]ts$',
    specifier: `(?:${RELATIVE}|${FEATURE_UTILS})response-schemas$`,
    sample: 'src/modules/user/features/auth/utils/response-schemas.ts',
    sampleSpecifier: '@auth/utils/response-schemas',
  },
  {
    id: 'graphql-documents',
    reason: 'A generated GraphQL document seam is a static query artifact, not behavior.',
    path: '^src/modules/[^/]+/features/[^/]+/repositories/[a-z0-9-]+-mutation[.]ts$',
    specifier: `(?:${RELATIVE}|${REPOSITORIES})[a-z0-9-]+-mutation$`,
    sample: 'src/modules/user/features/auth/repositories/create-user-mutation.ts',
    sampleSpecifier: './create-user-mutation',
  },
  {
    id: 'base-classes',
    reason:
      'Inheritance cannot be injected, so a base-class value import stays. TRADEOFF: this is the ' +
      'one place IoC is bypassed — keep base classes thin templates and prefer composition for ' +
      'behavior (review-gate concern).',
    path: '^src/modules/[^/]+/features/[^/]+/repositories/base-api[.]ts$',
    specifier: `(?:${RELATIVE}|${REPOSITORIES})base-api$`,
    sample: 'src/modules/user/features/auth/repositories/base-api.ts',
    sampleSpecifier: './base-api',
  },
  {
    id: 'public-barrels',
    reason:
      'Crossing a module/feature boundary is only legal through its index barrel (issue #107), ' +
      'and the two module/feature barrels expose data only (a domain error class and the zod ' +
      'response contracts). Infra barrels (@/services/*, @/utils/*) are deliberately NOT ' +
      'allowlisted — they re-export injectable implementations. The barrel-purity assertion in ' +
      'the gate test keeps the allowlisted barrels free of DI-registered implementations.',
    path: ['^src/modules/[^/]+/index[.]ts$', '^src/modules/[^/]+/features/[^/]+/index[.]ts$'],
    specifier: '^(?:@auth|@/modules/[^/]+(?:/features/[^/]+)?)$',
    sample: 'src/modules/user/index.ts',
    sampleSpecifier: '@/modules/user',
  },
  {
    id: 'type-only-files',
    reason: 'Type-only files carry no runtime payload (issue #88).',
    path: ['/types[.]ts$', '/types/', '[.]d[.]ts$'],
    specifier: '(?:^|/)types(?:/.*)?$',
    sample: 'src/services/types/observability/observability.ts',
    sampleSpecifier: '@/services/types/observability/observability',
  },
];

/**
 * Third-party policy — position (A) with a minimal explicit ALLOWLIST.
 *
 * Behavioral libraries are wrapped behind an `@injectable()` adapter plus a token
 * (Apollo → `ApolloLinkFactory` + `AUTH_TOKENS.ApolloClient`; Sentry/web-vitals → the
 * observability boundary; zod → the `response-schemas` contract modules). Only the DI
 * mechanism and pure leaf utilities may be consumed directly.
 *
 * This is deliberately an allowlist, not a denylist of known-behavioral packages: a denylist
 * only ever forbids the libraries someone thought to name, so the next behavioral dependency
 * would slip in unchallenged. Adding a library here is a reviewable decision.
 *
 * `import type` from any library stays allowed — the gate matches value imports only.
 */
const ALLOWED_LIBRARIES = ['tsyringe', 'reflect-metadata', 'uuid'];

const ALLOWED_LIBRARY_SPECIFIER = `^(?:${ALLOWED_LIBRARIES.join('|')})(?:/.*)?$`;

/** Files that ARE the sanctioned adapter over a behavioral library. */
const RESTRICTED_LIBRARY_ADAPTERS = [
  {
    path: 'src/services/observability/apollo-link-factory.ts',
    reason: 'The injectable adapter that builds the Apollo link chain — it must touch Apollo.',
  },
];

const PROJECT_SPECIFIER = '^(?:@/|@auth(?:$|/)|[.][.]?/)';

/**
 * An `ImportDeclaration` creates a RUNTIME edge only when it binds a value: a default or
 * namespace binding, a non-`type` named specifier, or no specifiers at all (a side-effect
 * import). `import type … from` and `import { type A, type B } from` are erased by the
 * compiler, so they are not collaborator edges and must not be flagged — that keeps the
 * ESLint layer agreeing with dependency-cruiser's `type-only` dependency classification.
 */
const RUNTIME_IMPORT_SHAPES = [
  ':has(ImportDefaultSpecifier)',
  ':has(ImportNamespaceSpecifier)',
  ":has(ImportSpecifier[importKind!='type'])",
  ':not(:has(ImportSpecifier))',
];

const runtimeImportSelector = () => `:matches(${RUNTIME_IMPORT_SHAPES.join(', ')})`;

/**
 * An esquery attribute regex is delimited by `/.../`, so a literal `/` inside the pattern would
 * terminate it early. Encode every slash as the `/` escape rather than `\/`: esquery's
 * handling of a backslash-escaped delimiter is not contractual (eslint/eslint#16555,
 * estools/esquery#68), and `/` also avoids CodeQL's incomplete-string-escaping finding
 * because it introduces no backslash that would itself need escaping.
 */
const esquerySource = (source) => source.replace(/\//g, '\\u002F');

const exemptGlobs = () => [
  ...EXEMPT_PATTERNS.flatMap((pattern) => pattern.globs),
  ...EXEMPT_RENDER_PATH_FILES.map((file) => file.path),
];

const exemptPaths = () => [
  ...EXEMPT_PATTERNS.flatMap((pattern) => pattern.paths),
  ...EXEMPT_RENDER_PATH_FILES.map((file) => toExactPathRegex(file.path)),
];

const allowedTargetPaths = () =>
  ALLOWED_TARGETS.flatMap((target) => (Array.isArray(target.path) ? target.path : [target.path]));

const allowedTargetSpecifier = () =>
  ALLOWED_TARGETS.map((target) => `(?:${target.specifier})`).join('|');

/**
 * The `no-restricted-syntax` entries the ESLint gate installs. Built here rather than in
 * `eslint.config.mjs` so `tests/unit/tooling/di-collaborator-gate.test.ts` can feed the EXACT
 * selector strings ESLint consumes through a real `Linter` — a selector that stops parsing or
 * stops matching then fails the test suite instead of only surfacing in CI.
 */
const collaboratorSelectors = () => {
  const runtimeImport = `ImportDeclaration[importKind!='type']${runtimeImportSelector()}`;
  const project = esquerySource(PROJECT_SPECIFIER);

  return [
    {
      selector:
        `${runtimeImport}[source.value=/${project}/]` +
        `:not([source.value=/${esquerySource(allowedTargetSpecifier())}/])`,
      message:
        'Value-importing a project module inside a logic class bypasses DI — inject the ' +
        'collaborator with @inject(TOKENS.X) from its module composition root, or use ' +
        '`import type` when the import is only an annotation (issue #130).',
    },
    {
      selector:
        `${runtimeImport}:not([source.value=/${project}/])` +
        `:not([source.value=/${esquerySource(ALLOWED_LIBRARY_SPECIFIER)}/])`,
      message:
        'Value-importing a third-party library inside a logic class bypasses DI — only ' +
        `${ALLOWED_LIBRARIES.join(', ')} may be consumed directly. Wrap the library behind an ` +
        '@injectable() adapter plus a token (Apollo via ApolloLinkFactory / ' +
        'AUTH_TOKENS.ApolloClient, Sentry and web-vitals via the observability boundary, zod ' +
        'schemas via a response-schemas contract module), or use `import type` (issue #130).',
    },
  ];
};

module.exports = {
  ALLOWED_LIBRARIES,
  ALLOWED_LIBRARY_SPECIFIER,
  ALLOWED_TARGETS,
  EXEMPT_PATTERNS,
  EXEMPT_RENDER_PATH_FILES,
  LOGIC_SOURCE_GLOBS,
  LOGIC_SOURCE_PATHS,
  PROJECT_SPECIFIER,
  RESTRICTED_LIBRARY_ADAPTERS,
  RUNTIME_IMPORT_SHAPES,
  allowedTargetPaths,
  allowedTargetSpecifier,
  collaboratorSelectors,
  esquerySource,
  exemptGlobs,
  exemptPaths,
  runtimeImportSelector,
  toExactPathRegex,
};
