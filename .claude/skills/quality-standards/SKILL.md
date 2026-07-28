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
| Full quality | `make lint`         |

## Protected Policy

- Do not lower thresholds in `config/metrics-policy.json`.
- Do not silence findings with `eslint-disable`, `// @ts-ignore`,
  `// @ts-nocheck`, `prettier-ignore`, `editorconfig-checker-disable`, or
  `markdownlint-disable`. Fix the root cause.
- Do not accept markdownlint failures in skills or docs.
- Do not commit generated snapshots unless the visual change is intentional.
- Do not weaken any budget named in `config/gate-thresholds.manifest.json` — the
  `gate ratchet` check fails the PR (issue #188). Strengthen the value instead, or
  take the relaxation deliberately with the `gate-relaxation` label plus a rationale
  in the PR body. Never drop a manifest entry to pass the check.
- Do not use the `!` non-null assertion in `src/**` — it suppresses a
  `noUncheckedIndexedAccess` result rather than narrowing it (issue #166). Use `??`,
  an explicit guard, `in`, `Map.get` plus guard, or optional chaining.
- Any new rule added to `.dependency-cruiser.js` must land with a violating fixture in
  `scripts/ci/depcruise-rule-fixtures.mjs`, or the completeness guard in
  `tests/unit/tooling/depcruise-rules.test.ts` fails the build (issue #181). Never
  satisfy that guard by deleting the rule or by padding a fixture's `alsoFires` list —
  a legitimate co-fire must also be added to `DOCUMENTED_SUBSET_OVERLAPS` in the test,
  which is a separate reviewed edit.

## Focused Test Gates

| Change type                   | Command                                               |
| ----------------------------- | ----------------------------------------------------- |
| Component or hook             | `make test-unit-client`                               |
| Apollo mock/server            | `make test-unit-server`                               |
| User journey                  | `make test-e2e`                                       |
| Visual layout                 | `make test-visual`                                    |
| Bundle or runtime performance | `make lighthouse-desktop` or `make lighthouse-mobile` |

## Related Guides

Before applying this skill, confirm the active task against
[../AI-AGENT-GUIDE.md](../AI-AGENT-GUIDE.md) and
[../SKILL-DECISION-GUIDE.md](../SKILL-DECISION-GUIDE.md) so every relevant
skill is consulted.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.
