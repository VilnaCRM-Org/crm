# Lint Gates

## Commands

```bash
make lint-eslint
make lint-tsc
make lint-md
make lint-metrics
make lint
```

Run `make format`, then run the smallest failing check while fixing, then run
`make lint` before finishing. `make format` keeps formatting and style
consistent before linting.

## Rule Suppressions

Do not add `eslint-disable`, `// @ts-ignore`, `// @ts-nocheck`,
`prettier-ignore`, `editorconfig-disable`, or `markdownlint-disable`
directives. Fix the code or the type contract so the rule's intent holds.

If a rule genuinely cannot apply because of an external constraint, raise
it with the user before silencing anything; never silence to land a change.
