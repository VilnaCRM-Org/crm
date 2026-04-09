import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: rootDir,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

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

export default [
  ...compat.config({
    root: true,
    env: {
      node: true,
      es6: true,
      jest: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: { ecmaVersion: 2022, sourceType: 'module', project: './tsconfig.json' },
    plugins: ['@typescript-eslint', 'eslint-comments'],
    ignorePatterns: [
      'node_modules/*',
      'docker-compose.yml',
      'bun.lock*',
      'build/*',
      'coverage/*',
      'stryker.config.mjs',
      'storybook-static/*',
      'eslint.config.mjs',
      'memlab/*',
      'scripts/**',
      '!scripts/cloudfront_routing.js',
      'checkNodeVersion.js',
      'out/*',
      'docker/*',
      'playwright-report/*',
    ],
    extends: [
      'eslint:recommended',
      'airbnb',
      'airbnb/hooks',
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended',
      'prettier',
    ],
    overrides: [
      {
        files: ['scripts/cloudfront_routing.js'],
        env: {
          node: true,
          es6: false,
        },
        parserOptions: {
          ecmaVersion: 5,
          sourceType: 'script',
        },
        rules: {
          'no-var': 'off',
          'prefer-const': 'off',
          'prefer-destructuring': 'off',
          'no-console': 'warn',
          'no-unused-vars': 'off',
          strict: ['error', 'global'],
          '@typescript-eslint/no-require-imports': 'off',
          '@typescript-eslint/no-var-requires': 'off',
          '@typescript-eslint/no-unused-vars': 'off',
        },
      },
      {
        files: ['**/*.js', '**/*.jsx'],
        env: {
          browser: true,
          node: true,
          es6: true,
        },
        rules: {
          '@typescript-eslint/no-require-imports': 'off',
          '@typescript-eslint/no-var-requires': 'off',
          '@typescript-eslint/no-unused-vars': 'off',
        },
      },
      {
        files: ['**/*.d.ts'],
        rules: {
          '@typescript-eslint/no-require-imports': 'off',
        },
      },
      {
        files: ['**/*.ts', '**/*.tsx'],
        excludedFiles: ['**/*.d.ts'],
        settings: {
          react: { version: 'detect' },
          'import/internal-regex': '^@/',
          'import/resolver': {
            node: {
              extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
            },
            typescript: {
              project: './tsconfig.json',
              alwaysTryTypes: true,
            },
          },
        },
        env: {
          browser: true,
          node: true,
          es6: true,
        },
        extends: [
          'eslint:recommended',
          'plugin:import/errors',
          'plugin:import/warnings',
          'plugin:import/typescript',
          'plugin:@typescript-eslint/recommended',
          'plugin:react/recommended',
          'plugin:react-hooks/recommended',
          'plugin:jsx-a11y/recommended',
          'plugin:testing-library/react',
          'plugin:jest-dom/recommended',
          'plugin:eslint-comments/recommended',
        ],
        rules: {
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
          'no-restricted-imports': [
            'error',
            {
              patterns: ['@/features/*/*'],
            },
          ],
          'no-param-reassign': [
            'error',
            {
              props: true,
              ignorePropertyModificationsFor: ['state'],
            },
          ],
          'no-extra-semi': 'off',
          'class-methods-use-this': 'off',
          quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
          'no-multiple-empty-lines': [2, { max: 2, maxEOF: 0 }],
          'linebreak-style': ['error', 'unix'],
          'react/prop-types': 'off',
          'import/no-extraneous-dependencies': [
            'error',
            importNoExtraneousDependenciesOptions,
          ],
          'import/order': [
            'error',
            {
              groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
              pathGroups: [
                {
                  pattern: '@/stores/hooks',
                  group: 'internal',
                  position: 'before',
                },
              ],
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
            {
              accessibility: 'explicit',
              overrides: {
                constructors: 'no-public',
              },
            },
          ],
          '@typescript-eslint/member-ordering': 'error',
          '@typescript-eslint/explicit-function-return-type': 'error',
          '@typescript-eslint/explicit-module-boundary-types': ['off'],
          '@typescript-eslint/no-empty-function': ['off'],
          '@typescript-eslint/no-explicit-any': 'error',
          'no-unused-vars': 'off',
        },
      },
      {
        files: testFilePatterns,
        parser: '@typescript-eslint/parser',
        extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
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
          'import/no-extraneous-dependencies': [
            'error',
            importNoExtraneousDependenciesOptions,
          ],
          'import/no-dynamic-require': 'off',
          'global-require': 'off',
          'no-await-in-loop': 'off',
          'react/react-in-jsx-scope': 'off',
          '@typescript-eslint/no-require-imports': 'off',
          '@typescript-eslint/no-var-requires': 'off',
          '@typescript-eslint/no-unused-vars': 'off',
          'no-unused-vars': 'off',
        },
      },
    ],
  }),
];
