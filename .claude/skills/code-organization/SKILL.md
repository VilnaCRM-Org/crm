---
name: code-organization
description: Use when placing, moving, naming, or splitting frontend files.
---

# Code Organization

## Core Rule

Place code by ownership first, then by type. Prefer the existing module and
feature structure over new top-level abstractions.

## Frontend Structure

```text
src/
  modules/
    User/
      features/
      store/
      helpers/
  components/
  features/
  services/
  stores/
  config/
  routes/
  providers/
  utils/
```

Use `src/modules/<Module>/features/<Feature>/` for domain-owned workflows.
Use `src/components/UI*` only for reusable UI building blocks.

## Placement Rules

- Feature UI stays with its feature unless it is genuinely shared.
- Shared components use the `UI` prefix and MUI/Emotion patterns.
- API clients, RTK Query slices, and service adapters stay near their owner.
- Translation files live in feature `i18n/en.json` and `i18n/uk.json`.
- Tests mirror source ownership under `tests/`.
- Use `@/` imports instead of deep relative paths across folders.

## Naming Rules

- Components: PascalCase, reusable components prefixed with `UI`.
- Hooks: `useSomething`.
- Helpers: specific names, not `helper`, `misc`, or `utils` catch-alls.
- Redux slices and thunks: name by the module action they represent.
- Test files: match the subject and environment.

## Avoid

- New shared folders without existing demand from multiple callers.
- Cross-module imports that bypass public feature exports.
- Business strings hardcoded in JSX.
- Components that mix data fetching, layout, validation, and presentation when
  a hook or child component would make the boundary clearer.

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

- [examples/organization-fixes.md](examples/organization-fixes.md): concrete
  frontend placement and naming fixes.
- [reference/troubleshooting.md](reference/troubleshooting.md): guidance for
  ambiguous ownership, imports, and test placement.
