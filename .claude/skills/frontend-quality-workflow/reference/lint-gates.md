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

Suppressions must be narrow and explained. Prefer changing code or types over
silencing a rule.
