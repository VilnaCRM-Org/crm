import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintComments from 'eslint-plugin-eslint-comments';
import importPlugin from 'eslint-plugin-import';
import jest from 'eslint-plugin-jest';
import jestDom from 'eslint-plugin-jest-dom';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import noUnsanitized from 'eslint-plugin-no-unsanitized';
import playwright from 'eslint-plugin-playwright';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import security from 'eslint-plugin-security';
import storybook from 'eslint-plugin-storybook';
import testingLibrary from 'eslint-plugin-testing-library';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const tsconfigPath = path.join(rootDir, 'tsconfig.json');

const testFilePatterns = [
  '**/*.test.js',
  '**/*.test.jsx',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.js',
  '**/*.spec.jsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/*.integration.test.ts',
  '**/*.integration.test.tsx',
  'tests/load/**/*.js',
  'tests/**/*.js',
  'tests/**/*.jsx',
  'tests/**/*.ts',
  'tests/**/*.tsx',
  'tests/integration/**/*.ts',
  'tests/integration/**/*.tsx',
];

const devDependencyPatterns = [
  'eslint.config.mjs',
  'jest.setup.ts',
  'playwright.config.ts',
  'rsbuild.config.ts',
  'codegen.ts',
  ...testFilePatterns,
];

const importNoExtraneousDependenciesOptions = {
  devDependencies: devDependencyPatterns,
  packageDir: [rootDir],
};

const testImportNoExtraneousDependenciesOptions = {
  devDependencies: true,
  packageDir: [rootDir],
};

const tsGlobs = ['**/*.ts', '**/*.tsx'];
const jsGlobs = ['**/*.js', '**/*.jsx'];
const jsxGlobs = ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'];

// Source (issue #90): production source must not ship `data-testid`.
const dataTestidSelectors = [
  {
    selector: "JSXAttribute[name.name='data-testid']",
    message:
      'No data-testid in source — expose a stable id or query by role/label/text (issue #90).',
  },
  {
    selector: "Property[key.value='data-testid']",
    message: 'No data-testid prop in source — use an id instead (issue #90).',
  },
  {
    selector: "TSPropertySignature[key.value='data-testid']",
    message: 'No data-testid prop type in source — expose an id prop instead (issue #90).',
  },
];

// Source (issue #88): logic files must not declare types — interfaces and type aliases
// live in the per-feature/area `types/` folder (or a `types.ts`), never beside the logic.
// These selectors are re-included in every override that replaces `no-restricted-syntax` for
// non-React source so the type-declaration gate is never dropped by flat-config override.
const typeDeclarationSelectors = [
  {
    selector: 'TSInterfaceDeclaration',
    message:
      'No type declarations in logic files — move this interface to the nearest feature/area `types/` folder (e.g. `@auth/types/<group>/<name>`), not beside the component (issue #88).',
  },
  {
    selector: 'TSTypeAliasDeclaration',
    message:
      'No type declarations in logic files — move this type alias to the nearest feature/area `types/` folder (e.g. `@auth/types/<group>/<name>`), not beside the component (issue #88).',
  },
];

// Source (issue #100): non-React application code (services, repositories, mappers,
// factories, stores, utils) must not use `static` members or standalone functions.
// Static methods and free functions bind at the call site and resist substitution in
// tests; instance methods on injectable classes can be swapped for mocks/spies via the
// tsyringe DI container. React components and hooks are exempt (they are functions by
// definition) — this block targets `src/**/*.ts` only and ignores `use-*` hook files.
const noStaticOrFreeFunctionSelectors = [
  {
    selector: 'MethodDefinition[static=true]',
    message:
      'No static methods in non-React source — use an injectable instance method resolved via the DI container so collaborators can be mocked (issue #100).',
  },
  {
    selector: 'PropertyDefinition[static=true]',
    message:
      'No static fields in non-React source — hold state on an injectable instance instead (issue #100).',
  },
  {
    selector: 'Program > FunctionDeclaration',
    message:
      'No standalone functions in non-React source — make it an instance method on an injectable class (issue #100).',
  },
  {
    selector: 'Program > ExportNamedDeclaration > FunctionDeclaration',
    message:
      'No exported standalone functions in non-React source — make it an instance method on an injectable class (issue #100).',
  },
  {
    selector: 'ExportDefaultDeclaration > FunctionDeclaration',
    message:
      'No default-exported standalone functions in non-React source — make it an instance method on an injectable class (issue #100).',
  },
  {
    selector:
      "Program > VariableDeclaration > VariableDeclarator[init.type='ArrowFunctionExpression'], Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[init.type='ArrowFunctionExpression'], ExportDefaultDeclaration > ArrowFunctionExpression",
    message:
      'No top-level arrow functions in non-React source — make it an instance method on an injectable class (issue #100).',
  },
  {
    selector:
      "Program > VariableDeclaration > VariableDeclarator[init.type='FunctionExpression'], Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[init.type='FunctionExpression'], ExportDefaultDeclaration > FunctionExpression",
    message:
      'No top-level function expressions in non-React source — make it an instance method on an injectable class (issue #100).',
  },
];

