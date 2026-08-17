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
| Duplication  | `make lint-dup`     |
| Metrics      | `make lint-metrics` |
| Localization | `make lint-i18n`    |
| Full quality | `make lint`         |

## Protected Policy

- Do not lower thresholds in `config/metrics-policy.json`.
- Do not silence findings with `eslint-disable`, `// @ts-ignore`,
  `// @ts-nocheck`, `prettier-ignore`, `editorconfig-checker-disable`, or
  `markdownlint-disable`. Fix the root cause.
- Do not accept markdownlint failures in skills or docs.
- Do not commit generated snapshots unless the visual change is intentional.
- Do not narrow a gate's scan scope, drop `en` or `uk` from the i18n required
  set, or add an ignore entry to make `make lint-i18n` pass.

## Localization / i18n

`make lint-i18n` gates locale parity: both required locales present in every
`src/**/i18n/` catalog with no stray extras, identical `en`/`uk` key sets, a
`src/i18n/localization.json` that matches the generated merge of those catalogs,
and no `t()` key undefined in either locale.

Fix a parity or undefined-key failure by adding the translation or correcting
the key. Fix a stale merged catalog with `make i18n-generate`, then commit the
regenerated file; the build never produces it.

## Focused Test Gates

| Change type                   | Command                                               |
| ----------------------------- | ----------------------------------------------------- |
| Component or hook             | `make test-unit-client`                               |
| Apollo mock/server            | `make test-unit-server`                               |
| User journey                  | `make test-e2e`                                       |
| Visual layout                 | `make test-visual`                                    |
| Bundle or runtime performance | `make lighthouse-desktop` or `make lighthouse-mobile` |
| Localized strings (i18n)      | `make lint-i18n`                                      |

## Related Guides

Before applying this skill, confirm the active task against
[../AI-AGENT-GUIDE.md](../AI-AGENT-GUIDE.md) and
[../SKILL-DECISION-GUIDE.md](../SKILL-DECISION-GUIDE.md) so every relevant
skill is consulted.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.
