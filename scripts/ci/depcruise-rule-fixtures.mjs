const reexport = (from) => `import subject from '${from}';\n\nexport default subject;\n`;
const leaf = (value) => `export default '${value}';\n`;
const useNpm = (name) => `import subject from '${name}';\n\nexport default subject;\n`;
const npmPackage = (name, extra = {}) =>
  `${JSON.stringify({ name, version: '1.0.0', main: 'index.js', ...extra }, null, 2)}\n`;
const manifest = (extra) =>
  `${JSON.stringify({ name: 'fixture', version: '1.0.0', ...extra }, null, 2)}\n`;
const npmBody = "module.exports = 'subject';\n";

export const FIXTURES = {
  'no-circular': {
    files: {
      'src/services/alpha/index.ts': reexport('../beta'),
      'src/services/beta/index.ts': reexport('../alpha'),
    },
  },
  'no-orphans': {
    files: { 'src/utils/lonely/index.ts': leaf('lonely') },
  },
  'no-deprecated-core': {
    files: { 'src/utils/thing/index.ts': reexport('punycode') },
  },
  'not-to-deprecated': {
    files: {
      'package.json': manifest({ dependencies: { 'fx-old-pkg': '1.0.0' } }),
      'node_modules/fx-old-pkg/package.json': npmPackage('fx-old-pkg', {
        deprecated: 'use something else',
      }),
      'node_modules/fx-old-pkg/index.js': npmBody,
      'src/utils/thing/index.ts': useNpm('fx-old-pkg'),
    },
  },
  'no-non-package-json': {
    files: {
      'package.json': manifest({ dependencies: {} }),
      'node_modules/fx-ghost-pkg/package.json': npmPackage('fx-ghost-pkg'),
      'node_modules/fx-ghost-pkg/index.js': npmBody,
      'src/utils/thing/index.ts': useNpm('fx-ghost-pkg'),
    },
  },
  'not-to-unresolvable': {
    files: { 'src/utils/thing/index.ts': reexport('./nope') },
  },
  'no-duplicate-dep-types': {
    files: {
      'package.json': manifest({
        dependencies: { 'fx-dual-pkg': '1.0.0' },
        devDependencies: { 'fx-dual-pkg': '1.0.0' },
      }),
      'node_modules/fx-dual-pkg/package.json': npmPackage('fx-dual-pkg'),
      'node_modules/fx-dual-pkg/index.js': npmBody,
      'scripts/probe/index.ts': useNpm('fx-dual-pkg'),
    },
  },
  'not-to-test': {
    files: {
      'src/utils/thing/index.ts': reexport('../../../tests/utils/helper'),
      'tests/utils/helper.ts': leaf('helper'),
    },
  },
  'not-to-spec': {
    files: {
      'src/utils/thing/index.ts': reexport('./helper.test'),
      'src/utils/thing/helper.test.ts': leaf('helper'),
    },
  },
  'not-to-dev-dep': {
    files: {
      'package.json': manifest({ devDependencies: { 'fx-dev-pkg': '1.0.0' } }),
      'node_modules/fx-dev-pkg/package.json': npmPackage('fx-dev-pkg'),
      'node_modules/fx-dev-pkg/index.js': npmBody,
      'src/utils/thing/index.ts': useNpm('fx-dev-pkg'),
    },
  },
  'optional-deps-used': {
    files: {
      'package.json': manifest({ optionalDependencies: { 'fx-opt-pkg': '1.0.0' } }),
      'node_modules/fx-opt-pkg/package.json': npmPackage('fx-opt-pkg'),
      'node_modules/fx-opt-pkg/index.js': npmBody,
      'src/utils/thing/index.ts': useNpm('fx-opt-pkg'),
    },
  },
  'peer-deps-used': {
    files: {
      'package.json': manifest({ peerDependencies: { 'fx-peer-pkg': '1.0.0' } }),
      'node_modules/fx-peer-pkg/package.json': npmPackage('fx-peer-pkg'),
      'node_modules/fx-peer-pkg/index.js': npmBody,
      'src/utils/thing/index.ts': useNpm('fx-peer-pkg'),
    },
  },
  'no-cross-module-imports': {
    files: {
      'src/modules/user/store/user-slice.ts': reexport('../../billing'),
      'src/modules/billing/index.ts': leaf('billing'),
    },
  },
  'no-module-internal-imports': {
    files: {
      'src/utils/thing/index.ts': reexport('../../modules/user/store/user-slice'),
      'src/modules/user/store/user-slice.ts': leaf('user-slice'),
    },
  },
  'no-components-import-modules': {
    files: {
      'src/components/ui-button/index.ts': reexport('../../modules/user'),
      'src/modules/user/index.ts': leaf('user'),
    },
  },
  'no-repository-internal-imports': {
    files: {
      'src/modules/user/features/auth/hooks/use-thing.ts': reexport(
        '../repositories/auth-repository'
      ),
      'src/modules/user/features/auth/repositories/auth-repository.ts': leaf('auth-repository'),
    },
  },
  'no-repositories-to-ui-hooks': {
    alsoFires: ['injectable-classes-no-value-imports'],
    files: {
      'src/modules/user/features/auth/repositories/auth-repository.ts': reexport(
        '../components/login-form'
      ),
      'src/modules/user/features/auth/components/login-form.ts': leaf('login-form'),
    },
  },
  'feature-hooks-file-convention': {
    files: {
      'src/modules/user/features/auth/hooks/helper.ts': reexport('./use-thing'),
      'src/modules/user/features/auth/hooks/use-thing.ts': leaf('use-thing'),
    },
  },
  'no-feature-direct-http-client': {
    alsoFires: ['injectable-classes-no-value-imports'],
    files: {
      'src/modules/user/features/auth/stores/auth-store.ts': reexport(
        '../../../../../services/https-client'
      ),
      'src/services/https-client/index.ts': leaf('https-client'),
    },
  },
  'no-store-direct-http-client': {
    alsoFires: ['injectable-classes-no-value-imports'],
    files: {
      'src/modules/user/store/user-slice.ts': reexport('../../../services/https-client'),
      'src/services/https-client/index.ts': leaf('https-client'),
    },
  },
  'no-feature-ui-to-services': {
    files: {
      'src/modules/user/features/auth/components/login-form.ts': reexport(
        '../../../../../services/error'
      ),
      'src/services/error/index.ts': leaf('error'),
    },
  },
  'no-di-config-import-outside-composition-root': {
    files: {
      'src/utils/thing/index.ts': reexport('../../config/dependency-injection-config'),
      'src/config/dependency-injection-config.ts': leaf('container'),
    },
  },
  'components-no-direct-injectable-import': {
    files: {
      'src/components/ui-button/index.tsx': reexport('../../services/error'),
      'src/services/error/index.ts': leaf('error'),
    },
  },
  'no-paint-path-import-di-bridge': {
    files: {
      'src/modules/user/features/auth/components/login-form.ts': reexport(
        '../../../../../components/ui-button'
      ),
      'src/components/ui-button/index.ts': reexport('../../providers/di/use-service'),
      'src/providers/di/use-service.ts': leaf('use-service'),
    },
  },
  'no-eager-shell-import-di-bridge': {
    files: {
      'src/routes/routes.ts': reexport('../providers/di/use-service'),
      'src/providers/di/use-service.ts': leaf('use-service'),
    },
  },
  'injectable-classes-no-value-imports': {
    files: {
      'src/services/error/error-handler.ts': reexport('../https-client/fetch-https-client'),
      'src/services/https-client/fetch-https-client.ts': leaf('fetch-https-client'),
    },
  },
  'no-composition-root-cross-module-imports': {
    alsoFires: ['no-cross-module-imports'],
    files: {
      'src/modules/user/config/tokens.ts': reexport('../../billing'),
      'src/modules/billing/index.ts': leaf('billing'),
    },
  },
  'no-providers-import-feature-internals': {
    alsoFires: ['no-module-internal-imports'],
    files: {
      'src/providers/app-providers.ts': reexport(
        '../modules/user/features/auth/components/login-form'
      ),
      'src/modules/user/features/auth/components/login-form.ts': leaf('login-form'),
    },
  },
  'no-components-import-feature-internals': {
    alsoFires: ['no-components-import-modules', 'no-module-internal-imports'],
    files: {
      'src/components/ui-button/index.ts': reexport(
        '../../modules/user/features/auth/components/login-form'
      ),
      'src/modules/user/features/auth/components/login-form.ts': leaf('login-form'),
    },
  },
  'no-routes-import-feature-internals': {
    files: {
      'src/routes/routes.ts': reexport('../modules/user/features/auth/components/login-form'),
      'src/modules/user/features/auth/components/login-form.ts': leaf('login-form'),
    },
  },
  'no-routes-import-module-internals': {
    files: {
      'src/routes/routes.ts': reexport('../modules/user/store/user-slice'),
      'src/modules/user/store/user-slice.ts': leaf('user-slice'),
    },
  },
  'no-cross-feature-imports': {
    files: {
      'src/modules/user/features/auth/components/login-form.ts': reexport('../../billing'),
      'src/modules/user/features/billing/index.ts': leaf('billing-feature'),
    },
  },
  'no-feature-internal-imports': {
    alsoFires: ['injectable-classes-no-value-imports'],
    files: {
      'src/modules/user/store/user-slice.ts': reexport('../features/auth/auth-internals'),
      'src/modules/user/features/auth/auth-internals.ts': leaf('auth-internals'),
    },
  },
  'no-components-to-repositories': {
    files: {
      'src/modules/user/features/auth/components/login-form.ts': reexport('../repositories'),
      'src/modules/user/features/auth/repositories/index.ts': leaf('repositories'),
    },
  },
  'no-components-to-store': {
    files: {
      'src/modules/user/features/auth/components/login-form.ts': reexport(
        '../../../store/user-slice'
      ),
      'src/modules/user/store/user-slice.ts': leaf('user-slice'),
    },
  },
  'no-store-to-feature-ui': {
    alsoFires: ['injectable-classes-no-value-imports', 'no-feature-internal-imports'],
    files: {
      'src/modules/user/store/user-slice.ts': reexport('../features/auth/components/login-form'),
      'src/modules/user/features/auth/components/login-form.ts': leaf('login-form'),
    },
  },
  'no-lib-to-features': {
    files: {
      'src/modules/user/lib/format.ts': reexport('../features/auth'),
      'src/modules/user/features/auth/index.ts': leaf('auth'),
    },
  },
  'module-allowed-folders': {
    files: {
      'src/modules/user/bogus/thing.ts': reexport('./helper'),
      'src/modules/user/bogus/helper.ts': leaf('helper'),
    },
  },
  'feature-allowed-folders': {
    files: {
      'src/modules/user/features/auth/services/thing.ts': reexport('./helper'),
      'src/modules/user/features/auth/services/helper.ts': leaf('helper'),
    },
  },
  'tests-top-level-allowed-folders': {
    files: {
      'tests/bogus/thing.ts': reexport('./helper'),
      'tests/bogus/helper.ts': leaf('helper'),
    },
  },
  'no-uppercase-paths': {
    files: {
      'src/utils/Thing/index.ts': reexport('./helper'),
      'src/utils/Thing/helper.ts': leaf('helper'),
    },
  },
  'tests-module-name-lowercase': {
    files: {
      'tests/unit/modules/user_profile/store/thing.ts': reexport('./helper'),
      'tests/unit/modules/user_profile/store/helper.ts': leaf('helper'),
    },
  },
  'tests-module-allowed-folders': {
    files: {
      'tests/unit/modules/user/bogus/thing.ts': reexport('./helper'),
      'tests/unit/modules/user/bogus/helper.ts': leaf('helper'),
    },
  },
  'tests-feature-name-lowercase': {
    files: {
      'tests/unit/modules/user/features/auth_form/components/thing.ts': reexport('./helper'),
      'tests/unit/modules/user/features/auth_form/components/helper.ts': leaf('helper'),
    },
  },
  'tests-feature-allowed-folders': {
    files: {
      'tests/unit/modules/user/features/auth/services/thing.ts': reexport('./helper'),
      'tests/unit/modules/user/features/auth/services/helper.ts': leaf('helper'),
    },
  },
  'src-module-name-kebab-case': {
    alsoFires: ['injectable-classes-no-value-imports'],
    files: {
      'src/modules/user_profile/store/thing.ts': reexport('./helper'),
      'src/modules/user_profile/store/helper.ts': leaf('helper'),
    },
  },
  'src-feature-name-kebab-case': {
    files: {
      'src/modules/user/features/auth_form/components/thing.ts': reexport('./helper'),
      'src/modules/user/features/auth_form/components/helper.ts': leaf('helper'),
    },
  },
  'type-files-imported-as-type-only': {
    files: {
      'src/services/thing/index.ts': reexport('./types/config'),
      'src/services/thing/types/config.ts': leaf('config'),
    },
  },
  'type-files-no-runtime-imports': {
    files: {
      'src/services/thing/types/config.ts': reexport('../helper'),
      'src/services/thing/helper.ts': leaf('helper'),
    },
  },
};