// Source (issue #180): close the acknowledged issue-#89/#100 residual. The selectors above
// match only `Program`/export-level function declarations, so logic smuggled into a TOP-LEVEL
// object literal's function-valued properties (`export default { map(r) { … } }`) bypasses the
// whole gate — the trivially discoverable evasion is "wrap your free functions in an object".
// ESTree gives method shorthand (`{ m() {} }`) `value.type === 'FunctionExpression'`, so one
// value-type match covers shorthand, arrow, and function-expression properties alike; the
// `as const` / `satisfies` holders close the wrapper bypass. Accepted residuals (review-gate,
// deliberately NOT matched — widening to arbitrary-depth `Property` would flag idiomatic nested
// MUI `sx` callbacks and zustand-style slices): nested (depth > 1) literals, `Object.freeze()`
// wrappers, and dynamic property assignment (`obj.method = fn`).
const objectLiteralFnProperty =
  'Property[value.type=/^(ArrowFunctionExpression|FunctionExpression)$/]';
const objectLiteralHolders = [
  'ObjectExpression',
  'TSAsExpression > ObjectExpression',
  'TSSatisfiesExpression > ObjectExpression',
];
const objectLiteralRoots = [
  'Program > VariableDeclaration > VariableDeclarator',
  'Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator',
  'ExportDefaultDeclaration',
];
const noObjectLiteralMethodSelectors = [
  {
    selector: objectLiteralRoots
      .flatMap((root) =>
        objectLiteralHolders.map((holder) => `${root} > ${holder} > ${objectLiteralFnProperty}`)
      )
      .join(', '),
    message:
      'No logic in top-level object-literal methods in non-React source — make it an instance ' +
      'method on an injectable class or module-singleton class (issues #89/#100/#180).',
  },
];

// Source (issue #112): non-React application code must not read `process.env` directly —
// import the validated, typed configuration from `@/config/env` (or the paint-safe
// `@/config/env/raw-env`) instead. The `src/config/env/**` module is the single sanctioned
// place that touches `process.env`; it is exempted by the override below. Re-included in the
// non-React `.ts` block because flat config replaces (does not merge) `no-restricted-syntax`.
const noProcessEnvSelectors = [
  {
    // `[property.name='env']` catches `process.env` and `process?.env`; `[property.value='env']`
    // catches the computed forms `process['env']` and `process?.['env']`.
    selector:
      "MemberExpression[object.name='process'][property.name='env']," +
      "MemberExpression[object.name='process'][property.value='env']",
    message:
      'No raw process.env reads in non-React source — import the validated env from ' +
      '@/config/env (or @/config/env/raw-env on the paint path) (issue #112).',
  },
];

