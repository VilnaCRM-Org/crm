---
name: quality-standards
description: Use when choosing or interpreting frontend quality gates.
---

# Quality Standards

## Required Order

```bash
make format
make lint
```

`make format` runs Prettier and `qlty fmt`. `make lint` runs the verification
suite and should not be used as a mutating formatter.

## Quality Gates

| Gate         | Command             |
| ------------ | ------------------- |
| Formatting   | `make format`       |
| ESLint       | `make lint-eslint`  |
| TypeScript   | `make lint-tsc`     |
| Markdown     | `make lint-md`      |
| Metrics      | `make lint-metrics` |
| Full quality | `make lint`         |

## Protected Policy

- Do not lower thresholds in `config/metrics-policy.json`.
- Do not suppress ESLint or TypeScript failures without a narrow reason.
- Do not accept markdownlint failures in skills or docs.
- Do not commit generated snapshots unless the visual change is intentional.

## Focused Test Gates

| Change type                   | Command                                               |
| ----------------------------- | ----------------------------------------------------- |
| Component or hook             | `make test-unit-client`                               |
| Apollo mock/server            | `make test-unit-server`                               |
| User journey                  | `make test-e2e`                                       |
| Visual layout                 | `make test-visual`                                    |
| Bundle or runtime performance | `make lighthouse-desktop` or `make lighthouse-mobile` |

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.
