---
name: frontend-testing-workflow
description: Use when writing or fixing Jest, Testing Library, Playwright, or visual tests.
---

# Frontend Testing Workflow

## Unit Tests

- Client tests use Jest with jsdom and Testing Library.
- Server tests cover Apollo local mock behavior in the node environment.
- Mirror source ownership under `tests/unit/`.
- Test behavior through the public UI or exported API.
- Mock network and service boundaries intentionally; do not test mock internals.

## Playwright

- Use accessible locators first: role, label, text, and test IDs where needed.
- Keep setup state explicit.
- Use Mockoon-backed responses from `docker-compose.test.yml`.
- Prefer page helpers only when they remove real duplication.

## Visual Tests

- Run visual checks for intentional layout changes.
- Inspect diffs before accepting snapshots.
- Use `make test-visual-update` only when the new rendering is correct.

## Commands

```bash
make test-unit-client
make test-unit-server
make test-e2e
make test-visual
make test-visual-update
```

Finish with:

```bash
make format
make lint
```

## Related Guides

Before applying this skill, confirm the active task against
[../AI-AGENT-GUIDE.md](../AI-AGENT-GUIDE.md) and
[../SKILL-DECISION-GUIDE.md](../SKILL-DECISION-GUIDE.md) so every relevant
skill is consulted.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.

## Supporting Files

- [examples/testing-library-component.md](examples/testing-library-component.md):
  component test example.
- [examples/playwright-flow.md](examples/playwright-flow.md): E2E flow example.
- [examples/visual-regression.md](examples/visual-regression.md): visual test
  example.
- [reference/jest-environments.md](reference/jest-environments.md): client,
  server, and integration test routing.
- [reference/mockoon-apollo.md](reference/mockoon-apollo.md): mock behavior.
- [reference/selectors-and-a11y.md](reference/selectors-and-a11y.md):
  accessible selector guidance.
