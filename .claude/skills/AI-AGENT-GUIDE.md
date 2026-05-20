# AI Agent Guide

This guide is the entry point for non-BMAD agent skills in this repository.
BMAD workflows live only in `.agents/skills`; `.claude/skills` contains
frontend project skills for day-to-day implementation, review, and validation.

## Repository Profile

- React 18.3 with TypeScript, MUI v7, Emotion, Redux Toolkit, and RTK Query.
- React Router v6 with route definitions in `App.tsx` and related route modules.
- `react-i18next` with Ukrainian as the primary language and English fallback.
- Rsbuild/Rspack build pipeline, Bun lockfile, and Docker-backed Makefile targets.
- Jest, Testing Library, Playwright, visual tests, Lighthouse, K6, Memlab, and Stryker.

## Default Workflow

1. Inspect the nearby code and tests before editing.
2. Use the narrowest skill that matches the task.
3. Keep BMAD planning and agent workflows in `.agents/skills`.
4. Keep project implementation helpers in `.claude/skills`.
5. Run `make format` before `make lint` for code or markdown changes.

`make format` runs Prettier and `qlty fmt`. `make lint` is the verification suite
and should not be treated as a formatter.

## Common Commands

```bash
make format
make lint
make lint-md
make test-unit-client
make test-unit-server
make test-e2e
make test-visual
make test-load
make lighthouse-desktop
make lighthouse-mobile
```

All shell commands issued by Codex in this repository must be prefixed with `rtk`.

## Skill Layout

- `.agents/skills/bmad-*`: BMAD agents, planning workflows, and interactive methods.
- `.claude/skills/*`: frontend implementation, quality, review, and docs guidance.
- Backend-only user-service skills are intentionally omitted unless they have a
  frontend equivalent.

Most `.claude/skills/*/SKILL.md` files include a “Supporting Files” section.
Read linked `examples`, `reference`, or `update-scenarios` files only when they
match the active task.

## Fast Routing

- Component or feature work: `frontend-component-development`.
- Jest, Testing Library, Playwright, or snapshots: `frontend-testing-workflow`.
- Formatting, linting, TypeScript, markdown, or metrics: `frontend-quality-workflow`.
- Lighthouse, web-vitals, rendering cost, or accessibility: `frontend-performance-accessibility`.
- PR comments: `code-review`.
- General test routing: `testing-workflow`.
- K6 load checks: `load-testing`.
