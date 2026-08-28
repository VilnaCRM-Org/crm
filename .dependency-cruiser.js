// Issue #109: DI composition roots are the thin aggregator plus each per-module and
// per-infra registrar (di.ts). They wire dependencies, so they are the only modules
// allowed to reach into module/feature/repository internals for registration, and the
// only import targets restricted by no-di-config-import-outside-composition-root (importing
// one eagerly pulls the whole DI graph, which must stay off the auth paint path).
// Issue #108: the module/feature/test folder law has exactly one source of truth,
// config/module-shape.json, which the scaffolding generator (plopfile.ts) also reads.
// The regexes and comments below are derived from it, so a generated skeleton and the
// gate that judges it can never disagree. Change the folder sets there, not here.
const MODULE_SHAPE = require('./config/module-shape.json');

const listFolders = (folders) => folders.join(', ');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const disallowedFolderSegment = (folders) =>
  `(?!(?:${folders.map(escapeRegExp).join('|')})/)[^/]+/`;

const DI_COMPOSITION_ROOTS = [
  '^src/config/dependency-injection-config[.]ts$',
  '^src/services/[^/]+/di[.]ts$',
  '^src/utils/[^/]+/di[.]ts$',
  '^src/modules/[^/]+/config/di[.]ts$',
];
const DI_MODULE_COMPOSITION_ROOT = '^src/modules/[^/]+/config/di[.]ts$';

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'This dependency is part of a circular relationship. You might want to revise ' +
        'your solution (i.e. use dependency inversion, make sure the modules have a ' +
        'single responsibility) ',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-orphans',
      comment:
        "This is an orphan module - it's likely not used (anymore?). Either use it or " +
        "remove it. If it's logical this module is an orphan (i.e. it's a config file), " +
        'add an exception for it in your dependency-cruiser configuration. By default ' +
        'this rule does not scrutinize dot-files (e.g. .eslintrc.js), TypeScript declaration ' +
        'files (.d.ts), tsconfig.json and some of the babel and webpack configs.',
      severity: 'error',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$', // dot files
          '[.]d[.]ts$', // TypeScript declaration files
          '(^|/)tsconfig[.]json$', // TypeScript config
          // build configs
          '(^|/)(?:babel|webpack)[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$',
          // tooling configs
          '(^|/)(?:commitlint|stryker)[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$',
          // test/runtime manual mocks
          '(^|/)__mocks__/.*[.](?:js|cjs|mjs|ts|cts|mts|jsx|tsx)$',
          '^src/index[.]tsx$', // app entrypoint
          '^codegen[.]ts$', // graphql-codegen config (consumed by the CLI, not imported)
          '^tests/load/utils/test-data[.]js$', // ad-hoc load-test data generator
          // console-gate fixtures: run by a child Jest process, never imported (issue #192)
          '^tests/fixtures/console-gate/.*[.]fixture[.](?:ts|tsx)$',
          '^storybook-static/', // generated Storybook output
          '^coverage/', // generated coverage reports
          '^test-results/', // generated Playwright/Jest test artifacts
          '^playwright-report/', // generated Playwright HTML reports
          '^docker/apollo-server/out/', // generated Apollo transpiled output
        ],
      },
      to: {},
    },
    {
      name: 'no-deprecated-core',
      comment:
        'A module depends on a node core module that has been deprecated. Find an ' +
        'alternative - these are ' +
        "bound to exist - node doesn't deprecate lightly.",
      severity: 'error', // #179: promoted from 'warn' — dependency hygiene is a hard gate
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: [
          '^v8/tools/codemap$',
          '^v8/tools/consarray$',
          '^v8/tools/csvparser$',
          '^v8/tools/logreader$',
          '^v8/tools/profile_view$',
          '^v8/tools/profile$',
          '^v8/tools/SourceMap$',
          '^v8/tools/splaytree$',
          '^v8/tools/tickprocessor-driver$',
          '^v8/tools/tickprocessor$',
          '^node-inspect/lib/_inspect$',
          '^node-inspect/lib/internal/inspect_client$',
          '^node-inspect/lib/internal/inspect_repl$',
          '^async_hooks$',
          '^punycode$',
          '^domain$',
          '^constants$',
          '^sys$',
          '^_linklist$',
          '^_stream_wrap$',
        ],
      },
    },
    {
      name: 'not-to-deprecated',
      comment:
        'This module uses a (version of an) npm module that has been deprecated. ' +
        'Either upgrade to a later ' +
        'version of that module, or find an alternative. Deprecated modules are a security risk.',
      severity: 'error', // #179: promoted from 'warn' — "Deprecated modules are a security risk."
      from: {},
      to: {
        dependencyTypes: ['deprecated'],
      },
    },
    {
      name: 'no-non-package-json',
      severity: 'error',
      comment:
        "This module depends on an npm package that isn't in the 'dependencies' " +
        'section of your package.json. ' +
        "That's problematic as the package either (1) won't be available on live " +
        '(2 - worse) will be ' +
        'available on live with an non-guaranteed version. Fix it by adding the ' +
        'package to the dependencies ' +
        'in your package.json.',
      from: {},
      to: {
        dependencyTypes: ['npm-no-pkg', 'npm-unknown'],
      },
    },
    {
      name: 'not-to-unresolvable',
      comment:
        "This module depends on a module that cannot be found ('resolved to disk'). " +
        "If it's an npm " +
        'module: add it to your package.json. ' +
        'In all other cases you likely already know what to do.',
      severity: 'error',
      from: {},
      to: {
        couldNotResolve: true,
        pathNot: ['^https?://'],
      },
    },
    {
      name: 'no-duplicate-dep-types',
      comment:
        "Likely this module depends on an external ('npm') package that occurs more than once " +
        'in your package.json i.e. bot as a devDependencies and in dependencies. This will cause ' +
        'maintenance problems later on.',
      severity: 'error', // #179: promoted from 'warn' — no package in both deps and devDeps
      from: {},
      to: {
        moreThanOneDependencyType: true,
        // allow type-only dual placement in dependencies/devDependencies
        dependencyTypesNot: ['type-only'],
      },
    },

    {
      name: 'not-to-test',
      comment:
        'This module depends on code within a folder that should only contain tests. ' +
        "As tests don't " +
        'implement functionality this is odd. ' +
        "Either you're writing a test outside the test folder " +
        "or there's something in the test folder that isn't a test.",
      severity: 'error',
      from: {
        pathNot: '^(tests)|^jest\\.setup\\.ts$',
      },
      to: {
        path: '^(tests)',
      },
    },
    {
      name: 'not-to-spec',
      comment:
        'This module depends on a spec (test) file. The responsibility of a spec ' +
        'file is to test code. ' +
        "If there's something in a spec that's of use to other modules, it doesn't " +
        'have that single ' +
        'responsibility anymore. Factor it out into (e.g.) a separate utility/ helper or a mock.',
      severity: 'error',
      from: {},
      to: {
        path: '[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$',
      },
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      comment:
        "This module depends on an npm package from the 'devDependencies' section of your " +
        'package.json. It looks like something that ships to production, though. ' +
        'To prevent problems ' +
        "with npm packages that aren't there on production declare it (only!) in the " +
        "'dependencies'" +
        'section of your package.json. If this module is development only - add it to the ' +
        'from.pathNot re of the not-to-dev-dep rule in the dependency-cruiser configuration',
      from: {
        path: '^(src)',
        pathNot: '[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$',
      },
      to: {
        dependencyTypes: ['npm-dev'],
        // type-only imports do not ship in runtime bundles
        dependencyTypesNot: ['type-only'],
        pathNot: ['node_modules/@types/'],
      },
    },
    {
      name: 'optional-deps-used',
      severity: 'info',
      comment:
        'This module depends on an npm package that is declared as an optional dependency ' +
        "in your package.json. As this makes sense in limited situations only, it's " +
        'flagged here. ' +
        'If you use an optional dependency here by design - add an exception to your' +
        'dependency-cruiser configuration.',
      from: {},
      to: {
        dependencyTypes: ['npm-optional'],
      },
    },
    {
      name: 'peer-deps-used',
      comment:
        'This module depends on an npm package that is declared as a peer dependency ' +
        'in your package.json. This makes sense if your package is e.g. a plugin, but in ' +
        'other cases - maybe not so much. If the use of a peer dependency is intentional ' +
        'add an exception to your dependency-cruiser configuration.',
      severity: 'error', // #179: promoted from 'warn' — no peerDependencies today
      from: {},
      to: {
        dependencyTypes: ['npm-peer'],
      },
    },
    {
      name: 'no-cross-module-imports',
      comment: 'Modules must not import from other modules directly; use shared layers instead.',
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/',
      },
      to: {
        path: '^src/modules/',
        pathNot: '^src/modules/$1/',
      },
    },
    {
      name: 'no-module-internal-imports',
      comment:
        'Code outside a module must import it through the module public API ' +
        '(src/modules/<module>/index). Deep imports into module internals are ' +
        'forbidden. Exempt consumers: the DI composition root (DI wiring) and the ' +
        'app-shell router (src/routes) — the router is instead narrowly scoped by ' +
        'no-routes-import-feature-internals and no-routes-import-module-internals.',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot: ['^src/modules/', '^src/routes/', '^src/config/dependency-injection-config[.]ts$'],
      },
      to: {
        path: '^src/modules/[^/]+/(?!index[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$).+',
      },
    },
    {
      name: 'no-components-import-modules',
      comment: 'Shared UI components must not depend on feature modules.',
      severity: 'error',
      from: {
        path: '^src/components/',
      },
      to: {
        path: '^src/modules/',
      },
    },
    {
      name: 'no-repository-internal-imports',
      comment:
        'Imports from repositories must go through the repositories public API (index file). ' +
        'Exempt: repositories themselves and the DI composition roots, which register the ' +
        'concrete repository implementations (issue #109).',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot: ['^src/modules/[^/]+/features/[^/]+/repositories/', ...DI_COMPOSITION_ROOTS],
      },
      to: {
        path:
          '^src/modules/[^/]+/features/[^/]+/repositories/' +
          '(?!index[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$).+',
      },
    },
    {
      name: 'no-repositories-to-ui-hooks',
      comment:
        'Repositories are data-access layer and must not depend on feature ' +
        'UI/hooks/routes or module app-layer folders.',
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/features/([^/]+)/repositories/',
      },
      to: {
        path: [
          '^src/modules/$1/features/$2/(components|hooks|routes)/',
          '^src/modules/$1/(hooks|store)/',
        ],
      },
    },
    {
      name: 'feature-hooks-file-convention',
      comment:
        'Feature hooks folder should only expose index files and use-* hooks ' +
        '(bulletproof-react convention).',
      severity: 'error',
      from: {
        path:
          '^src/modules/[^/]+/features/[^/]+/hooks/' +
          '(?!index[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$|' +
          'use-[a-z0-9-]+[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$).+',
      },
      to: {},
    },
    {
      name: 'no-feature-direct-http-client',
      comment:
        'Feature layer must not call HTTP client directly; route data access through repositories.',
      severity: 'error',
      from: {
        path: '^src/modules/[^/]+/features/[^/]+/(?!repositories/).+',
      },
      to: {
        path: '^src/services/https-client/',
      },
    },
    {
      name: 'no-store-direct-http-client',
      comment:
        'Module store must use repositories (or hooks) instead of HTTP client services directly.',
      severity: 'error',
      from: {
        path: '^src/modules/[^/]+/store/',
      },
      to: {
        path: '^src/services/https-client/',
      },
    },
    {
      name: 'no-feature-ui-to-services',
      comment:
        'Feature UI layers (components/hooks/routes) must not depend on ' +
        'low-level services directly.',
      severity: 'error',
      from: {
        path: '^src/modules/[^/]+/features/[^/]+/(components|hooks|routes)/',
      },
      to: {
        path: '^src/services/',
      },
    },
    {
      name: 'no-di-config-import-outside-composition-root',
      comment:
        'The DI container configuration and every per-module/per-infra registrar (di.ts) ' +
        'must only be imported by the aggregating composition root itself and the store/hook ' +
        'bridges that resolve singletons. Importing one elsewhere eagerly pulls the whole DI ' +
        'graph onto the auth paint path (issue #109).',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot: [
          '^src/index[.]tsx$',
          '^src/app[.]tsx$',
          '^src/stores/',
          '^src/modules/[^/]+/store/[^/]+-slice[.]ts$',
          '^src/modules/[^/]+/features/[^/]+/stores/index[.]ts$',
          '^src/config/dependency-injection-config[.]ts$',
          // Issue #128: the sanctioned component DI bridge. `useService` must import the
          // aggregating composition root (not the bare tsyringe container) or `resolve` would
          // throw on an unregistered token. It stays off the auth paint path because
          // no-paint-path-import-di-bridge forbids the auth feature and the route shell from
          // importing it.
          '^src/providers/di/use-service[.]ts$',
        ],
      },
      to: {
        path: DI_COMPOSITION_ROOTS,
      },
    },
    {
      name: 'components-no-direct-injectable-import',
      comment:
        'React components must obtain behavioral collaborators (services, repositories, ' +
        'module store, factories, mappers, error handlers) through the DI bridge ' +
        'useService(TOKENS.X) from @/providers/di — never by value-importing the class and ' +
        'calling it directly, which binds the collaborator at the call site and cannot be ' +
        'swapped for a mock in a component test (issue #128; cf. #100). `import type` stays ' +
        'allowed: type annotations are erased and bind nothing. Carve-outs are the ' +
        'container-free-by-design surfaces: the auth render path (Lighthouse budget), the ' +
        'route shell (issue #105), the app entrypoint, and the ROOT error boundary file alone ' +
        '(a class component cannot call a hook, and error reporting must survive a DI ' +
        'failure) — its functional descendants can call useService and stay gated. This ' +
        'is the consumer side; the producer side (one injectable importing another) is not ' +
        'owned here, so the two never flag the same edge.',
      severity: 'error',
      from: {
        path: '^src/.+[.]tsx$',
        pathNot: [
          '^src/modules/user/features/auth/',
          '^src/routes/route-(?:composer|mapper)[.]tsx$',
          '^src/index[.]tsx$',
          '^src/components/error-boundary/app-error-boundary[.]tsx$',
          '[.](?:stories|test|spec)[.]tsx$',
        ],
      },
      to: {
        path: [
          '^src/services/',
          '^src/modules/[^/]+/features/[^/]+/repositories/',
          '^src/modules/[^/]+/store/',
          '(?:-factory|-mapper)[.]tsx?$',
          'error-handler',
        ],
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'no-paint-path-import-di-bridge',
      comment:
        'The auth render path must not REACH the component DI bridge (@/providers/di) — not ' +
        'directly and not through an intermediate shared component, hence `reachable`. The ' +
        'bridge eagerly imports the aggregating composition root, so any path from the auth ' +
        'feature would pull the whole DI graph into the chunks needed to paint the ' +
        'authentication page and blow the mobile Lighthouse budget (issues #128, #109). Auth ' +
        'keeps its sanctioned module singletons instead; this rule is what makes that ' +
        'carve-out enforced rather than merely documented. Reachability is safe to demand ' +
        'here because everything auth reaches — including its own lazily loaded pages — is ' +
        'auth-owned or shared UI, which is held to the same invariant.',
      severity: 'error',
      from: {
        path: '^src/modules/user/features/auth/',
      },
      to: {
        path: '^src/providers/di/',
        reachable: true,
      },
    },
    {
      name: 'no-eager-shell-import-di-bridge',
      comment:
        'The eagerly evaluated app shell — entrypoint, root component, and route registry — ' +
        'must not itself import the component DI bridge (@/providers/di), which would put the ' +
        'composition root in the initial bundle instead of the lazily loaded route chunk that ' +
        'actually needs it (issue #128). Unlike the auth rule above this is deliberately a ' +
        'DIRECT-edge rule: the route registry dynamically imports every page in the app, so ' +
        'demanding reachability here would forbid the bridge in every lazily routed ' +
        'component — precisely the use case it exists for. The code-split boundary is where ' +
        'the cost stops, so only the shell own static imports are gated.',
      severity: 'error',
      from: {
        path: ['^src/index[.]tsx$', '^src/app[.]tsx$', '^src/routes/'],
      },
      to: {
        path: '^src/providers/di/',
      },
    },
    {
      name: 'no-composition-root-cross-module-imports',
      comment:
        'A module DI composition root and token module (src/modules/<m>/config/*) may wire ' +
        "only its own module's internals, tsyringe, and shared infra (services/, utils/). It " +
        'must never reach into a sibling module — that would recreate the cross-module hub ' +
        'coupling issue #109 removes. This makes the DI-isolation invariant explicit; general ' +
        'cross-module imports are also caught by no-cross-module-imports.',
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/config/',
      },
      to: {
        path: '^src/modules/(?!$1/)[^/]+/',
      },
    },
    {
      name: 'no-providers-import-feature-internals',
      comment:
        'The providers shell layer must not import from feature internals. ' +
        'Providers are composition roots and must stay decoupled from feature logic.',
      severity: 'error',
      from: { path: '^src/providers/' },
      to: { path: '^src/modules/[^/]+/features/' },
    },
    {
      name: 'no-components-import-feature-internals',
      comment:
        'Shared components must not import from feature internals. ' +
        'Extract shared logic to src/hooks, src/services, or src/utils instead.',
      severity: 'error',
      from: { path: '^src/components/' },
      to: { path: '^src/modules/[^/]+/features/' },
    },
    {
      name: 'no-routes-import-feature-internals',
      comment:
        'The routes shell layer (registry + composer) must not import feature ' +
        'internals. It consumes a feature only through its module-owned route ' +
        'contract barrel (features/<f>/routes/index) — never a deep page path — ' +
        'so pages are declared as data inside the module, not wired in the shell ' +
        '(issue #105). The routing guard (protected-route) is the one further ' +
        'exception, resolved by the composer for the declarative `guard` field.',
      severity: 'error',
      from: { path: '^src/routes/' },
      to: {
        path: '^src/modules/[^/]+/features/',
        pathNot: [
          '^src/modules/[^/]+/features/[^/]+/routes/index[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$',
          '^src/modules/[^/]+/features/[^/]+/components/protected-route/',
        ],
      },
    },
    {
      name: 'no-routes-import-module-internals',
      comment:
        'The routes shell layer is exempt from no-module-internal-imports only so it ' +
        'can mount a feature via its code-split page entries (features/*/routes) and ' +
        'protected-route guard (both governed by no-routes-import-feature-internals). ' +
        'It must not deep-import any other module internal (module-level store, lib, ' +
        'hooks, utils, config, types); those still enter through the module index.',
      severity: 'error',
      from: { path: '^src/routes/' },
      to: {
        path: '^src/modules/[^/]+/(?!index[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$|features/).+',
      },
    },
    {
      name: 'no-cross-feature-imports',
      comment:
        'Features within a module must not import from sibling features. Use ' +
        'the module-level shared layers (hooks, lib, store, types, utils) instead.',
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/features/([^/]+)/',
      },
      to: {
        path: '^src/modules/$1/features/(?!$2/)',
      },
    },
    {
      name: 'no-feature-internal-imports',
      comment:
        'Module-level shared layers (store, types, lib, hooks, utils, config) must ' +
        'import a feature through its public API (feature index barrel), not deep ' +
        'feature-internal files. (lib is additionally blocked from every feature ' +
        'import by no-lib-to-features.) Sibling-feature imports are handled by ' +
        'no-cross-feature-imports; outside-module imports by no-module-internal-imports. ' +
        'Exempt: the module DI composition root (config/di.ts), which wires the feature ' +
        'internals into the container (issue #109); it stays module-scoped via ' +
        'no-composition-root-cross-module-imports.',
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/(?:store|types|lib|hooks|utils|config)/',
        pathNot: [DI_MODULE_COMPOSITION_ROOT],
      },
      to: {
        path:
          '^src/modules/$1/features/[^/]+/' + '(?!index[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$).+',
      },
    },
    {
      name: 'no-components-to-repositories',
      comment:
        'Components must not import repositories directly. Use hooks as the ' +
        'mediator between UI and data-access layers.',
      severity: 'error',
      from: {
        path: '^src/modules/[^/]+/features/[^/]+/components/',
      },
      to: {
        path: '^src/modules/[^/]+/features/[^/]+/repositories/',
      },
    },
    {
      name: 'no-components-to-store',
      comment:
        'Feature components must not import from the module store directly. Use ' +
        'hooks (use-* files) to access store state and dispatch.',
      severity: 'error',
      from: {
        path: '^src/modules/[^/]+/features/[^/]+/components/',
        pathNot: '/use-[a-z0-9-]+[.]ts$',
      },
      to: {
        path: '^src/modules/[^/]+/store/',
      },
    },
    {
      name: 'no-store-to-feature-ui',
      comment: 'Module store must not depend on feature components, hooks, or routes.',
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/store/',
      },
      to: {
        path: '^src/modules/$1/features/[^/]+/(components|hooks|routes)/',
      },
    },
    {
      name: 'no-lib-to-features',
      comment: 'Module lib is a shared utility layer and must not depend on feature-specific code.',
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/lib/',
      },
      to: {
        path: '^src/modules/$1/features/',
      },
    },
    {
      name: 'module-allowed-folders',
      comment: `Module root may only contain allowed folders: ${listFolders(
        MODULE_SHAPE.module.allowedFolders
      )}. Scaffold one with \`make new-module\` (config/module-shape.json).`,
      severity: 'error',
      from: {
        path: `^src/modules/[^/]+/${disallowedFolderSegment(MODULE_SHAPE.module.allowedFolders)}`,
      },
      to: {},
    },
    {
      name: 'feature-allowed-folders',
      comment: `Feature root may only contain allowed folders: ${listFolders(
        MODULE_SHAPE.feature.allowedFolders
      )}. Scaffold one with \`make new-feature\` (config/module-shape.json).`,
      severity: 'error',
      from: {
        path:
          '^src/modules/[^/]+/features/[^/]+/' +
          disallowedFolderSegment(MODULE_SHAPE.feature.allowedFolders),
      },
      to: {},
    },
    {
      name: 'tests-top-level-allowed-folders',
      comment: `Tests root may only contain allowed folders: ${listFolders(
        MODULE_SHAPE.tests.rootAllowedFolders
      )}.`,
      severity: 'error',
      from: {
        path: `^tests/${disallowedFolderSegment(MODULE_SHAPE.tests.rootAllowedFolders)}`,
      },
      to: {},
    },
    {
      name: 'no-uppercase-paths',
      comment:
        'All source paths must be lowercase. Uppercase letters in file or directory ' +
        'names break consistency across the project.',
      severity: 'error',
      from: {
        path: '.*[A-Z].*',
      },
      to: {},
    },
    {
      name: 'tests-module-name-lowercase',
      comment:
        'Test module names under tests/{e2e,integration,unit}/modules ' +
        'must be lowercase kebab-case.',
      severity: 'error',
      from: {
        path: '^tests/(?:e2e|integration|unit)/modules/(?![a-z0-9-]+/)[^/]+/',
      },
      to: {},
    },
    {
      name: 'tests-module-allowed-folders',
      comment: `Test module root may only contain allowed folders: ${listFolders(
        MODULE_SHAPE.tests.moduleAllowedFolders
      )}.`,
      severity: 'error',
      from: {
        path:
          '^tests/(?:e2e|integration|unit)/modules/[a-z0-9-]+/' +
          disallowedFolderSegment(MODULE_SHAPE.tests.moduleAllowedFolders),
      },
      to: {},
    },
    {
      name: 'tests-feature-name-lowercase',
      comment: 'Test feature names under tests/*/modules/*/features must be lowercase kebab-case.',
      severity: 'error',
      from: {
        path: '^tests/(?:e2e|integration|unit)/modules/[a-z0-9-]+/features/(?![a-z0-9-]+/)[^/]+/',
      },
      to: {},
    },
    {
      name: 'tests-feature-allowed-folders',
      comment: `Test feature root may only contain allowed folders: ${listFolders(
        MODULE_SHAPE.tests.featureAllowedFolders
      )}.`,
      severity: 'error',
      from: {
        path:
          '^tests/(?:e2e|integration|unit)/modules/[a-z0-9-]+/features/[a-z0-9-]+/' +
          disallowedFolderSegment(MODULE_SHAPE.tests.featureAllowedFolders),
      },
      to: {},
    },
    {
      name: 'src-module-name-kebab-case',
      comment: 'Module names under src/modules must be lowercase kebab-case.',
      severity: 'error',
      from: {
        path: '^src/modules/(?![a-z0-9-]+/)[^/]+/',
      },
      to: {},
    },
    {
      name: 'src-feature-name-kebab-case',
      comment: 'Feature names under src/modules/*/features must be lowercase kebab-case.',
      severity: 'error',
      from: {
        path: '^src/modules/[a-z0-9-]+/features/(?![a-z0-9-]+/)[^/]+/',
      },
      to: {},
    },
    {
      name: 'type-files-imported-as-type-only',
      comment:
        'Type-only files (types.ts and the types/ folders) may only be imported with ' +
        '`import type`. Importing them as runtime values pulls type-only modules into ' +
        'runtime bundles and breaks the type/runtime split (issue #88).',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot: ['[.]d[.]ts$'],
      },
      to: {
        path: ['^src/.+/types[.]ts$', '^src/.+/types/', '^src/.+[.]types[.]ts$'],
        pathNot: ['[.]d[.]ts$'],
        dependencyTypes: ['import', 'export'],
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'type-files-no-runtime-imports',
      comment:
        'Type-only files (types.ts and the types/ folders) must not depend on runtime ' +
        '(value) modules. Keep them free of runtime imports; use `import type` for any ' +
        'cross-module type references (issue #88).',
      severity: 'error',
      from: {
        path: ['^src/.+/types[.]ts$', '^src/.+/types/', '^src/.+[.]types[.]ts$'],
        pathNot: ['[.]d[.]ts$'],
      },
      to: {
        path: '^src/',
        pathNot: ['[.]d[.]ts$'],
        dependencyTypesNot: ['type-only'],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: ['node_modules'],
    },
    // Generated API contract artifacts are build output: keep them out of the graph the
    // same way generated i18n JSON is excluded from the source gates. Consumers still
    // import them normally; dependency-cruiser just does not scrutinize the generated code.
    exclude: {
      path: '^src/api/generated/',
    },
    detectProcessBuiltinModuleCalls: true,
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.d.ts', '.js'],
      mainFields: ['main', 'types', 'typings'],
    },
    skipAnalysisNotInRules: true,
    builtInModules: {
      add: [
        'bun',
        'bun:ffi',
        'bun:jsc',
        'bun:sqlite',
        'bun:test',
        'bun:wrap',
        'detect-libc',
        'k6',
        'k6/http',
      ],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(?:@[^/]+/[^/]+|[^/]+)',
      },
      archi: {
        collapsePattern:
          '^(?:packages|src|lib(s?)|app(s?)|bin|test(s?)|spec(s?))/[^/]+' +
          '|node_modules/(?:@[^/]+/[^/]+|[^/]+)',
      },
      text: {
        highlightFocused: true,
      },
    },
  },
};
