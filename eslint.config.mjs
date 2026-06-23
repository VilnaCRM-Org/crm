import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintComments from 'eslint-plugin-eslint-comments';
import importPlugin from 'eslint-plugin-import';
import jestDom from 'eslint-plugin-jest-dom';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
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
// live in dedicated type-only files (`<name>.types.ts`, `types.ts`, `types/**`). These
// selectors are re-included in every override that replaces `no-restricted-syntax` for
// non-React source so the type-declaration gate is never dropped by flat-config override.
const typeDeclarationSelectors = [
  {
    selector: 'TSInterfaceDeclaration',
    message:
      'No type declarations in logic files — move this interface to a sibling type-only file (`<name>.types.ts` or `types.ts`) (issue #88).',
  },
  {
    selector: 'TSTypeAliasDeclaration',
    message:
      'No type declarations in logic files — move this type alias to a sibling type-only file (`<name>.types.ts` or `types.ts`) (issue #88).',
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

const nonReactSourceGlobs = ['src/**/*.ts'];
const nonReactSourceIgnores = [
  '**/*.stories.*',
  '**/*.test.*',
  '**/*.spec.*',
  '**/*.d.ts',
  'src/**/use-*.ts',
  'src/**/types.ts',
  'src/**/types/**/*.ts',
  'src/**/*.types.ts',
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
      'react-hooks/exhaustive-deps': 'warn',
      ...eslintComments.configs.recommended.rules,
      'eslint-comments/no-use': 'error',
      'react/jsx-no-bind': 'warn',
      'no-await-in-loop': 'warn',
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

  // Source: production source must not ship `data-testid` (issue #90), and logic
  // files must not declare types — types live in dedicated type-only files
  // `types.ts`, `types/**`, `*.types.ts` (issue #88). Stories/tests/`.d.ts` and the
  // type-only files (governed by the separate override below) are excluded.
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
      'src/**/*.types.ts',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...dataTestidSelectors, ...typeDeclarationSelectors],
    },
  },

  // Type-only files (issue #88): `types.ts`, `types/**`, `*.types.ts` must contain
  // ONLY type-level constructs (interface, type, type-only import/re-export,
  // `declare`). Forbid runtime syntax so type files never carry logic. Ordered after the
  // no-static (#100) block below would be wrong — the no-static block ignores these globs,
  // so this override is the last (and only) one matching type-only files.
  {
    files: [
      'src/**/types.ts',
      'src/**/types/**/*.ts',
      'src/**/types/**/*.tsx',
      'src/**/*.types.ts',
    ],
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
  // files (governed by the override above). It re-includes the data-testid (#90) and
  // type-declaration (#88) selectors because flat config replaces (does not merge)
  // `no-restricted-syntax` for files matched by multiple blocks.
  {
    files: nonReactSourceGlobs,
    ignores: nonReactSourceIgnores,
    rules: {
      'no-restricted-syntax': [
        'error',
        ...dataTestidSelectors,
        ...noStaticOrFreeFunctionSelectors,
        ...typeDeclarationSelectors,
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
];
