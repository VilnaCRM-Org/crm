# Complexity Quick Start

## Triage

```bash
make lint-metrics
```

Read the violation row: file, scope, subject, line, metric, value, and limit.

## Fix Path

1. If the subject is a component, separate container logic from rendering.
2. If the subject is a hook, extract pure decisions or data shaping helpers.
3. If the subject is a file, split by feature responsibility.
4. Re-run `make lint-metrics`.

## Common One-Line Fixes

- Deduplicate identical style objects.
- Move static arrays or maps outside component render.
- Replace nested ternaries with named helpers.
- Remove dead branches after verifying they are unused.
