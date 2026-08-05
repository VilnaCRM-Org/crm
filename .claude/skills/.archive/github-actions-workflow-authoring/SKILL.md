---
name: github-actions-workflow-authoring
description: Use when authoring or reviewing GitHub Actions workflows with `paths:` gates. Ensure the workflow file itself + toolchain dependencies are included in `paths:` to prevent silent gate skip on workflow changes.
---

## Workflow `paths:` gate pattern

When a GitHub Actions workflow uses a `paths:` filter to gate jobs on file changes, include the workflow file **itself** in the `paths:` list. Otherwise, edits to the workflow go unvalidated—the gate silently skips execution.

### Why this matters

A workflow like `bundle-size.yml` that gates on `src/**` changes will not run when the workflow file itself or its build inputs change, because they are not in the `paths:` list. This allows changes to how the gate runs to slip through without validation.

### Toolchain dependencies

GitHub Actions workflows that invoke Docker or Makefile commands depend on:

- The workflow file itself (e.g., `.github/workflows/your-workflow.yml`)
- `Dockerfile` (if jobs run `docker compose`)
- `Makefile` (if jobs call `make` targets)
- `docker-compose.yml` (if jobs use compose)
- `.dockerignore` (if Docker build context is optimized)
- `rsbuild.config.ts` (if jobs build the bundle)

Include all of these in the workflow's `paths:` filter. A workflow that bundles or lints must not silently skip because someone changed the build configuration.

### Reference pattern

The `bundle-size.yml` and `static-testing.yml` workflows establish the canonical `paths:` list for dev-container workflows:

```yaml
paths:
  - src/**
  - tests/**
  - package.json
  - bun.lock
  - Dockerfile
  - .dockerignore
  - Makefile
  - docker-compose.yml
  - rsbuild.config.ts
  - .github/workflows/your-workflow.yml
```

When adding a new workflow, copy this pattern and adjust only the job-specific triggers (e.g., add `config/performance-budget.json` if your job gates on bundle size).

### Verification

Run `make lint-actionlint` to verify workflow syntax and structure.
