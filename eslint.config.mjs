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

const tsGlobs = ['**/*.ts', '**/*.tsx'];
const jsGlobs = ['**/*.js', '**/*.jsx'];
const jsxGlobs = ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'];
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
      parserOptions: { project: './tsconfig.json' },
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
        typescript: { project: './tsconfig.json', alwaysTryTypes: true },
      },
    },
    rules: {
      ...importPlugin.flatConfigs.recommended.rules,
      ...importPlugin.flatConfigs.typescript.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      ...eslintComments.configs.recommended.rules,
      'eslint-comments/no-use': [
        'error',
        { allow: ['eslint-disable-next-line', 'eslint-disable', 'eslint-enable'] },
      ],
      'react/jsx-no-bind': 'warn',
      'no-await-in-loop': 'warn',
      'no-restricted-syntax': 'warn',
      'no-alert': 'error',
      'no-console': 'error',
      'import/prefer-default-export': 'warn',
      'max-len': ['error', { code: 150 }],
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
      'react/jsx-props-no-spreading': 'error',
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
      'no-console': 'error',
      'import/extensions': 'off',
      'prefer-template': 'off',
      'no-restricted-syntax': 'off',
      'import/no-unresolved': 'off',
      'import/no-cycle': 'off',
      'class-methods-use-this': 'off',
      'no-restricted-globals': 'off',
      'no-undef': 'off',
      'no-use-before-define': 'off',
      'import/no-extraneous-dependencies': ['error', importNoExtraneousDependenciesOptions],
      'import/no-dynamic-require': 'off',
      'global-require': 'off',
      'no-await-in-loop': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
    },
  },

  // Prettier last: disable all formatting-related rules.
  prettier,
];
