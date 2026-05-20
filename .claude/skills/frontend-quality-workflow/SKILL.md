---
name: frontend-quality-workflow
description: Use when running or fixing formatting, lint, TypeScript, markdown, or metrics.
---

# Frontend Quality Workflow

## Required Order

```bash
make format
make lint
```

`make format` runs:

```bash
bun x prettier "**/*.{js,jsx,ts,tsx,mts,json,css,scss,md}" --write
qlty fmt --all --trigger agent --no-progress
```

If `make fmt-qlty` fails because `qlty` is not installed, install the Qlty CLI
first:

```bash
command -v qlty >/dev/null || {
  installer="$(mktemp)" \
    && curl -fsSL https://qlty.sh -o "$installer" \
    && sh "$installer"
  rm -f "$installer"
}
```

Then ensure `qlty` is on `PATH` and rerun `make fmt-qlty`. Do not run
`qlty init` or stage `.qlty/qlty.toml` unless the task explicitly asks for repo
Qlty configuration.

## Individual Checks

| Check          | Command             |
| -------------- | ------------------- |
| Qlty formatter | `make fmt-qlty`     |
| Prettier       | `make fmt-prettier` |
| ESLint         | `make lint-eslint`  |
| TypeScript     | `make lint-tsc`     |
| Markdown       | `make lint-md`      |
| Metrics        | `make lint-metrics` |

## Fix Rules

- Prefer code changes over disabling rules.
- Keep TypeScript types honest; avoid `any` unless the boundary requires it.
- Keep markdown skill frontmatter to `name` and `description`.
- Split complex components, hooks, and helpers instead of lowering metrics policy.
- Re-run the failing check after each focused fix.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.

## Supporting Files

- [reference/formatting-tools.md](reference/formatting-tools.md): Prettier and
  Qlty target behavior.
- [reference/lint-gates.md](reference/lint-gates.md): lint command routing.
- [reference/metrics-policy.md](reference/metrics-policy.md): metrics policy
  and common fixes.
