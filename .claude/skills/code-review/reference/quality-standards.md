# Code Review Quality Standards

## Review Comment Fix Order

1. Reproduce bugs or failing tests first.
2. Apply exact suggestions only after checking nearby code.
3. Run the narrowest relevant test.
4. Run `make format` before `make lint`.

## Do Not Trade Quality For Silence

- Do not lower `config/metrics-policy.json`.
- Do not add broad ESLint disables.
- Do not weaken TypeScript types to satisfy a local error.
- Do not update visual snapshots without inspecting the diff.

## Evidence To Mention In Review

Use concrete checks:

```bash
make lint-md
make test-unit-client
make test-e2e
make lint
```

If a check cannot run, say why and include the narrowest check that did run.
