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

| Failure         | First response                                               |
| --------------- | ------------------------------------------------------------ |
| Formatting diff | Re-run `make format` and inspect changed files               |
| ESLint          | Fix the reported rule; never silence with eslint-disable     |
| TypeScript      | Fix the type contract; do not add `@ts-ignore`/`@ts-nocheck` |
| Markdown        | Keep headings, fences, and lines markdownlint-compliant      |
| Metrics         | Split dense functions or files; do not lower thresholds      |
| Tests           | Reproduce the specific failing suite before changing code    |

## Completion Checklist

- [ ] `make format` ran after edits.
- [ ] Focused tests ran for changed behavior.
- [ ] `make lint` passed or any blocker is documented.
- [ ] `git status --short` shows only intended files.

## Related Guides

Before applying this skill, confirm the active task against
[../AI-AGENT-GUIDE.md](../AI-AGENT-GUIDE.md) and
[../SKILL-DECISION-GUIDE.md](../SKILL-DECISION-GUIDE.md) so every relevant
skill is consulted.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.