// Source (issue #155): locale-sensitive rendering must go through the LocaleFormatter
// service (src/services/locale-formatter/) or the i18next formatters registered in
// src/i18n.js — never ad-hoc `Intl.*` construction or `toLocale*` calls at call sites.
// The service caches formatter instances and keys the locale off the active i18next
// language; scattered call-site construction drifts locales and defeats that cache.
// Re-included in every overlapping block because flat config replaces `no-restricted-syntax`.
const noRawIntlSelectors = [
  {
    selector: 'CallExpression[callee.property.name=/^toLocale(String|DateString|TimeString)$/]',
    message:
      'No raw toLocale* formatting — use the LocaleFormatter service ' +
      '(@/services/locale-formatter) or an i18next formatter such as ' +
      '{{value, datetime}} (issue #155).',
  },
  {
    selector: 'CallExpression[callee.property.value=/^toLocale(String|DateString|TimeString)$/]',
    message:
      'No raw toLocale* formatting via computed access — use the LocaleFormatter service ' +
      '(@/services/locale-formatter) or an i18next formatter such as ' +
      '{{value, datetime}} (issue #155).',
  },
  {
    selector: "MemberExpression[object.name='Intl']",
    message:
      'No raw Intl.* usage — use the LocaleFormatter service ' +
      '(@/services/locale-formatter) or an i18next formatter such as ' +
      '{{value, currency}}, extending the service when it lacks a needed ' +
      'Intl capability (issue #155).',
  },
];

const nonReactSourceGlobs = ['src/**/*.ts'];
const nonReactSourceIgnores = [
  '**/*.stories.*',
  '**/*.test.*',
  '**/*.spec.*',
  '**/*.d.ts',
  'src/**/use-*.ts',
  'src/**/types.ts',
  'src/**/types/**/*.ts',
];
const storyGlobs = ['**/*.stories.js', '**/*.stories.jsx', '**/*.stories.ts', '**/*.stories.tsx'];

