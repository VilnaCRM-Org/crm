---
name: ESLint v8 to v9 Migration Design
description: Design spec for migrating ESLint from v8 (legacy eslintrc) to v9 (flat config via FlatCompat bridge)
type: spec
issue: https://github.com/VilnaCRM-Org/crm/issues/16
date: 2026-03-26
---

# ESLint v8 → v9 Migration

## Overview

Migrate ESLint from version 8.56.0 to v9 using the **FlatCompat bridge** approach. All existing rules, plugins, and overrides are preserved verbatim. The only changes are the config container format, the deletion of `.eslintignore`, and the package version bump.

## Approach

Use `@eslint/eslintrc`'s `FlatCompat` utility — the officially supported ESLint migration path — to wrap the existing legacy config inside the new flat config format. No rules are changed, no plugins are upgraded.

## Files Changed

| Action | File |
|--------|------|
| Delete | `.eslintrc.js` |
| Delete | `.eslintignore` |
| Create | `eslint.config.mjs` |
| Update | `package.json` |

## Package Changes

| Package | From | To | Notes |
|---------|------|----|-------|
| `eslint` | `8.56.0` | `^9.x` | Core upgrade |
| `@eslint/js` | — | `^9.x` | New; provides `js.configs.recommended` for FlatCompat |
| `@eslint/eslintrc` | transitive | `^3.x` | Promote to direct dep (must be `^3.x`, not `^2.x`); provides `FlatCompat` |
| `eslint-plugin-react-hooks` | `^4.6.2` | `^5.x` | v4 peer dep caps at ESLint v8; v5 is required for ESLint v9 |

All other ESLint plugins stay at their current versions. `@typescript-eslint` v7 is compatible with ESLint v9.

## New Config Structure

`eslint.config.mjs` is an ESM file that:

1. Sets up `FlatCompat` with `baseDirectory`, `recommendedConfig`, and `allConfig`.
2. Exports a single `compat.config({...})` spread as the default export.
3. The object passed to `compat.config()` is the verbatim content of the current `.eslintrc.js`, with one addition: the `.eslintignore` entries (`scripts/`, `checkNodeVersion.js`, `out/`, `docker/`, `playwright-report/`) are merged into `ignorePatterns`.

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
    // verbatim .eslintrc.js content,
    // with .eslintignore entries merged into ignorePatterns
  }),
];
```

## `.eslintignore` Migration

The current `.eslintignore` contains:

```
scripts/
checkNodeVersion.js
out/
docker/
playwright-report/
```

These are added to the `ignorePatterns` array already present in `.eslintrc.js`:

```js
ignorePatterns: [
  'node_modules/*',
  'docker-compose.yml',
  'bun.lock*',
  'build/*',
  'coverage/*',
  'storybook-static/*',
  '.eslintrc.js',      // becomes 'eslint.config.mjs'
  'memlab/*',
  // added from .eslintignore:
  'scripts/*',
  'checkNodeVersion.js',
  'out/*',
  'docker/*',
  'playwright-report/*',
],
```

Note: the self-reference `.eslintrc.js` in ignorePatterns is updated to `eslint.config.mjs`.

## Known Inert Code

The `.eslintrc.js` override for `scripts/cloudfront_routing.js` (which sets `ecmaVersion: 5` and ES5-specific rules) is currently unreachable — the entire `scripts/` directory is already excluded by `.eslintignore`. After migration, `scripts/*` moves into `ignorePatterns`, so that override remains equally inert. It is preserved verbatim in the migrated config; no functional change occurs.

## CI / Makefile

The primary `lint-eslint` target (`bunx eslint .`) requires no changes — ESLint v9 auto-detects `eslint.config.mjs`.

The `run-eslint-tests-dind` target (`docker exec ... npx eslint .`) is also unaffected: it runs against the same working directory where `eslint.config.mjs` will exist after migration. No Makefile changes required.

## Testing

After implementation, verify:

1. `make lint-eslint` passes with zero errors (or the same errors as before the migration).
2. The number of reported lint violations does not change unexpectedly.

## Out of Scope

- Upgrading any ESLint plugins
- Changing any lint rules
- Migrating from FlatCompat to native flat config
- Upgrading `@typescript-eslint` to v8
