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

## Triage

1. Re-run the smallest failing suite.
2. Read the first real failure before editing code.
3. Confirm whether the failure is app logic, test data, mock state, or snapshot drift.
4. Fix the cause, not the symptom.
5. Re-run the focused suite, then run `make format` and `make lint`.

## Frontend Rules

- Testing Library assertions should reflect user-observable behavior.
- Prefer accessible role and label locators in Playwright.
- Keep Mockoon and Apollo mock behavior explicit in test setup.
- Update visual snapshots only after inspecting the diff.
- Add regression coverage for bug fixes before changing behavior.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.
