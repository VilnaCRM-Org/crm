# Frontend Agent Skills

This folder contains repository-specific non-BMAD skills for the VilnaCRM React
frontend. BMAD skills are intentionally stored only in `.agents/skills`.

## Included Skills

- `ci-workflow`: CI-style validation order for frontend changes.
- `code-organization`: React module, component, service, and test placement.
- `code-review`: PR comment retrieval and review-response workflow.
- `complexity-management`: rust-code-analysis and component complexity reduction.
- `documentation-creation`: project documentation creation standards.
- `documentation-sync`: documentation updates after code and workflow changes.
- `frontend-component-development`: React, MUI, Emotion, i18n component work.
- `frontend-performance-accessibility`: Lighthouse, web-vitals, and a11y checks.
- `frontend-quality-workflow`: `qlty fmt`, Prettier, ESLint, TypeScript, markdown,
  and metrics.
- `frontend-testing-workflow`: Jest, Testing Library, Playwright, visual, Mockoon,
  and Apollo mock testing.
- `load-testing`: K6 load testing for frontend flows.
- `observability-instrumentation`: Sentry, web-vitals, and structured client signals.
- `quality-standards`: protected quality gates and command map.
- `testing-workflow`: general test suite routing and failure triage.

## Required Quality Order

Agents should run formatting before verification:

```bash
make format
make lint
```

`make format` includes Prettier and `qlty fmt`. `make lint` runs ESLint,
TypeScript, markdownlint, and rust-code-analysis metrics.

## Progressive Disclosure

Skills keep high-level routing in `SKILL.md` and place deeper examples or
reference material under `examples/`, `reference/`, or `update-scenarios/`.
Load those files only when the task needs the extra detail.
