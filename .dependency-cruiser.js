module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'This dependency is part of a circular relationship. You might want to revise ' +
        'your solution (i.e. use dependency inversion, make sure the modules have a single responsibility) ',
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
          '(^|/)(?:babel|webpack)[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$', // build configs
          '(^|/)(?:commitlint|stryker)[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$', // tooling configs
          '(^|/)__mocks__/.*[.](?:js|cjs|mjs|ts|cts|mts|jsx|tsx)$', // test/runtime manual mocks
          '^src/index[.]tsx$', // app entrypoint
          '^tests/load/utils/test-data[.]js$', // ad-hoc load-test data generator
          '^storybook-static/', // generated Storybook output
          '^coverage/', // generated coverage reports
          '^docker/apollo-server/out/', // generated Apollo transpiled output
        ],
      },
      to: {},
    },
    {
      name: 'no-deprecated-core',
      comment:
        'A module depends on a node core module that has been deprecated. Find an alternative - these are ' +
        "bound to exist - node doesn't deprecate lightly.",
      severity: 'warn',
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
        'This module uses a (version of an) npm module that has been deprecated. Either upgrade to a later ' +
        'version of that module, or find an alternative. Deprecated modules are a security risk.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['deprecated'],
      },
    },
    {
      name: 'no-non-package-json',
      severity: 'error',
      comment:
        "This module depends on an npm package that isn't in the 'dependencies' section of your package.json. " +
        "That's problematic as the package either (1) won't be available on live (2 - worse) will be " +
        'available on live with an non-guaranteed version. Fix it by adding the package to the dependencies ' +
        'in your package.json.',
      from: {},
      to: {
        dependencyTypes: ['npm-no-pkg', 'npm-unknown'],
      },
    },
    {
      name: 'not-to-unresolvable',
      comment:
        "This module depends on a module that cannot be found ('resolved to disk'). If it's an npm " +
        'module: add it to your package.json. In all other cases you likely already know what to do.',
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
      severity: 'warn',
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
        "This module depends on code within a folder that should only contain tests. As tests don't " +
        "implement functionality this is odd. Either you're writing a test outside the test folder " +
        "or there's something in the test folder that isn't a test.",
      severity: 'error',
      from: {
        pathNot: '^(tests)',
      },
      to: {
        path: '^(tests)',
      },
    },
    {
      name: 'not-to-spec',
      comment:
        'This module depends on a spec (test) file. The responsibility of a spec file is to test code. ' +
        "If there's something in a spec that's of use to other modules, it doesn't have that single " +
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
        'package.json. It looks like something that ships to production, though. To prevent problems ' +
        "with npm packages that aren't there on production declare it (only!) in the 'dependencies'" +
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
        "in your package.json. As this makes sense in limited situations only, it's flagged here. " +
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
      severity: 'warn',
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
        'Imports from repositories must go through the repositories public API (index file).',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot: '^src/modules/[^/]+/features/[^/]+/repositories/',
      },
      to: {
        path: '^src/modules/[^/]+/features/[^/]+/repositories/(?!index[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$).+',
      },
    },
    {
      name: 'no-repositories-to-ui-hooks',
      comment:
        'Repositories are data-access layer and must not depend on feature UI/hooks/routes or module app-layer folders.',
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
        'Feature hooks folder should only expose index files and use-* hooks (bulletproof-react convention).',
      severity: 'error',
      from: {
        path: '^src/modules/[^/]+/features/[^/]+/hooks/(?!index[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$|use-[a-z0-9-]+[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$).+',
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
      comment: 'Module store must use repositories (or hooks) instead of HTTP client services directly.',
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
        'Feature UI layers (components/hooks/routes) must not depend on low-level services directly.',
      severity: 'error',
      from: {
        path: '^src/modules/[^/]+/features/[^/]+/(components|hooks|routes)/',
      },
      to: {
        path: '^src/services/',
      },
    },
    {
      name: 'no-tsyringe-outside-di-and-repositories',
      comment:
        'tsyringe usage is restricted to composition root and repositories to keep DI boundaries explicit.',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot: [
          '^src/config/dependency-injection-config[.]ts$',
          '^src/modules/[^/]+/features/[^/]+/repositories/',
        ],
      },
      to: {
        path: '^node_modules/tsyringe/',
      },
    },
    {
      name: 'no-di-config-import-outside-composition-root',
      comment:
        'The DI container configuration must only be imported by application composition roots.',
      severity: 'error',
      from: {
        path: '^src/(?!index[.]tsx$|app[.]tsx$|stores/index[.]ts$).+',
      },
      to: {
        path: '^src/config/dependency-injection-config[.]ts$',
      },
    },
    {
      name: 'no-cross-feature-imports',
      comment:
        'Features within a module must not import from sibling features. Use the module-level shared layers (hooks, lib, store, types, utils) instead.',
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/features/([^/]+)/',
      },
      to: {
        path: '^src/modules/$1/features/(?!$2/)',
      },
    },
    {
      name: 'no-components-to-repositories',
      comment:
        'Components must not import repositories directly. Use hooks as the mediator between UI and data-access layers.',
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
        'Feature components must not import from the module store directly. Use hooks to access store state and dispatch.',
      severity: 'error',
      from: {
        path: '^src/modules/[^/]+/features/[^/]+/components/',
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
      comment:
        'Module root may only contain allowed folders: config, features, hooks, lib, store, types, utils.',
      severity: 'error',
      from: {
        path: '^src/modules/[^/]+/(?!config|features|hooks|lib|store|types|utils)[^/]+/',
      },
      to: {},
    },
    {
      name: 'feature-allowed-folders',
      comment:
        'Feature root may only contain allowed folders: assets, components, hooks, i18n, repositories, routes, types, utils.',
      severity: 'error',
      from: {
        path: '^src/modules/[^/]+/features/[^/]+/(?!assets|components|hooks|i18n|repositories|routes|types|utils)[^/]+/',
      },
      to: {},
    },
    {
      name: 'tests-top-level-allowed-folders',
      comment:
        'Tests root may only contain allowed folders: apollo-server, e2e, integration, load, memory-leak, unit, visual.',
      severity: 'error',
      from: {
        path: '^tests/(?!apollo-server|e2e|integration|load|memory-leak|unit|visual)[^/]+/',
      },
      to: {},
    },
    {
      name: 'no-uppercase-paths',
      comment:
        'All source paths must be lowercase and kebab-case. Uppercase letters in file or directory names break consistency across the project.',
      severity: 'error',
      from: {
        path: '.*[A-Z].*',
      },
      to: {},
    },
    {
      name: 'tests-module-name-lowercase',
      comment:
        'Test module names under tests/{e2e,integration,unit}/modules must be lowercase kebab-case.',
      severity: 'error',
      from: {
        path: '^tests/(?:e2e|integration|unit)/modules/(?![a-z0-9-]+/)[^/]+/',
      },
      to: {},
    },
    {
      name: 'tests-module-allowed-folders',
      comment:
        'Test module root may only contain allowed folders: features, helpers, lib, repositories, store.',
      severity: 'error',
      from: {
        path: '^tests/(?:e2e|integration|unit)/modules/[a-z0-9-]+/(?!features|helpers|lib|repositories|store)[^/]+/',
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
      comment:
        'Test feature root may only contain allowed folders: assets, components, hooks, i18n, repositories, routes, types, utils.',
      severity: 'error',
      from: {
        path: '^tests/(?:e2e|integration|unit)/modules/[a-z0-9-]+/features/[a-z0-9-]+/(?!assets|components|hooks|i18n|repositories|routes|types|utils)[^/]+/',
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
  ],
  options: {
    doNotFollow: {
      path: ['node_modules'],
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
          '^(?:packages|src|lib(s?)|app(s?)|bin|test(s?)|spec(s?))/[^/]+|node_modules/(?:@[^/]+/[^/]+|[^/]+)',
      },
      text: {
        highlightFocused: true,
      },
    },
  },
};
