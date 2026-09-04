# Lint Gates

## Commands

```bash
make lint-eslint
make lint-tsc
make lint-md
make lint-dup
make lint-metrics
make lint-i18n
make lint
```

Run `make format`, then run the smallest failing check while fixing, then run
`make lint` before finishing. `make format` keeps formatting and style
consistent before linting.

## Localization / i18n

`make lint-i18n` is the locale-parity and undefined-key gate. It checks every
`src/**/i18n/` catalog for both required locales (`en`, `uk`) with no stray
extras, identical key sets across them, a `src/i18n/localization.json` that
still matches the generated merge of those catalogs, and no `t()` key that is
undefined in either locale. It runs inside `make lint` and the CI lint phase.

Route a failure by cause:

- Missing locale file, key-set mismatch, or undefined key: add the missing
  translation, or correct the key at the call site.
- Stale merged catalog: run `make i18n-generate` and commit the result. Never
  hand-edit `src/i18n/localization.json`.

## Rule Suppressions

Do not add `eslint-disable`, `// @ts-ignore`, `// @ts-nocheck`,
`prettier-ignore`, `editorconfig-checker-disable`, or `markdownlint-disable`
directives. Fix the code or the type contract so the rule's intent holds.

Configuration is not an escape hatch either: do not narrow a gate's scan scope,
drop a locale from the i18n required set, or add an ignore entry to make a check
pass.

If a rule genuinely cannot apply because of an external constraint, raise
it with the user before silencing anything; never silence to land a change.
