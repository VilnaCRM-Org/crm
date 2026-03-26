# ESLint v8 → v9 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate ESLint from v8 (legacy `.eslintrc.js`) to v9 (flat config `eslint.config.mjs`) using the FlatCompat bridge, with no rule changes.

**Architecture:** Wrap the entire existing `.eslintrc.js` content verbatim inside `compat.config({...})` from `@eslint/eslintrc`. Delete `.eslintrc.js` and `.eslintignore`. Merge `.eslintignore` entries into `ignorePatterns`. Bump `eslint`, add `@eslint/js`, `@eslint/eslintrc` as direct deps, and upgrade `eslint-plugin-react-hooks` to v5 (required for ESLint v9 peer compat).

**Tech Stack:** ESLint v9, `@eslint/eslintrc` FlatCompat, `@eslint/js`, Bun package manager

---

### Task 1: Create branch and update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Create branch from main**

```bash
git checkout main && git pull && git checkout -b chore/16-migrate-eslint-v9
```

- [ ] **Step 2: Update ESLint-related packages in `package.json`**

In the `devDependencies` section, make these changes:

```json
"@eslint/eslintrc": "^3.3.1",
"@eslint/js": "^9.23.0",
"eslint": "^9.23.0",
"eslint-plugin-react-hooks": "^5.2.0",
```

The other ESLint packages (`@typescript-eslint/*`, `eslint-config-airbnb`, `eslint-config-airbnb-typescript`, `eslint-config-prettier`, `eslint-import-resolver-typescript`, `eslint-plugin-eslint-comments`, `eslint-plugin-import`, `eslint-plugin-jest-dom`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`, `eslint-plugin-storybook`, `eslint-plugin-testing-library`) stay at their current versions.

- [ ] **Step 3: Install updated dependencies**

```bash
bun install
```

Expected: lockfile updated, no peer dependency errors.

- [ ] **Step 4: Commit the package changes**

```bash
git add package.json bun.lock
git commit -m "chore: bump eslint to v9 and add flat config deps"
```

---

### Task 2: Create `eslint.config.mjs`

**Files:**
- Create: `eslint.config.mjs`

- [ ] **Step 1: Create `eslint.config.mjs` with the complete flat config**

```js
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const compat = new FlatCompat({
  baseDirectory: path.dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

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
      'storybook-static/*',
      'eslint.config.mjs',
      'memlab/*',
      'scripts/*',
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
          strict: ['error', 'global'],
        },
      },
      {
        files: ['**/*.js', '**/*.jsx'],
        env: {
          browser: true,
          node: true,
          es6: true,
        },
      },
      {
        files: ['**/*.ts', '**/*.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
        parser: '@typescript-eslint/parser',
        plugins: ['@typescript-eslint', 'eslint-comments'],
        settings: {
          react: { version: 'detect' },
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
          'import/no-extraneous-dependencies': 'off',
          'import/order': [
            'error',
            {
              groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
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
          '@typescript-eslint/semi': ['error', 'always'],
          '@typescript-eslint/member-delimiter-style': [
            'error',
            {
              overrides: {
                interface: {
                  multiline: {
                    delimiter: 'semi',
                    requireLast: true,
                  },
                },
              },
            },
          ],
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
          '@typescript-eslint/no-var-requires': ['off'],
          'no-unused-vars': 'off',
        },
      },
      {
        files: [
          '**/*.ts',
          '**/*.js',
          '**/*.spec.js',
          '**/*.spec.jsx',
          '**/*.spec.ts',
          '**/*.spec.tsx',
          '**/*.integration.test.ts',
          '**/*.integration.test.tsx',
          'test/load/**/*.js',
          'tests/integration/**/*.ts',
          'tests/integration/**/*.tsx',
        ],
        parser: '@typescript-eslint/parser',
        extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
        rules: {
          'no-console': 'error',
          'import/extensions': ['off', 'never', { js: 'never', jsx: 'never' }],
          'prefer-template': 'off',
          'no-restricted-syntax': 'off',
          'import/no-unresolved': 'off',
          'import/no-cycle': 'off',
          'class-methods-use-this': 'off',
          'no-restricted-globals': 'off',
          'no-undef': 'off',
          'no-use-before-define': 'off',
          'import/no-extraneous-dependencies': 'off',
          'import/no-dynamic-require': 'off',
          'global-require': 'off',
          'no-await-in-loop': 'off',
          'react/react-in-jsx-scope': 'off',
          '@typescript-eslint/no-var-requires': 'off',
          'no-unused-vars': 'off',
        },
      },
    ],
  }),
];
```

- [ ] **Step 2: Commit the new config**

```bash
git add eslint.config.mjs
git commit -m "chore: add eslint flat config with FlatCompat bridge"
```

---

### Task 3: Remove legacy config files

**Files:**
- Delete: `.eslintrc.js`
- Delete: `.eslintignore`

- [ ] **Step 1: Delete the legacy config files**

```bash
rm .eslintrc.js .eslintignore
```

- [ ] **Step 2: Commit the deletions**

```bash
git add -u .eslintrc.js .eslintignore
git commit -m "chore: remove legacy eslintrc and eslintignore"
```

---

### Task 4: Verify linting works

- [ ] **Step 1: Run ESLint**

```bash
make lint-eslint
```

Expected: exits with code 0 (or the same non-zero violations that existed before the migration — count should not increase).

- [ ] **Step 2: If lint fails with config/parse errors (not rule violations)**

These are migration issues to investigate:

- `Error: Failed to load config "airbnb"` → `eslint-config-airbnb` not resolving through FlatCompat. Ensure `@eslint/eslintrc ^3.x` is installed (`cat node_modules/@eslint/eslintrc/package.json | grep version`).
- `Error: Cannot find module 'eslint-plugin-react-hooks'` → `bun install` didn't complete. Re-run `bun install`.
- `Parsing error: "parserOptions.project" has been set` on non-TS files → FlatCompat is applying the TS parser globally. Add `project: null` to the root-level `parserOptions` in `compat.config()`.

- [ ] **Step 3: Run TypeScript lint to confirm no regressions**

```bash
make lint-tsc
```

Expected: same result as before.

- [ ] **Step 4: Commit if any fixups were needed**

Only if Step 2 required changes to `eslint.config.mjs`:

```bash
git add eslint.config.mjs
git commit -m "fix: resolve eslint flat config compatibility issues"
```
