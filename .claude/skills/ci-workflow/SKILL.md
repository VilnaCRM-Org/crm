---
name: ci-workflow
description: Use when validating frontend changes before commit, push, or PR.
---

# CI Workflow

## Core Rule

Run mutating formatters before verification:

```bash
make format
make lint
```

`make format` runs Prettier and `qlty fmt`. `make lint` is a read-only gate for
ESLint, TypeScript, markdownlint, and rust-code-analysis metrics.

## Standard Validation

Choose the smallest useful set, then run the full gate before committing:

- Markdown or skills only: `make format`, `make lint-md`, then `make lint`.
- React code: add `make test-unit-client`.
- Apollo/server mock code: add `make test-unit-server`.
- User flows: add `make test-e2e`.
- Visual UI changes: add `make test-visual`.
- Performance-sensitive changes: add Lighthouse or K6 checks.

## Failure Handling

| Failure         | First response                                            |
| --------------- | --------------------------------------------------------- |
| Formatting diff | Re-run `make format` and inspect changed files            |
| ESLint          | Fix the reported rule without disabling it by default     |
| TypeScript      | Fix the type contract, not just the local error           |
| Markdown        | Keep headings, fences, and lines markdownlint-compliant   |
| Metrics         | Split dense functions or files; do not lower thresholds   |
| Tests           | Reproduce the specific failing suite before changing code |

## Completion Checklist

- [ ] `make format` ran after edits.
- [ ] Focused tests ran for changed behavior.
- [ ] `make lint` passed or any blocker is documented.
- [ ] `git status --short` shows only intended files.
