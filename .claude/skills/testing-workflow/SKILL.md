---
name: testing-workflow
description: Use when selecting, running, or triaging frontend test suites.
---

# Testing Workflow

## Test Routing

| Need                    | Command                   |
| ----------------------- | ------------------------- |
| All unit tests          | `make test-unit-all`      |
| Client unit tests       | `make test-unit-client`   |
| Server/Apollo tests     | `make test-unit-server`   |
| Integration tests       | `make test-integration`   |
| E2E tests               | `make test-e2e`           |
| Visual regression       | `make test-visual`        |
| Update visual snapshots | `make test-visual-update` |
| Memory leaks            | `make test-memory-leak`   |
| Mutation                | `make test-mutation`      |

`make test-e2e` and `make test-visual` also run the mobile-device lane (`mobile-chrome` /
`mobile-safari` projects over `tests/e2e/mobile` and `tests/visual/mobile`); there is no
separate command for it. This holds for the default `ENV=prod` only — with `ENV=dev` the
touch E2E lane runs on `mobile-chrome-dev` alone and the mobile visual lane does not run.

## Triage

1. Re-run the smallest failing suite.
2. Read the first real failure before editing code.
3. Confirm whether the failure is app logic, test data, mock state, or snapshot drift.
4. Fix the cause, not the symptom.
5. Re-run the focused suite, then run `make format` and `make lint`.

A test that fails only because it emitted `console.error` / `console.warn` is the console gate
(issue #192), installed in every Jest setup file. Fix the emitting path, or spy on the call **and
assert it** in that one test; never widen `tests/console-gate/allowlist.ts`. See
[tests/console-gate/README.md](../../../tests/console-gate/README.md).

## Frontend Rules

- Testing Library assertions should reflect user-observable behavior.
- Prefer accessible role and label locators in Playwright.
- Keep Mockoon and Apollo mock behavior explicit in test setup.
- Update visual snapshots only after inspecting the diff.
- Add regression coverage for bug fixes before changing behavior.

## Related Guides

Before applying this skill, confirm the active task against
[../AI-AGENT-GUIDE.md](../AI-AGENT-GUIDE.md) and
[../SKILL-DECISION-GUIDE.md](../SKILL-DECISION-GUIDE.md) so every relevant
skill is consulted.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.
