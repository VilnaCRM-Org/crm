# Analysis Tools

## Primary Gate

```bash
make lint-metrics
```

This runs rust-code-analysis against `src/` using `config/metrics-policy.json`.

## Full Quality Gate

```bash
make format
make lint
```

Use this after complexity changes because splitting files can also affect ESLint
and TypeScript.

## Useful Inspection Commands

```bash
rg "function ComponentName|const ComponentName" src/
rg "use[A-Z].*=" src/modules
rg "sx=|styled\\(" src/
```

Use search to find related components, hooks, and style definitions before
moving code.