export default [
  {
    ignores: [
      'node_modules/**',
      'docker-compose.yml',
      'bun.lock*',
      'build/**',
      'coverage/**',
      'stryker.config.mjs',
      'stryker.shard.config.mjs',
      '.stryker-tmp/**',
      '.storybook/**',
      'storybook-static/**',
      'eslint.config.mjs',
      'memlab/**',
      'scripts/**',
      'checkNodeVersion.js',
      'out/**',
      'docker/**',
      'playwright-report/**',
      // Generated API contract artifacts — build output, never hand-edited or linted.
      // Excluded here the same way generated i18n JSON is kept out of the source gates.
      'src/api/generated/**',
    ],
  },

  // Base: eslint:recommended for every linted file.
  {
    files: jsxGlobs,
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, ...globals.jest },
    },
  },

  // Shared plugin registry so plugin-prefixed rules resolve in every
  // config object below (flat config does not inherit plugins).
  {
    files: jsxGlobs,
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'eslint-comments': eslintComments,
      'testing-library': testingLibrary,
      'jest-dom': jestDom,
    },
  },

  // React (recommended + new JSX runtime — no React import needed).
  {
    files: jsxGlobs,
    ...react.configs.flat.recommended,
    settings: { react: { version: 'detect' } },
  },
  {
    files: jsxGlobs,
    ...react.configs.flat['jsx-runtime'],
  },

  // TypeScript: type-aware parser + @typescript-eslint/recommended.
  { ...tsPlugin.configs['flat/eslint-recommended'], files: tsGlobs },
  ...tsPlugin.configs['flat/recommended'].map((config) => ({
    ...config,
    files: tsGlobs,
  })),
  // testing-library / jest-dom applied across all TS sources (legacy
  // parity: these were in the `**/*.ts,**/*.tsx` override).
  {
    files: tsGlobs,
    ignores: ['**/*.d.ts'],
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
      ...jestDom.configs['flat/recommended'].rules,
    },
  },

  {
    files: tsGlobs,
    ignores: ['**/*.d.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { project: tsconfigPath },
      globals: { ...globals.node, ...globals.browser, ...globals.jest },
    },
    plugins: {
      import: importPlugin,
      'eslint-comments': eslintComments,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: { version: 'detect' },
      'import/internal-regex': '^@/',
      'import/resolver': {
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'] },
        typescript: { project: tsconfigPath, alwaysTryTypes: true },
      },
    },
    rules: {
      ...importPlugin.flatConfigs.recommended.rules,
      ...importPlugin.flatConfigs.typescript.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      // issue #164: promoted from 'warn' — a missing hook dependency ships stale-closure
      // bugs with a green ESLint status; zero violations today, so the flip is free. Since
      // `eslint-comments/no-use` bans all disable directives, intentional mount-only effects
      // must be restructured (refs / stored-callback), never suppressed. See CLAUDE.md.
      'react-hooks/exhaustive-deps': 'error',
      ...eslintComments.configs.recommended.rules,
      'eslint-comments/no-use': 'error',
      // issue #164: `react/jsx-no-bind` deliberately stays 'warn' — React's guidance does not
      // treat inline handler props as a defect, and with disables banned, promoting it would
      // force useCallback everywhere with no escape hatch (see issue #164 scope decision 2).
      'react/jsx-no-bind': 'warn',
      // issue #164: promoted from 'warn' — sequential-await perf regressions in src merged
      // silently; zero violations today. Tests stay 'off' (test-file override below).
      'no-await-in-loop': 'error',
      'no-restricted-syntax': 'warn',
      'no-alert': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'import/prefer-default-export': 'warn',
      'max-len': ['error', { code: 100 }],
      'eslint-comments/disable-enable-pair': 'off',
      'no-restricted-imports': ['error', { patterns: ['@/features/*/*'] }],
      'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['state'] }],
      'no-extra-semi': 'off',
      'class-methods-use-this': 'off',
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'no-multiple-empty-lines': [2, { max: 2, maxEOF: 0 }],
      'linebreak-style': ['error', 'unix'],
      'react/prop-types': 'off',
      'import/no-extraneous-dependencies': ['error', importNoExtraneousDependenciesOptions],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
          pathGroups: [{ pattern: '@/stores/hooks', group: 'internal', position: 'before' }],
          pathGroupsExcludedImportTypes: ['builtin', 'external', 'object'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-named-as-default': 'off',
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
      'react/jsx-props-no-spreading': ['error', { exceptions: ['TextField', 'FormProvider'] }],
      'react/react-in-jsx-scope': 'off',
      'react/require-default-props': 'off',
      'react/jsx-filename-extension': ['error', { extensions: ['.jsx', '.tsx'] }],
      'jsx-a11y/anchor-is-valid': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      semi: 'off',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit', overrides: { constructors: 'no-public' } },
      ],
      '@typescript-eslint/member-ordering': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': ['off'],
      '@typescript-eslint/no-empty-function': ['off'],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-unused-vars': 'off',
    },
  },

  // Plain JS/JSX: no type-aware project, relax TS-specific rules.
  {
    files: jsGlobs,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, ...globals.jest },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Storybook stories.
  ...storybook.configs['flat/recommended'].map((config) => ({
    ...config,
    files: storyGlobs,
  })),

  // Type declaration files: allow `require()` style imports.
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Tests: relaxed import/runtime rules.
  {
    files: testFilePatterns,
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, ...globals.jest },
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'import/extensions': 'off',
      'prefer-template': 'off',
      'no-restricted-syntax': 'off',
      'import/no-unresolved': 'off',
      'import/no-cycle': 'off',
      'class-methods-use-this': 'off',
      'no-restricted-globals': 'off',
      'no-undef': 'off',
      'no-use-before-define': 'off',
      'import/no-extraneous-dependencies': ['error', testImportNoExtraneousDependenciesOptions],
      'import/no-dynamic-require': 'off',
      'global-require': 'off',
      'no-await-in-loop': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
    },
  },

  // Source: production source must not ship `data-testid` (issue #90), logic
  // files must not declare types — types live in dedicated type-only files:
  // `types.ts` or the per-feature/area `types/**` folders (issue #88) — and locale-sensitive
  // rendering must go through the LocaleFormatter service, never raw `Intl`/`toLocale*`
  // (issue #155). Stories/tests/`.d.ts` and the type-only files (governed by the separate
  // override below) are excluded.
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
    ignores: [
      '**/*.stories.*',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.d.ts',
      'src/**/types.ts',
      'src/**/types/**/*.ts',
      'src/**/types/**/*.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...dataTestidSelectors,
        ...typeDeclarationSelectors,
        ...noRawIntlSelectors,
      ],
    },
  },

  // Source (issue #173): deterministic lint-level SAST over the dominant SPA XSS and
  // code-execution sink classes. This is the only security analysis that runs pre-commit
  // (Husky) and fails in seconds; CodeQL (`security testing`) is the complementary
  // dataflow layer. `eslint-suppressions.yml` already forbids inline suppression
  // directives, so these rules cannot be bypassed at the call site — fix the sink,
  // never silence it.
  // The rule set is deliberately frozen: `eslint-plugin-security`'s recommended preset is
  // NOT adopted (`detect-object-injection` et al. is noise), and
  // `security/detect-non-literal-regexp` is omitted because the auth name/email validators
  // legitimately compose `RegExp` from constant template literals.
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/*.stories.*', '**/*.test.*', '**/*.spec.*', '**/*.d.ts'],
    plugins: { 'no-unsanitized': noUnsanitized, security },
    rules: {
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
      'react/no-danger': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-unsafe-regex': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },

  // Type-only files (issue #88): `types.ts` and the per-feature/area `types/` folders must
  // contain ONLY type-level constructs (interface, type, type-only import/re-export,
  // `declare`). Forbid runtime syntax so type files never carry logic. Ordered after the
  // no-static (#100) block below would be wrong — the no-static block ignores these globs,
  // so this override is the last (and only) one matching type-only files. Sibling
  // `<name>.types.ts` files are intentionally NOT type-only here: types live in `types/`.
  {
    files: ['src/**/types.ts', 'src/**/types/**/*.ts', 'src/**/types/**/*.tsx'],
    ignores: ['**/*.stories.*', '**/*.test.*', '**/*.spec.*', '**/*.d.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'VariableDeclaration:not([declare=true])',
          message:
            'Type-only files must not declare runtime variables — use a type, or `declare const` for ambient typings (issue #88).',
        },
        {
          selector: 'FunctionDeclaration:not([declare=true])',
          message:
            'Type-only files must not declare functions — use a type, or `declare function` for ambient typings (issue #88).',
        },
        {
          selector: 'ClassDeclaration:not([declare=true])',
          message:
            'Type-only files must not declare classes — use an interface, or `declare class` for ambient typings (issue #88).',
        },
        {
          selector: 'TSEnumDeclaration:not([declare=true])',
          message:
            'Type-only files must not declare runtime enums — use a union type or a `declare enum` (issue #88).',
        },
        {
          selector:
            'ExpressionStatement, IfStatement, ForStatement, ForInStatement, ForOfStatement, WhileStatement, DoWhileStatement, SwitchStatement, TryStatement, ThrowStatement, WithStatement, LabeledStatement, DebuggerStatement',
          message: 'Type-only files must not contain runtime statements (issue #88).',
        },
        {
          selector: 'ExportDefaultDeclaration > *:not(TSInterfaceDeclaration)',
          message:
            'Type-only files must not default-export a runtime value — only `export default interface` is allowed (issue #88).',
        },
        {
          selector: "TSPropertySignature[key.value='data-testid']",
          message: 'No data-testid prop type in source — expose an id prop instead (issue #90).',
        },
      ],
    },
  },

  // Source (issue #100): forbid `static` members and standalone functions in non-React
  // application code. This block matches `src/**/*.ts` only (so `.tsx` components and
  // class error boundaries are exempt) and ignores `use-*` hook files plus the type-only
  // files (governed by the override above). It re-includes the data-testid (#90),
  // type-declaration (#88), process.env (#112), and raw-Intl (#155) selectors because
  // flat config replaces (does not merge) `no-restricted-syntax` for files matched by
  // multiple blocks.
  {
    files: nonReactSourceGlobs,
    ignores: nonReactSourceIgnores,
    rules: {
      'no-restricted-syntax': [
        'error',
        ...dataTestidSelectors,
        ...noStaticOrFreeFunctionSelectors,
        ...noObjectLiteralMethodSelectors,
        ...typeDeclarationSelectors,
        ...noProcessEnvSelectors,
        ...noRawIntlSelectors,
      ],
    },
  },

  // Source (issue #112): the `src/config/env/**` module IS the sanctioned boundary that
  // reads `process.env`, so the process.env ban is lifted here. The #90/#88/#100/#155
  // selectors are re-included (flat config replaces, does not merge). Ordered after the
  // non-React `.ts` block so it wins for env files; env type-only files stay governed by
  // the override above.
  {
    files: ['src/config/env/**/*.ts'],
    ignores: [
      '**/*.stories.*',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.d.ts',
      'src/config/env/**/types.ts',
      'src/config/env/**/types/**/*.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...dataTestidSelectors,
        ...noStaticOrFreeFunctionSelectors,
        ...noObjectLiteralMethodSelectors,
        ...typeDeclarationSelectors,
        ...noRawIntlSelectors,
      ],
    },
  },

  // Source (issue #155): the `src/services/locale-formatter/**` service IS the sanctioned
  // Intl boundary, so the raw-Intl ban is lifted here (and only here). Every other selector
  // — #90, #100, #88, #112 — is re-included (flat config replaces, does not merge). Ordered
  // after the non-React `.ts` block so it wins for the formatter's files; the formatter's
  // contract types live under `src/services/types/` and stay governed by the type-only
  // override above.
  {
    files: ['src/services/locale-formatter/**/*.ts'],
    ignores: [
      '**/*.stories.*',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.d.ts',
      'src/services/locale-formatter/**/types.ts',
      'src/services/locale-formatter/**/types/**/*.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...dataTestidSelectors,
        ...noStaticOrFreeFunctionSelectors,
        ...typeDeclarationSelectors,
        ...noProcessEnvSelectors,
      ],
    },
  },

  // Source (issue #112): React hooks (`src/**/use-*.ts`) are exempt from the #100 no-free-function
  // rule (they are functions), so the non-React `.ts` block above ignores them — but they must
  // still not read raw `process.env` or construct raw Intl formatters. Re-include the #90/#88
  // selectors plus the process.env (#112) and raw-Intl (#155) bans.
  {
    files: ['src/**/use-*.ts'],
    ignores: [
      '**/*.stories.*',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.d.ts',
      'src/**/types.ts',
      'src/**/types/**/*.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...dataTestidSelectors,
        ...typeDeclarationSelectors,
        ...noProcessEnvSelectors,
        ...noRawIntlSelectors,
      ],
    },
  },

  // Tests (issue #90): discourage *ByTestId — prefer getByRole/getByLabelText/
  // getByText, falling back to a stable id. `warn` during staged migration
  // (mock-stub queries remain valid); promote to `error` once the suite is clean.
  {
    files: testFilePatterns,
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            'CallExpression[callee.property.name=/^(get|query|find)(All)?ByTestId$/], CallExpression[callee.name=/^(get|query|find)(All)?ByTestId$/]',
          message:
            'Prefer getByRole/getByLabelText/getByText; *ByTestId is a last resort (issue #90).',
        },
      ],
    },
  },

  // Tests (issue #167): a test that is skipped, focused, or asserts nothing reports
  // verification while verifying nothing — and the 100/100/100/100 Jest coverage gate
  // measures execution, not assertion, so it stays green either way. `forbidOnly` in
  // `playwright.config.ts` catches only `.only`; `.skip`/`.fixme`/`xit` merged silently.
  // Structural rules land at `error`; the two behavioral rules start at `warn` pending the
  // conditional-assertion burndown, then get promoted. Spec files only — helpers under
  // `tests/visual/` and `tests/utils/` are not test bodies.
  {
    files: ['tests/e2e/**/*.spec.ts', 'tests/visual/**/*.spec.ts'],
    plugins: { playwright },
    rules: {
      // `disallowFixme` is required: the rule's default only covers `.skip`, and the
      // repo's live bypasses were `test.fixme`. `allowConditional` stays at its `false`
      // default so a runtime-conditional skip is a finding too.
      'playwright/no-skipped-test': ['error', { disallowFixme: true }],
      'playwright/no-focused-test': 'error',
      // A `take*Snapshot` helper IS the assertion in every visual spec (it calls
      // `expect(...).toHaveScreenshot()`), so the convention is declared, not suppressed.
      'playwright/expect-expect': ['error', { assertFunctionPatterns: ['^take\\w*Snapshot$'] }],
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-wait-for-timeout': 'warn',
    },
  },
  {
    // These globs mirror `jest.config.ts` `testMatch` exactly — the client runner executes
    // `tests/unit/**/*.test.{ts,tsx,js,jsx}`, so the `.js`/`.jsx` suites (localization
    // generator, load config, memlab scenario validation, performance meta-tests) must be
    // gated too or the policy stops at the file extension rather than at the runner.
    files: [
      'tests/unit/**/*.ts',
      'tests/unit/**/*.tsx',
      'tests/unit/**/*.js',
      'tests/unit/**/*.jsx',
      'tests/integration/**/*.ts',
      'tests/integration/**/*.tsx',
      'tests/apollo-server/**/*.ts',
    ],
    plugins: { jest },
    rules: {
      // `expect*` declares the repo's shared assertion helpers (e.g.
      // `expectReviewRangePairOrder`) by naming convention rather than one-off allowances.
      'jest/expect-expect': ['error', { assertFunctionNames: ['expect', 'expect*'] }],
      'jest/no-disabled-tests': 'error',
      // `no-disabled-tests` covers `.skip`/`xit` only. Jest has no `forbidOnly` equivalent
      // to Playwright's, so a committed `it.only` would silently shrink the CI suite.
      'jest/no-focused-tests': 'error',
      'jest/no-conditional-expect': 'error',
    },
  },

  // K6 load test scripts: console output is the idiomatic logging channel.
  {
    files: ['tests/load/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },

  // Prettier last: disable all formatting-related rules.
  prettier,

  // Re-enable max-len after prettier (prettier turns it off as a formatting rule).
  {
    files: jsxGlobs,
    rules: {
      'max-len': ['error', { code: 100 }],
    },
  },

  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/modules/**', 'src/routes/**', 'src/config/dependency-injection-config.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*', '!@/features/*/index'],
              message: 'Import a feature through its public API barrel, not a deep internal path.',
            },
            {
              group: ['@/modules/*/*', '!@/modules/*/index'],
              message:
                'Import a module through its public API barrel (e.g. @/modules/user), ' +
                'not a deep internal path.',
            },
            {
              group: ['@auth/*/*'],
              message: 'Import the auth feature through its public API (@auth), not a deep path.',
            },
          ],
        },
      ],
    },
  },

  {
    files: [
      'src/modules/*/store/**/*.ts',
      'src/modules/*/store/**/*.tsx',
      'src/modules/*/types/**/*.ts',
      'src/modules/*/types/**/*.tsx',
      'src/modules/*/lib/**/*.ts',
      'src/modules/*/lib/**/*.tsx',
      'src/modules/*/hooks/**/*.ts',
      'src/modules/*/hooks/**/*.tsx',
      'src/modules/*/utils/**/*.ts',
      'src/modules/*/utils/**/*.tsx',
      'src/modules/*/config/**/*.ts',
      'src/modules/*/config/**/*.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*', '!@/features/*/index'],
              message: 'Import a feature through its public API barrel, not a deep internal path.',
            },
            {
              group: ['@auth/*/*'],
              message: 'Import the auth feature through its public API (@auth), not a deep path.',
            },
            {
              group: ['@/modules/*/features/*/*', '!@/modules/*/features/*/index'],
              message:
                'Import a feature through its public API barrel (feature index), ' +
                'not a deep internal path.',
            },
          ],
        },
      ],
    },
  },

  // Issue #109: a module DI composition root (config/di.ts) wires its own module's feature
  // internals into the container, so — like the aggregating root — it must deep-import them
  // (@auth/*, @/modules/*/features/*). ESLint patterns cannot express "own module only", so this
  // override deliberately keeps only the shared @/features/* guard and delegates the
  // module/feature-boundary enforcement to dependency-cruiser: no-feature-internal-imports exempts
  // this file (allowing the own-module deep imports), while no-composition-root-cross-module-imports
  // + no-cross-module-imports still forbid reaching into a sibling module.
  {
    files: ['src/modules/*/config/di.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*', '!@/features/*/index'],
              message: 'Import a feature through its public API barrel, not a deep internal path.',
            },
          ],
        },
      ],
    },
  },
];
