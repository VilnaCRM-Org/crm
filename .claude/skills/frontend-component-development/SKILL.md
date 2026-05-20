---
name: frontend-component-development
description: Use when building or changing React components, hooks, forms, or feature UI.
---

# Frontend Component Development

## Stack

Use React 18.3, TypeScript, MUI v7, Emotion, Redux Toolkit, RTK Query,
React Router v6, `react-hook-form`, and `react-i18next` patterns already present
in the repo.

## Workflow

1. Find the owning module or shared component boundary.
2. Read nearby components, hooks, i18n files, and tests.
3. Add or update tests before behavior changes when practical.
4. Keep UI copy in `en.json` and `uk.json`.
5. Verify with formatting, focused tests, and lint.

## Component Rules

- Reusable components belong in `src/components` and use a `UI` prefix.
- Feature components stay inside their owning module/feature.
- Use MUI components and theme tokens before custom CSS.
- Use Emotion styles that are stable and scoped.
- Use icons from `@mui/icons-material` when an icon exists.
- Keep button labels and form errors translated.
- Keep data fetching and mutation side effects out of presentational components.

## Verification

```bash
make format
make test-unit-client
make lint
```

For visible layout changes, also run:

```bash
make test-visual
```

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.

## Supporting Files

- [examples/mui-feature-component.md](examples/mui-feature-component.md): MUI
  feature component example.
- [examples/localized-form.md](examples/localized-form.md): form and i18n
  example.
- [reference/module-structure.md](reference/module-structure.md): feature
  folder layout.
- [reference/mui-emotion-patterns.md](reference/mui-emotion-patterns.md): MUI,
  Emotion, and icon guidance.
- [reference/i18n-patterns.md](reference/i18n-patterns.md): translation file
  rules.
