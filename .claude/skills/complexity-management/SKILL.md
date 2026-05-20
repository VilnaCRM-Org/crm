---
name: complexity-management
description: Use when frontend files, components, hooks, or helpers exceed complexity gates.
---

# Complexity Management

## Protected Gate

This repo uses rust-code-analysis through `make lint-metrics`. Thresholds live in
`config/metrics-policy.json` and must not be lowered to pass a change.

## Common Frontend Hotspots

- Large component bodies that combine data loading, form state, and rendering.
- Hooks with many conditional branches.
- Validation functions with dense boolean logic.
- Files that mix component code, styles, types, mocks, and helpers.

## Refactoring Moves

- Extract pure helpers for validation and data shaping.
- Split presentational subcomponents from container logic.
- Move repeated state transitions into hooks.
- Replace nested conditionals with guard clauses or lookup maps.
- Keep style objects close to the component but outside render work when stable.
- Split oversized files by ownership, not by arbitrary line count.

## Verification

```bash
make lint-metrics
make lint
```

If UI behavior changes while reducing complexity, also run the focused client,
E2E, or visual test that covers the changed path.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.

## Supporting Files

- [refactoring-strategies.md](refactoring-strategies.md): frontend refactoring
  moves for components, hooks, helpers, and styles.
- [reference/quick-start.md](reference/quick-start.md): fast triage path.
- [reference/analysis-tools.md](reference/analysis-tools.md): useful commands.
- [reference/complexity-metrics.md](reference/complexity-metrics.md): metric
  meanings and typical fixes.
- [reference/project-configuration.md](reference/project-configuration.md):
  repo-specific metrics configuration.
- [reference/troubleshooting.md](reference/troubleshooting.md): common failure
  modes while reducing complexity.
