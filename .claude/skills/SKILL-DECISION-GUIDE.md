# Skill Decision Guide

Use this guide to choose the smallest useful `.claude/skills` workflow.
BMAD skills remain available from `.agents/skills` for product, planning, and
multi-agent methods.

## Primary Routing

| Situation                                      | Skill                                |
| ---------------------------------------------- | ------------------------------------ |
| Build or modify React UI                       | `frontend-component-development`     |
| Add feature module structure                   | `code-organization`                  |
| Write Jest or Testing Library tests            | `frontend-testing-workflow`          |
| Run or debug broad test suites                 | `testing-workflow`                   |
| Fix lint, format, TypeScript, or metrics       | `frontend-quality-workflow`          |
| Understand quality thresholds                  | `quality-standards`                  |
| Reduce file or function complexity             | `complexity-management`              |
| Review PR comments                             | `code-review`                        |
| Create or update project docs                  | `documentation-creation`             |
| Keep docs aligned with code changes            | `documentation-sync`                 |
| Add Sentry, logs, or web-vitals signals        | `observability-instrumentation`      |
| Run K6 load checks                             | `load-testing`                       |
| Check Lighthouse, accessibility, or web-vitals | `frontend-performance-accessibility` |
| Validate CI-style readiness                    | `ci-workflow`                        |

## Backend Skills Not Ported

The user-service skills for API Platform CRUD, Doctrine/database migrations,
Deptrac, OpenAPI endpoint development, query analysis, and Structurizr are not
included here. This repo is a React/Rsbuild frontend; use the frontend skills
above unless the backend repository is the active workspace.

## Default Verification Choice

For code or markdown changes:

```bash
make format
make lint
```

For UI changes, add focused tests:

```bash
make test-unit-client
make test-e2e
make test-visual
```

For performance-sensitive UI changes:

```bash
make lighthouse-desktop
make lighthouse-mobile
```

## Support File Loading

After choosing a skill, read its `SKILL.md` first. Load support files only when
the `Supporting Files` section names a file that matches the current task.
